"use client";

import { useMemo, useState } from "react";
import { Loader2, ShieldCheck, Info } from "lucide-react";
import { useProtocolParams, usePreviewPremium, useBuyPolicy } from "@/lib/hooks/useBulwark";
import { useWallet } from "@/lib/genlayer/wallet";
import { parseGen, formatGen } from "@/lib/utils";
import { error as toastError } from "@/lib/toast";
import { useRouter } from "next/navigation";

const DURATIONS = [7, 30, 90] as const;

export default function NewPolicyPage() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const { data: params } = useProtocolParams();
  const { buyPolicy, isBuying } = useBuyPolicy();

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
    <div className="mx-auto max-w-3xl px-5 py-14 space-y-8">
      <div className="text-center max-w-xl mx-auto">
        <div className="eyebrow mb-2">Bind cover</div>
        <h1 className="display text-4xl mb-3">Insure a validator</h1>
        <p className="text-ivory-soft/70">
          Coverage runs from the block your policy binds. If your validator is slashed
          within that window, file a claim and let the AI panel rule.
        </p>
      </div>

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

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="eyebrow mb-1">Rate</div>
            <div className="mono text-gold-bright">
              {quote ? `${(quote.rate_bps / 100).toFixed(1)}%` : "—"}
            </div>
          </div>
          <div>
            <div className="eyebrow mb-1">Premium due</div>
            <div className="mono text-gold-bright">
              {quoting ? (
                <Loader2 className="w-4 h-4 animate-spin inline" />
              ) : quote ? (
                `${formatGen(quote.premium_wei)} GEN`
              ) : "—"}
            </div>
          </div>
        </div>

        {reserveShort && coverageWei > BigInt(0) && (
          <div
            className="p-3 rounded-sm flex items-start gap-2 text-sm"
            style={{ background: "rgba(195, 106, 106, 0.08)", border: "1px solid rgba(195, 106, 106, 0.3)" }}
          >
            <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--danger)" }} />
            <div>
              Protocol reserve is <span className="mono">{formatGen(reserveWei)} GEN</span> —
              short of your requested <span className="mono">{formatGen(coverageWei)} GEN</span> coverage.
              Reduce coverage or ask the owner to top up the reserve.
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
