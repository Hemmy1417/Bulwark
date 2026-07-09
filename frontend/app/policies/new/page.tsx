"use client";

import { useMemo, useState } from "react";
import { Loader2, ShieldCheck, Info, ArrowRight } from "lucide-react";
import { useProtocolParams, usePreviewPremium, useBuyPolicy } from "@/lib/hooks/useBulwark";
import { useWallet } from "@/lib/genlayer/wallet";
import { parseGen, formatGen } from "@/lib/utils";
import { error as toastError } from "@/lib/toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HowTo } from "@/components/HowTo";

const DURATIONS = [7, 30, 90] as const;

export default function NewPolicyPage() {
  const router = useRouter();
  const { isConnected, address } = useWallet();
  const { data: params } = useProtocolParams();
  const { buyPolicy, isBuying } = useBuyPolicy();

  // Normalise both sides to the raw 40-hex body so checksum casing or a
  // literal placeholder string doesn't mismatch a real wallet.
  const normalizeAddress = (s: string | null | undefined): string | null => {
    if (!s) return null;
    const m = String(s).toLowerCase().replace(/^0x/, "").match(/^[0-9a-f]{40}$/);
    return m ? m[0] : null;
  };
  const isOwner = !!(
    normalizeAddress(address) &&
    normalizeAddress(address) === normalizeAddress(params?.owner)
  );

  const [chain, setChain] = useState("ethereum");
  const [validator, setValidator] = useState("");
  const [coverageText, setCoverageText] = useState("1");
  const [duration, setDuration] = useState<number>(30);

  const coverageWei = useMemo(() => {
    try { return parseGen(coverageText); } catch { return BigInt(0); }
  }, [coverageText]);

  const { data: quote, isFetching: quoting } = usePreviewPremium(
    coverageWei > BigInt(0) ? coverageWei : null,
    duration,
    chain,
  );

  const reserveWei = params?.reserve_wei ? BigInt(params.reserve_wei) : BigInt(0);
  const reserveShort = reserveWei < coverageWei;

  const submit = () => {
    if (!isConnected) return toastError("Connect your wallet first");
    if (!validator.trim()) return toastError("Enter a validator identifier");
    if (coverageWei <= BigInt(0)) return toastError("Enter a coverage amount");
    if (!quote) return toastError("Waiting for premium quote");
    buyPolicy({
      validatorIdentifier: validator.trim(),
      chainLabel: chain,
      coverageWei,
      durationDays: duration,
      premiumWei: BigInt(quote.premium_wei),
    }, {
      onSuccess: () => router.push("/policies"),
    });
  };

  return (
    <div className="max-w-3xl px-6 lg:px-12 py-14 space-y-8">
      <div className="text-center max-w-xl mx-auto">
        <div className="eyebrow mb-2">Bind cover</div>
        <h1 className="display text-4xl mb-3">Bind cover</h1>
        <p className="text-ivory-soft/70">
          Coverage runs from the block your policy binds. If your validator is slashed
          within that window, file a claim and let the AI panel rule.
        </p>
      </div>

      <HowTo
        id="buy-policy"
        reference="BW-01"
        title="Procedure for binding cover"
        intro="Cover binds on execution of the premium transfer. The period of insurance commences at the block in which the policy is written and expires at the end of the elected term."
        items={[
          { label: "Nomination of the validator", body: "Identify the validator to be insured. Ethereum requires the numeric beacon-chain index; Cosmos and EigenLayer use the operator's bech32 or hex address." },
          { label: "Election of the sum insured", body: "State the maximum payout should a covered loss occur. Sums must fall within the underwritten range of 0.1 GEN to 10 GEN inclusive." },
          { label: "Election of the period",     body: "Choose one of the underwritten terms — 7, 30, or 90 days. The premium rate scales with the length of exposure." },
          { label: "Settlement of the premium",  body: "Sign the quoted premium in GEN. Funds are held in the protocol reserve and released only against a covered ruling." },
        ]}
      />

      <div className="card p-6 space-y-5">

        <Field label="Chain">
          <select
            className="input"
            value={chain}
            onChange={(e) => setChain(e.target.value)}
          >
            <option value="ethereum">Ethereum</option>
            <option value="cosmos:cosmoshub-4">Cosmos Hub</option>
            <option value="eigenlayer:mainnet">EigenLayer (AVS)</option>
            <option value="other">Other</option>
          </select>
        </Field>

        <Field
          label="Validator identifier"
          hint="Ethereum validator index, Cosmos operator address, or a chain-scoped identifier."
        >
          <input
            className="input mono"
            placeholder={chain === "ethereum" ? "e.g. 123456" : "e.g. cosmosvaloper1…"}
            value={validator}
            onChange={(e) => setValidator(e.target.value)}
          />
        </Field>

        <Field label="Coverage (GEN)" hint="Bounds: 0.1 – 10 GEN.">
          <input
            className="input mono"
            type="number"
            step="0.01"
            min="0.1"
            max="10"
            value={coverageText}
            onChange={(e) => setCoverageText(e.target.value)}
          />
        </Field>

        <Field label="Duration">
          <div className="grid grid-cols-3 gap-2">
            {DURATIONS.map((d) => {
              const active = d === duration;
              return (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className="btn"
                  style={{
                    background: active ? "rgba(201, 169, 97, 0.12)" : "transparent",
                    border: `1px solid ${active ? "var(--gold)" : "var(--hairline)"}`,
                    color: active ? "var(--gold-bright)" : "var(--ivory)",
                  }}
                >
                  {d} days
                </button>
              );
            })}
          </div>
        </Field>

        <div className="hairline" />

        {/* Risk-priced quote — every component itemised, straight from the contract */}
        <div>
          <div className="eyebrow mb-2">Risk-priced quote</div>
          {quoting ? (
            <div className="text-sm text-ivory-soft/60"><Loader2 className="w-4 h-4 animate-spin inline" /> pricing…</div>
          ) : quote ? (
            <div className="rounded-sm overflow-hidden text-sm" style={{ border: "1px solid var(--hairline)" }}>
              <RateRow label={`Base rate (${duration}d)`} bps={quote.base_bps} />
              <RateRow label="Chain risk" mult={quote.chain_risk_bps} note={chain} />
              {quote.record_bps > 0 && <RateRow label={`Your claim record (${quote.record_loadings})`} bps={quote.record_bps} warn />}
              {quote.coverage_load_bps > 0 && <RateRow label="Large-policy load" bps={quote.coverage_load_bps} warn />}
              {quote.experience_bps > 0 && <RateRow label="Pool loss experience" bps={quote.experience_bps} warn />}
              <div className="flex items-center justify-between px-3 py-2.5" style={{ background: "rgba(230,199,122,0.08)" }}>
                <span className="text-ivory">Effective rate</span>
                <span className="mono text-gold-bright">{(quote.effective_bps / 100).toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5" style={{ background: "rgba(230,199,122,0.14)" }}>
                <span className="text-ivory font-medium">Premium due</span>
                <span className="mono text-gold-bright font-medium">{formatGen(quote.premium_wei)} GEN</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-ivory-soft/50">Enter a coverage amount to see your quote.</div>
          )}
        </div>

        {reserveShort && coverageWei > BigInt(0) && (
          <div
            className="p-3 rounded-sm flex items-start gap-3 text-sm"
            style={{ background: "rgba(195, 106, 106, 0.08)", border: "1px solid rgba(195, 106, 106, 0.3)" }}
          >
            <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--danger)" }} />
            <div className="flex-1 min-w-0 space-y-2">
              <p>
                Protocol reserve is <span className="mono">{formatGen(reserveWei)} GEN</span> —
                short of your requested <span className="mono">{formatGen(coverageWei)} GEN</span> coverage.
                {isOwner
                  ? " You're the protocol owner — top up the reserve to unlock this policy."
                  : " Reduce the coverage or ask the owner to top up the reserve."}
              </p>
              {isOwner && (
                <Link href="/pool" className="btn btn-ghost inline-flex text-xs">
                  Seed the reserve
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        )}

        <button
          className="btn btn-gold w-full"
          onClick={submit}
          disabled={isBuying || !isConnected || !quote || reserveShort}
        >
          {isBuying ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Binding cover…</>
          ) : (
            <><ShieldCheck className="w-4 h-4" /> Bind policy</>
          )}
        </button>

        {!isConnected && (
          <p className="text-xs text-center text-ivory-soft/50">Connect your wallet to bind a policy.</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block eyebrow mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-ivory-soft/50 mt-1.5">{hint}</p>}
    </div>
  );
}

function RateRow({ label, bps, mult, note, warn }: { label: string; bps?: number; mult?: number; note?: string; warn?: boolean }) {
  const value = mult !== undefined ? `×${(mult / 10000).toFixed(2)}` : `+${((bps ?? 0) / 100).toFixed(2)}%`;
  return (
    <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid var(--hairline)" }}>
      <span className="text-ivory-soft/80">
        {label}{note ? <span className="text-ivory-soft/40 mono text-xs"> · {note}</span> : null}
      </span>
      <span className="mono" style={{ color: warn ? "var(--danger)" : "var(--ivory)" }}>{value}</span>
    </div>
  );
}
