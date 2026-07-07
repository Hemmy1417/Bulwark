"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, ExternalLink, ArrowLeft, Sparkles } from "lucide-react";
import { useClaim, usePolicy } from "@/lib/hooks/useBulwark";
import { formatGen } from "@/lib/utils";
import { AddressDisplay } from "@/components/AddressDisplay";

export default function ClaimDetailPage() {
  const params = useParams<{ id: string }>();
  const claimId = params.id;
  const { data: claim, isLoading } = useClaim(claimId);
  const { data: policy } = usePolicy(claim?.policy_id ?? null);

  if (isLoading) {
    return (
      <div className="max-w-3xl px-6 lg:px-12 py-16 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gold-bright" />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="max-w-3xl px-6 lg:px-12 py-16 text-center space-y-4">
        <h1 className="display text-2xl">Claim not found</h1>
        <Link href="/ledger" className="btn btn-ghost">Back to ledger</Link>
      </div>
    );
  }

  const statusStyle = {
    PAID:           { border: "rgba(106, 177, 135, 0.5)", label: "Paid" },
    APPROVED:       { border: "rgba(201, 169, 97, 0.5)",  label: "Approved" },
    PENDING_PAYOUT: { border: "rgba(230, 199, 122, 0.5)", label: "Awaiting payout" },
    REJECTED:       { border: "rgba(195, 106, 106, 0.5)", label: "Rejected" },
  }[claim.status] ?? { border: "var(--hairline)", label: claim.status };

  return (
    <div className="max-w-3xl px-6 lg:px-12 py-12 space-y-8">
      <Link href="/ledger" className="inline-flex items-center gap-1.5 text-xs text-ivory-soft/60 hover:text-gold-bright">
        <ArrowLeft className="w-3 h-3" /> All claims
      </Link>

      <div>
        <div className="eyebrow mb-1">Claim ledger entry</div>
        <h1 className="display text-4xl">Claim #{claim.claim_id}</h1>
      </div>

      <div
        className="card p-6 space-y-5"
        style={{ borderColor: statusStyle.border }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Status" value={statusStyle.label} />
          <Stat label="AI cause" value={claim.ai_cause} mono />
          <Stat label="Slashed?" value={claim.ai_slashed ? "Yes" : "No"} />
          <Stat label="Confidence" value={`${claim.ai_confidence}/100`} mono />
        </div>

        <div className="hairline" />

        <div>
          <div className="eyebrow mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            AI reasoning
          </div>
          <p className="text-ivory-soft/90 leading-relaxed">{claim.ai_summary || "—"}</p>
        </div>

        <div className="hairline" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat label="Payout"     value={`${formatGen(claim.payout_wei)} GEN`} mono />
          <Stat label="Policy"     value={`#${claim.policy_id}`} link={`/policies`} />
          <Stat label="Filed (block)" value={String(claim.filed_at_block)} mono />
        </div>

        <div>
          <div className="eyebrow mb-2">Claimant</div>
          <AddressDisplay address={claim.claimant} showCopy />
        </div>
      </div>

      {policy && (
        <div className="card p-5 space-y-2">
          <div className="eyebrow">Underlying policy</div>
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm">
            <span>
              <span className="text-ivory-soft/50">Validator </span>
              <span className="mono">{policy.validator_identifier}</span>
            </span>
            <span>
              <span className="text-ivory-soft/50">on </span>
              <span className="mono">{policy.chain_label}</span>
            </span>
            <span>
              <span className="text-ivory-soft/50">Coverage </span>
              <span className="mono text-gold-bright">{formatGen(policy.coverage_wei)} GEN</span>
            </span>
          </div>
        </div>
      )}

      <div className="card p-5 space-y-3">
        <div className="eyebrow">Evidence submitted ({claim.evidence_urls.length})</div>
        <ul className="space-y-2">
          {claim.evidence_urls.map((u, i) => (
            <li key={i}>
              <a
                href={u}
                target="_blank"
                rel="noreferrer"
                className="text-sm mono text-gold-bright hover:underline break-all inline-flex items-center gap-1.5"
              >
                {u}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, mono, link }: { label: string; value: string; mono?: boolean; link?: string }) {
  const cls = mono ? "mono text-ivory" : "text-ivory";
  return (
    <div>
      <div className="eyebrow mb-0.5">{label}</div>
      {link ? (
        <Link href={link} className={`${cls} hover:text-gold-bright`}>{value}</Link>
      ) : (
        <div className={cls}>{value}</div>
      )}
    </div>
  );
}
