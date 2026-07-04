"use client";

import { useState } from "react";
import { Loader2, Landmark, Coins } from "lucide-react";
import { useProtocolParams, useOwnerSeedReserve } from "@/lib/hooks/useBulwark";
import { useWallet } from "@/lib/genlayer/wallet";
import { parseGen, formatGen } from "@/lib/utils";
import { AddressDisplay } from "@/components/AddressDisplay";
import { error as toastError } from "@/lib/toast";

export default function PoolPage() {
  const { address } = useWallet();
  const { data: params, isLoading } = useProtocolParams();
  const { seedReserve, isSeeding } = useOwnerSeedReserve();
  const [seedText, setSeedText] = useState("1");

  const isOwner =
    address && params?.owner &&
    address.toLowerCase() === params.owner.toLowerCase();

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
              <dd><AddressDisplay address={params.owner} showCopy /></dd>
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
