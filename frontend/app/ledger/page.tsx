"use client";

import Link from "next/link";
import { Loader2, ScrollText } from "lucide-react";
import { useClaimLedger } from "@/lib/hooks/useBulwark";
import { formatGen } from "@/lib/utils";
import { AddressDisplay } from "@/components/AddressDisplay";
import type { Claim } from "@/lib/contracts/types";
import { HowTo } from "@/components/HowTo";

const causeChipClass = (cause: string) => {
  switch (cause) {
    case "BUG":
    case "UNAVOIDABLE":  return "chip chip-paid";
    case "NEGLIGENCE":   return "chip chip-rejected";
    default:             return "chip chip-expired";
  }
};

const statusChipClass = (status: string) => {
  switch (status) {
    case "PAID":            return "chip chip-paid";
    case "APPROVED":        return "chip chip-active";
    case "PENDING_PAYOUT":  return "chip chip-pending";
    case "REJECTED":        return "chip chip-rejected";
    default:                return "chip chip-expired";
  }
};

export default function LedgerPage() {
  const { data: claims, isLoading } = useClaimLedger(50);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 space-y-6">
      <div className="text-center max-w-xl mx-auto">
        <div className="eyebrow mb-1">Public record</div>
        <h1 className="display text-4xl mb-3">Ledger</h1>
        <p className="text-ivory-soft/70">
          Every claim Bulwark has ever adjudicated. Evidence, ruling, and payout — all
          verifiable on-chain, all replay-checkable.
        </p>
      </div>

      <HowTo
        id="ledger"
        title="Reading the ledger"
        intro="Every claim Bulwark has ever ruled on lives here. No moderation, no filtering — the full record so anyone can audit the panel's history."
        items={[
          { label: "Cause",  body: "The AI's cause bucket for the slashing. Green (BUG / UNAVOIDABLE) paid out. Red / grey did not." },
          { label: "Status", body: "Payment state. PAID means the transfer landed. PENDING_PAYOUT is an approved claim waiting on reserve top-up." },
          { label: "Payout", body: "Actual GEN transferred to the claimant. Zero for rejected claims — those are still logged so the reasoning is public." },
          { label: "Drill in", body: "Click any claim id to open the full detail: evidence URLs, AI reasoning paragraph, confidence score, block filed." },
        ]}
      />

      {isLoading ? (
        <div className="card p-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gold-bright" />
        </div>
      ) : !claims || claims.length === 0 ? (
        <div className="card p-10 text-center space-y-3">
          <ScrollText className="w-10 h-10 mx-auto text-ivory-soft/25" />
          <h3 className="display text-2xl">No claims yet</h3>
          <p className="text-ivory-soft/60">The ledger fills as claims are filed.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead style={{ background: "rgba(11, 31, 58, 0.6)" }}>
              <tr>
                <th className="eyebrow text-left px-4 py-3">Claim</th>
                <th className="eyebrow text-left px-4 py-3">Claimant</th>
                <th className="eyebrow text-left px-4 py-3">Cause</th>
                <th className="eyebrow text-left px-4 py-3">Status</th>
                <th className="eyebrow text-left px-4 py-3">Payout</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c: Claim) => (
                <tr key={c.claim_id} className="border-t border-hairline hover:bg-navy-mid/40 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/claims/${c.claim_id}`} className="mono text-gold-bright hover:underline">
                      #{c.claim_id}
                    </Link>
                    <div className="text-[11px] text-ivory-soft/40 mt-0.5">on policy #{c.policy_id}</div>
                  </td>
                  <td className="px-4 py-3"><AddressDisplay address={c.claimant} /></td>
                  <td className="px-4 py-3">
                    <span className={causeChipClass(c.ai_cause)}>{c.ai_cause}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusChipClass(c.status)}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 mono text-gold-bright">
                    {formatGen(c.payout_wei)} GEN
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
