"use client";

import { useState } from "react";
import { Loader2, Landmark, Coins } from "lucide-react";
import { useProtocolParams, useOwnerSeedReserve } from "@/lib/hooks/useBulwark";
import { useWallet } from "@/lib/genlayer/wallet";
import { parseGen, formatGen } from "@/lib/utils";
import { AddressDisplay } from "@/components/AddressDisplay";
import { error as toastError } from "@/lib/toast";
import { HowTo } from "@/components/HowTo";

export default function PoolPage() {
  const { address } = useWallet();
  const { data: params, isLoading } = useProtocolParams();
  const { seedReserve, isSeeding } = useOwnerSeedReserve();
  const [seedText, setSeedText] = useState("1");

  // Both sides normalised to the raw 40-hex body so we don't get fooled by
  // checksum casing, extra whitespace, or a placeholder string like
  // "0x10Db...CCD7" accidentally passed at deploy time (which will simply
  // fail to match a real wallet — as it should).
  const normalizeAddress = (s: string | null | undefined): string | null => {
    if (!s) return null;
    const m = String(s).toLowerCase().replace(/^0x/, "").match(/^[0-9a-f]{40}$/);
    return m ? m[0] : null;
  };
  const ownerNorm  = normalizeAddress(params?.owner);
  const walletNorm = normalizeAddress(address);
  const ownerLooksValid = !!ownerNorm;
  const isOwner = !!ownerNorm && ownerNorm === walletNorm;

  const submit = () => {
    let wei: bigint;
    try { wei = parseGen(seedText); } catch { return toastError("Invalid amount"); }
    if (wei <= BigInt(0)) return toastError("Enter a positive amount");
    seedReserve(wei);
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 space-y-8">
      <div>
        <div className="eyebrow mb-1">Reserve room</div>
        <h1 className="display text-4xl">Pool</h1>
      </div>

      <HowTo
        id="pool"
        title="How the reserve underwrites payouts"
        items={[
          { label: "Reserve",   body: "Total GEN the contract can pay out. Grows from every premium collected plus any owner top-ups. Cannot be withdrawn — additive only." },
          { label: "Solvency guard", body: "A new policy only binds if reserve ≥ its coverage, so an early buyer is never sold cover the pool cannot honour." },
          { label: "Rates",     body: "Premium rate scales with duration: 7d = 1.0%, 30d = 5.0%, 90d = 12% of coverage. Fixed on-chain in the MVP." },
          { label: "Owner top-up", body: "The deploying wallet sees a Seed the reserve panel below. Deposits stack additively — cannot touch premiums already collected." },
        ]}
      />

      {isLoading || !params ? (
        <div className="card p-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gold-bright" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <BigStat label="Reserve"          value={`${formatGen(params.reserve_wei)} GEN`}         hint="Payout capacity" icon={Landmark} />
            <BigStat label="Premiums (lt)"    value={`${formatGen(params.total_premiums_wei)} GEN`} hint="Collected lifetime" icon={Coins} />
            <BigStat label="Payouts (lt)"     value={`${formatGen(params.total_payouts_wei)} GEN`}  hint="Paid lifetime" icon={Coins} />
            <BigStat label="Active policies"  value={String(params.active_policy_count)}            hint={`${params.total_policies} bound total`} icon={Landmark} />
          </div>

          <div className="card p-6 space-y-4">
            <div className="eyebrow">Protocol parameters</div>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-ivory-soft/50">Owner</dt>
              <dd>
                {!params.owner ? (
                  <span className="mono text-xs text-red-400/80">
                    unset — contract has no owner. Redeploy required to enable owner actions.
                  </span>
                ) : !ownerLooksValid ? (
                  <span className="mono text-xs text-red-400/80" title={params.owner}>
                    invalid — stored as “{params.owner}”. Redeploy passing the full 42-char address (no ellipsis).
                  </span>
                ) : (
                  <>
                    <AddressDisplay address={params.owner} showCopy />
                    {address && (
                      <span
                        className="ml-2 text-[10px] font-medium uppercase tracking-wider"
                        style={{
                          color: isOwner ? "var(--gold-bright)" : "var(--ivory-soft-50)",
                        }}
                      >
                        · {isOwner ? "You" : "Not you"}
                      </span>
                    )}
                  </>
                )}
              </dd>
              <dt className="text-ivory-soft/50">Coverage minimum</dt>
              <dd className="mono">{formatGen(params.min_coverage_wei)} GEN</dd>
              <dt className="text-ivory-soft/50">Coverage maximum</dt>
              <dd className="mono">{formatGen(params.max_coverage_wei)} GEN</dd>
              <dt className="text-ivory-soft/50">Total claims</dt>
              <dd className="mono">{params.total_claims}</dd>
            </dl>
            <div className="hairline" />
            <div>
              <div className="eyebrow mb-1.5">Premium schedule</div>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(params.duration_rates_bps || {}).map(([days, bps]) => (
                  <span key={days} className="chip chip-active">
                    {days}d · {(bps / 100).toFixed(1)}%
                  </span>
                ))}
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="card p-6 space-y-4" style={{ borderColor: "rgba(201, 169, 97, 0.4)" }}>
              <div>
                <div className="eyebrow mb-1">Owner action</div>
                <h3 className="display text-xl">Seed the reserve</h3>
                <p className="text-sm text-ivory-soft/60 mt-1">
                  Top up payout capacity. Additive only — cannot touch premiums already
                  collected or short-change bound policies.
                </p>
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block eyebrow mb-1.5">Amount (GEN)</label>
                  <input
                    className="input mono"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={seedText}
                    onChange={(e) => setSeedText(e.target.value)}
                  />
                </div>
                <button className="btn btn-gold" onClick={submit} disabled={isSeeding}>
                  {isSeeding ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Seeding…</>
                  ) : (
                    "Deposit"
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BigStat({
  label, value, hint, icon: Icon,
}: {
  label: string; value: string; hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="eyebrow">{label}</span>
        <Icon className="w-4 h-4 text-gold/50" />
      </div>
      <div className="display text-2xl leading-none mb-1">{value}</div>
      {hint && <div className="text-xs text-ivory-soft/50">{hint}</div>}
    </div>
  );
}
