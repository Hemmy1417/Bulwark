import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type {
  Policy,
  Claim,
  ProtocolParams,
  PremiumQuote,
  TransactionReceipt,
} from "./types";

/**
 * Typed wrapper around the Bulwark Intelligent Contract.
 * Read methods return safe defaults on read failure so a fresh deployment
 * with no policies yet doesn't crash the UI. Write methods reject on
 * UNDETERMINED consensus (default waitForTransactionReceipt returns even
 * then, which quietly leaves the UI in a stale state).
 */
class Bulwark {
  private contractAddress: `0x${string}`;
  private client: ReturnType<typeof createClient>;

  constructor(contractAddress: string, address?: string | null) {
    this.contractAddress = contractAddress as `0x${string}`;
    const config: any = { chain: studionet };
    if (address) config.account = address as `0x${string}`;
    this.client = createClient(config);
  }

  private toObj(raw: any): Record<string, any> {
    if (!raw) return {};
    if (raw instanceof Map) return Object.fromEntries(raw.entries());
    if (typeof raw === "object") return raw;
    return {};
  }

  private async safeRead(functionName: string, args: any[] = []): Promise<any> {
    try {
      return await this.client.readContract({
        address: this.contractAddress,
        functionName,
        args,
      });
    } catch (err) {
      console.warn(`[Bulwark] safeRead "${functionName}" failed:`, err);
      return null;
    }
  }

  private async waitAndVerify(txHash: `0x${string}`): Promise<TransactionReceipt> {
    const receipt = (await this.client.waitForTransactionReceipt({
      hash: txHash as any,
      status: "ACCEPTED" as any,
      retries: 80,
      interval: 5000,
    })) as any;
    const status = String(receipt?.status ?? "").toUpperCase();
    const cd = receipt?.consensus_data ?? {};
    const lr = cd.leader_receipt;
    const r = Array.isArray(lr) ? lr[0] : lr;
    if (status.includes("UNDETERMINED") || status.includes("CANCELED")) {
      throw new Error("Validators could not reach consensus — try again");
    }
    if (r?.execution_result === "ERROR") {
      const stderr: string = r?.genvm_result?.stderr ?? "";
      // A clean gl.vm.UserError reverts with EMPTY stderr — its message rides in
      // a rollback "payload" field, not stderr. Walk the whole receipt for it.
      const payloads: string[] = [];
      const walk = (o: any, d = 0) => {
        if (!o || d > 8) return;
        if (Array.isArray(o)) { o.forEach((x) => walk(x, d + 1)); return; }
        if (typeof o === "object") {
          if (typeof o.payload === "string" && o.payload && o.payload !== "exit_code 1") payloads.push(o.payload);
          Object.values(o).forEach((v) => walk(v, d + 1));
        }
      };
      walk(receipt);
      const userErr = stderr.match(/UserError: (.+)/)?.[1];
      const msg = userErr || payloads.sort((a, b) => b.length - a.length)[0] || "";
      console.error("[Bulwark] contract execution error:", { stderr, payloads, receipt });
      if (msg) throw new Error(msg.slice(0, 240));
      const lines = stderr.trim().split("\n").filter((l) => l.trim() && !l.startsWith("  "));
      const last = lines[lines.length - 1] || "";
      const specific = last.replace(/^.*?Error: /, "").slice(0, 240);
      throw new Error(specific || "Contract execution error — check the console for the traceback");
    }
    return receipt as TransactionReceipt;
  }

  parseReturnPayload(receipt: any): any | null {
    const lr = receipt?.consensus_data?.leader_receipt;
    const r = Array.isArray(lr) ? lr[0] : lr;
    const raw = r?.result?.payload?.readable ?? r?.result?.readable ?? null;
    if (typeof raw !== "string") return null;
    try { return JSON.parse(JSON.parse(raw)); } catch { return null; }
  }

  private normalisePolicy(obj: Record<string, any>): Policy {
    return {
      ...obj,
      policy_id:        String(obj.policy_id ?? ""),
      duration_days:    Number(obj.duration_days ?? 0),
      created_at_block: Number(obj.created_at_block ?? 0),
      expires_at_block: Number(obj.expires_at_block ?? 0),
      coverage_wei:     String(obj.coverage_wei ?? "0"),
      premium_wei:      String(obj.premium_wei ?? "0"),
      claim_id:         obj.claim_id == null ? null : String(obj.claim_id),
    } as Policy;
  }

  private normaliseClaim(obj: Record<string, any>): Claim {
    return {
      ...obj,
      claim_id:        String(obj.claim_id ?? ""),
      policy_id:       String(obj.policy_id ?? ""),
      ai_confidence:   Number(obj.ai_confidence ?? 0),
      filed_at_block:  Number(obj.filed_at_block ?? 0),
      payout_wei:      String(obj.payout_wei ?? "0"),
      evidence_urls:   Array.isArray(obj.evidence_urls) ? obj.evidence_urls : [],
    } as Claim;
  }

  // ── READ ────────────────────────────────────────────────────────────────

  async getProtocolParams(): Promise<ProtocolParams | null> {
    const raw = await this.safeRead("get_protocol_params");
    if (!raw) return null;
    const p = this.toObj(raw);
    // duration_rates_bps arrives as a map with BigInt values (u256). Coerce
    // each entry to Number here so any downstream arithmetic (e.g. bps / 100)
    // doesn't hit "Cannot mix BigInt and other types".
    const ratesRaw = this.toObj(p.duration_rates_bps ?? {});
    const rates: Record<string, number> = {};
    for (const [k, v] of Object.entries(ratesRaw)) {
      rates[String(k)] = Number(v ?? 0);
    }
    return {
      ...p,
      reserve_wei:              String(p.reserve_wei ?? "0"),
      outstanding_exposure_wei: String(p.outstanding_exposure_wei ?? "0"),
      solvency_ratio_bps:       Number(p.solvency_ratio_bps ?? 0),
      total_premiums_wei:       String(p.total_premiums_wei ?? "0"),
      total_payouts_wei:        String(p.total_payouts_wei ?? "0"),
      active_policy_count:      Number(p.active_policy_count ?? 0),
      total_policies:           Number(p.total_policies ?? 0),
      total_claims:             Number(p.total_claims ?? 0),
      experience_bps:           Number(p.experience_bps ?? 0),
      duration_rates_bps:       rates,
    } as ProtocolParams;
  }

  async previewPremium(
    coverageWei: bigint, durationDays: number,
    chainLabel: string = "ethereum", holder: string = "",
  ): Promise<PremiumQuote | null> {
    const raw = await this.safeRead("preview_premium", [coverageWei, durationDays, chainLabel, holder]);
    if (!raw) return null;
    const q = this.toObj(raw);
    return {
      coverage_wei:       String(q.coverage_wei ?? "0"),
      duration_days:      Number(q.duration_days ?? durationDays),
      base_bps:           Number(q.base_bps ?? 0),
      chain_risk_bps:     Number(q.chain_risk_bps ?? 10000),
      chain_adjusted_bps: Number(q.chain_adjusted_bps ?? 0),
      record_loadings:    Number(q.record_loadings ?? 0),
      record_bps:         Number(q.record_bps ?? 0),
      coverage_load_bps:  Number(q.coverage_load_bps ?? 0),
      experience_bps:     Number(q.experience_bps ?? 0),
      effective_bps:      Number(q.effective_bps ?? 0),
      premium_wei:        String(q.premium_wei ?? "0"),
    };
  }

  async getPolicy(policyId: string): Promise<Policy | null> {
    const raw = await this.safeRead("get_policy", [policyId]);
    if (!raw) return null;
    return this.normalisePolicy(this.toObj(raw));
  }

  async getClaim(claimId: string): Promise<Claim | null> {
    const raw = await this.safeRead("get_claim", [claimId]);
    if (!raw) return null;
    return this.normaliseClaim(this.toObj(raw));
  }

  async getPoliciesByOwner(owner: string): Promise<Policy[]> {
    const raw = await this.safeRead("get_policies_by_owner", [owner]);
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => this.normalisePolicy(this.toObj(r)));
  }

  async getClaimsByOwner(owner: string): Promise<Claim[]> {
    const raw = await this.safeRead("get_claims_by_owner", [owner]);
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => this.normaliseClaim(this.toObj(r)));
  }

  async getClaimLedger(limit = 50): Promise<Claim[]> {
    const raw = await this.safeRead("get_claim_ledger", [limit]);
    if (!Array.isArray(raw)) return [];
    return raw.map((r) => this.normaliseClaim(this.toObj(r)));
  }

  // ── WRITE ───────────────────────────────────────────────────────────────

  async buyPolicy(args: {
    validatorIdentifier: string;
    chainLabel: string;
    coverageWei: bigint;
    durationDays: number;
    premiumWei: bigint;
  }): Promise<{ receipt: TransactionReceipt; txHash: string }> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "buy_policy",
        args: [args.validatorIdentifier, args.chainLabel, args.coverageWei, args.durationDays],
        value: args.premiumWei,
      });
      const receipt = await this.waitAndVerify(txHash);
      return { receipt, txHash: String(txHash) };
    } catch (err) {
      console.error("[Bulwark] buyPolicy failed:", err);
      throw err instanceof Error ? err : new Error("Failed to buy policy");
    }
  }

  async fileClaim(args: {
    policyId: string;
    causeEvidenceUrls: string[];
  }): Promise<{ receipt: TransactionReceipt; txHash: string }> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "file_claim",
        // The authoritative slashing-status source is derived on-chain from
        // the policy's validator index — the claimant only adds cause URLs.
        args: [args.policyId, args.causeEvidenceUrls],
        value: BigInt(0),
      });
      const receipt = await this.waitAndVerify(txHash);
      return { receipt, txHash: String(txHash) };
    } catch (err) {
      console.error("[Bulwark] fileClaim failed:", err);
      throw err instanceof Error ? err : new Error("Failed to file claim");
    }
  }

  async appealClaim(args: {
    claimId: string;
    additionalCauseUrls: string[];
  }): Promise<{ receipt: TransactionReceipt; txHash: string }> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "appeal_claim",
        args: [args.claimId, args.additionalCauseUrls],
        value: BigInt(0),
      });
      const receipt = await this.waitAndVerify(txHash);
      return { receipt, txHash: String(txHash) };
    } catch (err) {
      console.error("[Bulwark] appealClaim failed:", err);
      throw err instanceof Error ? err : new Error("Failed to appeal claim");
    }
  }

  async ownerSeedReserve(amountWei: bigint): Promise<{ receipt: TransactionReceipt; txHash: string }> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "owner_seed_reserve",
        args: [],
        value: amountWei,
      });
      const receipt = await this.waitAndVerify(txHash);
      return { receipt, txHash: String(txHash) };
    } catch (err) {
      console.error("[Bulwark] ownerSeedReserve failed:", err);
      throw err instanceof Error ? err : new Error("Failed to seed reserve");
    }
  }

  async settlePendingPayout(claimId: string): Promise<{ receipt: TransactionReceipt; txHash: string }> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "settle_pending_payout",
        args: [claimId],
        value: BigInt(0),
      });
      const receipt = await this.waitAndVerify(txHash);
      return { receipt, txHash: String(txHash) };
    } catch (err) {
      console.error("[Bulwark] settlePendingPayout failed:", err);
      throw err instanceof Error ? err : new Error("Failed to settle payout");
    }
  }
}

export default Bulwark;
