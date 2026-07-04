"use client";

import Link from "next/link";
import { Loader2, ShieldCheck, PlusCircle } from "lucide-react";
import { useMyPolicies } from "@/lib/hooks/useBulwark";
import { useWallet } from "@/lib/genlayer/wallet";
import { formatGen } from "@/lib/utils";
import type { Policy } from "@/lib/contracts/types";

export default function MyPoliciesPage() {
  const { isConnected } = useWallet();
  const { data: policies, isLoading } = useMyPolicies();

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="eyebrow mb-1">Portfolio</div>
          <h1 className="display text-4xl">My policies</h1>
        </div>
        <Link href="/policies/new" className="btn btn-gold">
          <PlusCircle className="w-4 h-4" />
          Bind new policy
        </Link>
      </div>

      {!isConnected ? (
        <EmptyCard title="Connect a wallet" body="Your bound policies show up here." />
      ) : isLoading ? (
        <div className="card p-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gold-bright" />
        </div>
      ) : !policies || policies.length === 0 ? (
        <EmptyCard
          title="No policies yet"
          body="Bind cover on a validator and it will appear here with live status."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policies.map((p) => <PolicyCard key={p.policy_id} policy={p} />)}
        </div>
      )}
    </div>
  );
}

function PolicyCard({ policy }: { policy: Policy }) {
  const statusChip = {
    ACTIVE:   "chip chip-active",
    CLAIMED:  "chip chip-claimed",
    EXPIRED:  "chip chip-expired",
    REJECTED: "chip chip-rejected",
  }[policy.status] || "chip chip-expired";

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">Policy #{policy.policy_id}</div>
          <div className="display text-xl mt-0.5">Validator {policy.validator_identifier}</div>
          <div className="mono text-xs text-ivory-soft/50 mt-0.5">{policy.chain_label}</div>
        </div>
        <span className={statusChip}>{policy.status}</span>
      </div>

      <div className="hairline" />

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Stat label="Coverage"     value={`${formatGen(policy.coverage_wei)} GEN`} />
        <Stat label="Premium paid" value={`${formatGen(policy.premium_wei)} GEN`} />
        <Stat label="Duration"     value={`${policy.duration_days} days`} />
        <Stat label="Expires (block)" value={String(policy.expires_at_block)} mono />
      </div>

      {policy.status === "ACTIVE" && (
        <Link href={`/claims/new/${policy.policy_id}`} className="btn btn-ghost w-full">
          <ShieldCheck className="w-4 h-4" />
          File a claim
        </Link>
      )}
      {policy.claim_id && (
        <Link href={`/claims/${policy.claim_id}`} className="btn btn-ghost w-full">
          View claim #{policy.claim_id}
        </Link>
      )}
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="eyebrow mb-0.5">{label}</div>
      <div className={mono ? "mono text-ivory" : "text-ivory"}>{value}</div>
    </div>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-10 text-center space-y-2">
      <h3 className="display text-2xl">{title}</h3>
      <p className="text-ivory-soft/60">{body}</p>
    </div>
  );
}
