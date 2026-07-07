"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ScrollText, Plus, X, ExternalLink, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { usePolicy, useFileClaim } from "@/lib/hooks/useBulwark";
import { useWallet } from "@/lib/genlayer/wallet";
import { formatGen } from "@/lib/utils";
import { error as toastError } from "@/lib/toast";
import { HowTo } from "@/components/HowTo";
import { classify, preflight, type EvidenceVerdict } from "@/lib/evidence";

const MAX_CAUSE_URLS = 3;

export default function NewClaimPage() {
  const params = useParams<{ policyId: string }>();
  const policyId = params.policyId;
  const router = useRouter();

  const { isConnected, address } = useWallet();
  const { data: policy, isLoading } = usePolicy(policyId);
  const { fileClaim, isFiling } = useFileClaim();

  const [primary, setPrimary] = useState("");
  const [causeUrls, setCauseUrls] = useState<string[]>([""]);

  const addCauseUrl = () => {
    if (causeUrls.length >= MAX_CAUSE_URLS) return;
    setCauseUrls((s) => [...s, ""]);
  };
  const setCauseUrl = (i: number, v: string) =>
    setCauseUrls((s) => s.map((row, idx) => (idx === i ? v : row)));
  const removeCauseUrl = (i: number) =>
    setCauseUrls((s) => (s.length === 1 ? s : s.filter((_, idx) => idx !== i)));

  const check = useMemo(
    () => preflight(primary, causeUrls),
    [primary, causeUrls],
  );

  const submit = () => {
    if (!isConnected) return toastError("Connect your wallet");
    const p = primary.trim();
    if (!p) return toastError("Primary evidence URL required");
    if (!/^https?:\/\//i.test(p)) return toastError("URLs must start with http(s)://");
    const clean = causeUrls.map((u) => u.trim()).filter(Boolean);
    for (const u of clean) {
      if (!/^https?:\/\//i.test(u)) return toastError("Cause URLs must start with http(s)://");
    }
    if (check.hasBlocked) {
      return toastError("One or more URLs are on the panel's inadmissible list. Replace them before submitting.");
    }
    fileClaim({
      policyId,
      primaryEvidenceUrl: p,
      causeEvidenceUrls: clean,
    }, {
      onSuccess: () => router.push("/claims"),
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl px-6 lg:px-12 py-16 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gold-bright" />
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="max-w-3xl px-6 lg:px-12 py-16 text-center">
        <h1 className="display text-2xl mb-2">Policy not found</h1>
        <Link href="/policies" className="btn btn-ghost mt-4">Back to policies</Link>
      </div>
    );
  }

  const notOwner = address && policy.policyholder.toLowerCase() !== address.toLowerCase();
  const notActive = policy.status !== "ACTIVE";
  const blocked = notOwner || notActive;

  return (
    <div className="max-w-3xl px-6 lg:px-12 py-12 space-y-8">
      <div className="text-center max-w-xl mx-auto">
        <div className="eyebrow mb-2">File a claim</div>
        <h1 className="display text-4xl mb-3">Policy #{policyId}</h1>
        <p className="text-ivory-soft/70">
          Provide public evidence. The AI panel fetches every URL, agrees on the cause
          bucket, and — if covered — pays out to your wallet on the same transaction.
        </p>
      </div>

      <HowTo
        id="file-claim"
        reference="BW-03"
        title="Schedule of admissible evidence"
        clauseLabel="Item"
        intro="GenLayer validators fetch each cited URL independently. Sources must render as public HTML without client-side scripting; anything gated, JavaScript-only, or rate-limited is inadmissible and will vitiate the round."
        items={[
          { label: "Admissible — validator status",  body: "beaconscan.com, mintscan.io, or any chain-native explorer that returns a rendered HTML page confirming slashing status without JavaScript." },
          { label: "Admissible — cause narrative",   body: "Official client release notes (Prysm, Lighthouse, Nimbus, Teku), operator post-mortems hosted as static markdown or plain HTML, and public incident reports." },
          { label: "Inadmissible",                    body: "beaconcha.in and Etherscan (403 to validator fetchers), Twitter/X live pages (JavaScript shell), and any resource requiring authentication." },
          { label: "Adjudication timing",             body: "Independent fetch, LLM ruling, bucketed consensus, and — where covered — settlement occur on the same transaction. Allow one to three minutes for validators to converge." },
        ]}
      />

      <div className="card p-5 grid grid-cols-2 gap-3 text-sm">
        <SmallStat label="Validator"   value={policy.validator_identifier} />
        <SmallStat label="Chain"       value={policy.chain_label} />
        <SmallStat label="Coverage"    value={`${formatGen(policy.coverage_wei)} GEN`} />
        <SmallStat label="Status"      value={policy.status} />
      </div>

      {blocked && (
        <div className="card-strong p-4 flex items-start gap-3" style={{ borderColor: "rgba(195, 106, 106, 0.4)" }}>
          <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: "var(--danger)" }} />
          <div className="text-sm">
            {notOwner
              ? "This policy belongs to another wallet — only the policyholder can file a claim."
              : `Policy status is ${policy.status}; only ACTIVE policies accept new claims.`}
          </div>
        </div>
      )}

      <div className="card p-6 space-y-5">
        <Field
          label="Primary evidence URL (validator status)"
          hint="beaconscan.com/validator/<index> · mintscan.io/<chain>/validators/<addr> · a public Gist. Avoid beaconcha.in (403) and Etherscan."
        >
          <input
            className="input mono text-sm"
            placeholder="https://beaconscan.com/validator/…"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            disabled={blocked}
          />
          <EvidencePill verdict={check.primary} url={primary} />
        </Field>

        <div className="space-y-3">
          <div>
            <div className="eyebrow mb-1.5">Cause evidence (optional, up to {MAX_CAUSE_URLS})</div>
            <p className="text-xs text-ivory-soft/50">
              Client release notes · operator post-mortem · incident thread. Avoid live Twitter/X pages — use Nitter or Wayback snapshots.
            </p>
          </div>
          {causeUrls.map((u, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  className="input mono text-sm"
                  placeholder="https://…"
                  value={u}
                  onChange={(e) => setCauseUrl(i, e.target.value)}
                  disabled={blocked}
                />
                {causeUrls.length > 1 && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => removeCauseUrl(i)}
                    disabled={blocked}
                    aria-label="Remove URL"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <EvidencePill verdict={check.cause[i]} url={u} />
            </div>
          ))}
          {causeUrls.length < MAX_CAUSE_URLS && (
            <button
              className="btn btn-ghost w-full"
              onClick={addCauseUrl}
              disabled={blocked}
              style={{ borderStyle: "dashed" }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add another cause URL
            </button>
          )}
        </div>

        {isFiling && (
          <div className="card-strong p-4 flex items-start gap-3">
            <Loader2 className="w-5 h-5 mt-0.5 animate-spin" style={{ color: "var(--gold-bright)" }} />
            <div className="text-sm">
              <div className="font-medium">Validators reading your evidence</div>
              <div className="text-xs text-ivory-soft/60 mt-1">
                Independent fetch → LLM ruling → bucketed consensus → payout if covered. One to three minutes.
              </div>
            </div>
          </div>
        )}

        {check.hasBlocked && (
          <div
            className="p-3 rounded-sm flex items-start gap-2 text-sm"
            style={{ background: "rgba(195, 106, 106, 0.08)", border: "1px solid rgba(195, 106, 106, 0.3)" }}
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--danger)" }} />
            <span>
              At least one URL is on the panel's inadmissible list. Replace or remove it before filing —
              submitting as-is would waste the transaction fee on evidence the validators cannot read.
            </span>
          </div>
        )}

        <button
          className="btn btn-gold w-full"
          onClick={submit}
          disabled={blocked || isFiling || check.hasBlocked}
        >
          {isFiling ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Adjudicating…</>
          ) : (
            <><ScrollText className="w-4 h-4" /> File claim</>
          )}
        </button>
      </div>

      <div className="text-center text-xs text-ivory-soft/50">
        Not sure where to look?{" "}
        <a href="https://beaconscan.com" target="_blank" rel="noreferrer" className="text-gold-bright hover:underline">
          beaconscan.com <ExternalLink className="inline w-3 h-3" />
        </a>{" "}
        ·{" "}
        <a href="https://gist.github.com" target="_blank" rel="noreferrer" className="text-gold-bright hover:underline">
          gist.github.com <ExternalLink className="inline w-3 h-3" />
        </a>
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

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="eyebrow mb-0.5">{label}</div>
      <div className="mono text-ivory">{value}</div>
    </div>
  );
}

function EvidencePill({ verdict, url }: { verdict: EvidenceVerdict; url: string }) {
  // Nothing shown for an empty field — it's not yet a verdict, it's just blank.
  if (!url.trim()) return null;

  const palette = verdict.status === "ok"
    ? { bg: "rgba(114, 176, 137, 0.10)", border: "rgba(114, 176, 137, 0.30)", fg: "#8FCB9E", Icon: CheckCircle2 }
    : verdict.status === "warn"
    ? { bg: "rgba(230, 199, 122, 0.10)", border: "rgba(230, 199, 122, 0.30)", fg: "#E6C77A", Icon: AlertTriangle }
    : { bg: "rgba(195, 106, 106, 0.10)", border: "rgba(195, 106, 106, 0.30)", fg: "#E58686", Icon: AlertCircle };

  const { Icon } = palette;
  return (
    <div
      className="flex items-start gap-1.5 mt-1.5 px-2.5 py-1.5 rounded-sm text-xs"
      style={{ background: palette.bg, border: `1px solid ${palette.border}`, color: palette.fg }}
    >
      <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
      <span className="leading-snug">{verdict.note ?? ""}</span>
    </div>
  );
}
