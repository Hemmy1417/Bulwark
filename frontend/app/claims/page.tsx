"use client";

import Link from "next/link";
import { Loader2, ScrollText } from "lucide-react";
import { useMyClaims } from "@/lib/hooks/useBulwark";
import { useWallet } from "@/lib/genlayer/wallet";
import { formatGen } from "@/lib/utils";
import type { Claim } from "@/lib/contracts/types";

const statusChipClass = (status: string) => {
  switch (status) {
    case "PAID":            return "chip chip-paid";
    case "APPROVED":        return "chip chip-active";
    case "PENDING_PAYOUT":  return "chip chip-pending";
    case "REJECTED":        return "chip chip-rejected";
    default:                return "chip chip-expired";
  }
};

const causeChipClass = (cause: string) => {
  switch (cause) {
    case "BUG":
    case "UNAVOIDABLE":  return "chip chip-paid";
    case "NEGLIGENCE":   return "chip chip-rejected";
    default:             return "chip chip-expired";
  }
};

export default function MyClaimsPage() {
  const { isConnected } = useWallet();
  const { data: claims, isLoading } = useMyClaims();

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 space-y-6">
      <div>
        <div className="eyebrow mb-1">Adjudication history</div>
        <h1 className="display text-4xl">My claims</h1>
      </div>

      {!isConnected ? (
        <EmptyCard title="Connect a wallet" body="Your filed claims show up here." />
      ) : isLoading ? (
        <div className="card p-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gold-bright" />
        </div>
      ) : !claims || claims.length === 0 ? (
        <EmptyCard
          title="No claims filed"
          body="File a claim from an active policy and the AI ruling appears here."
        />
      ) : (
        <div className="space-y-3">
          {claims.map((c) => <ClaimRow key={c.claim_id} claim={c} />)}
        </div>
      )}
    </div>
  );
}

function ClaimRow({ claim }: { claim: Claim }) {
  return (
    <Link href={`/claims/${claim.claim_id}`} className="block card p-5 hover:border-gold/40 transition-colors">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="eyebrow">Claim #{claim.claim_id}</span>
            <span className="text-ivory-soft/40">·</span>
            <span className="text-xs text-ivory-soft/60">on policy #{claim.policy_id}</span>
          </div>
          <p className="text-sm text-ivory-soft/85 leading-relaxed line-clamp-2">
            {claim.ai_summary || "AI reasoning pending…"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={causeChipClass(claim.ai_cause)}>{claim.ai_cause}</span>
          <span className={statusChipClass(claim.status)}>{claim.status}</span>
        </div>
      </div>
      <div className="hairline mt-4 mb-3" />
      <div className="flex items-center justify-between text-xs">
        <span className="text-ivory-soft/50">
          Confidence <span className="mono text-ivory-soft/80">{claim.ai_confidence}/100</span>
        </span>
        <span className="text-ivory-soft/50">
          Payout <span className="mono text-gold-bright">{formatGen(claim.payout_wei)} GEN</span>
        </span>
      </div>
    </Link>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-10 text-center space-y-3">
      <ScrollText className="w-10 h-10 mx-auto text-ivory-soft/25" />
      <h3 className="display text-2xl">{title}</h3>
      <p className="text-ivory-soft/60">{body}</p>
    </div>
  );
}
