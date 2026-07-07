"use client";

import Link from "next/link";
import { ShieldCheck, Zap, ScrollText, Landmark } from "lucide-react";
import { useProtocolParams } from "@/lib/hooks/useBulwark";
import { formatGen } from "@/lib/utils";

const causes = [
  { label: "NOT_SLASHED", covered: false, blurb: "No slashing found in the evidence." },
  { label: "NEGLIGENCE",  covered: false, blurb: "Operator error — misconfiguration, double-signing, downtime." },
  { label: "BUG",         covered: true,  blurb: "Client-software fault; a release-note incident." },
  { label: "UNAVOIDABLE", covered: true,  blurb: "Chain-level or network-wide event outside operator control." },
];

const durations = [
  { d:  7, rate: "1.0%",  demo: "0.01 GEN"  },
  { d: 30, rate: "5.0%",  demo: "0.05 GEN"  },
  { d: 90, rate: "12%",   demo: "0.12 GEN"  },
];

const steps = [
  { icon: ShieldCheck, title: "Bind cover",  body: "Pick a validator, coverage size, and duration. Pay the quoted premium in GEN." },
  { icon: ScrollText,  title: "File claim",  body: "If slashed, paste a public status URL plus 1–3 optional cause-evidence URLs." },
  { icon: Zap,         title: "AI ruling",   body: "A validator panel fetches each URL, agrees on the cause bucket, records reasoning." },
  { icon: Landmark,    title: "Payout",      body: "Covered causes settle to your wallet on the same tx. No adjuster, no queue." },
];

export default function HomePage() {
  const { data: params } = useProtocolParams();

  return (
    <div className="max-w-5xl px-6 lg:px-12 pt-16 pb-8 space-y-16">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="animate-fade-in text-center max-w-3xl mx-auto pt-6">
        <div className="eyebrow mb-4">Est. Studionet · GenLayer chapter</div>
        <h1 className="display text-[3.6rem] md:text-[4.6rem] leading-[0.95] tracking-tight mb-5">
          Slashing insurance,
          <br />
          <span style={{ color: "var(--gold)" }}>ruled in minutes.</span>
        </h1>
        <p className="text-lg text-ivory-soft/80 max-w-xl mx-auto leading-relaxed">
          Buy a policy on your validator. If it&apos;s ever slashed, a panel of GenLayer AI
          validators reads the evidence, rules the cause, and — when covered — settles
          straight to your wallet. Public reasoning, public ledger.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link href="/policies/new" className="btn btn-gold">Bind cover</Link>
          <Link href="/ledger" className="btn btn-ghost">See the ledger</Link>
        </div>
      </section>

      {/* ── Live pool strip ────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <PoolStat label="Policies bound"  value={String(params?.total_policies ?? 0)}      hint={`${params?.active_policy_count ?? 0} active`} />
        <PoolStat label="Reserve"         value={`${formatGen(params?.reserve_wei ?? "0")} GEN`} hint="Payout capacity" />
        <PoolStat label="Premiums (lt)"   value={`${formatGen(params?.total_premiums_wei ?? "0")} GEN`} hint="Collected lifetime" />
        <PoolStat label="Payouts (lt)"    value={`${formatGen(params?.total_payouts_wei ?? "0")} GEN`}  hint={`${params?.total_claims ?? 0} claims filed`} />
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section>
        <div className="text-center mb-8">
          <div className="eyebrow mb-2">How it works</div>
          <h2 className="display text-3xl">Four steps from policy to payout</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="mono text-3xl text-gold/25 font-semibold">0{i + 1}</span>
                  <div className="w-9 h-9 rounded-sm flex items-center justify-center" style={{ background: "rgba(201,169,97,0.08)", border: "1px solid var(--hairline)" }}>
                    <Icon className="w-4 h-4" style={{ color: "var(--gold-bright)" }} />
                  </div>
                </div>
                <div className="hairline" />
                <h3 className="display text-lg">{s.title}</h3>
                <p className="text-sm text-ivory-soft/70 leading-relaxed">{s.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Coverage matrix ────────────────────────────────────────────── */}
      <section className="card p-6 md:p-8">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
          <div>
            <div className="eyebrow mb-1">Coverage matrix</div>
            <h2 className="display text-2xl">What Bulwark pays out on</h2>
          </div>
          <span className="chip chip-active">MVP terms</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {causes.map((c) => (
            <div
              key={c.label}
              className="p-4 rounded-sm border"
              style={{
                borderColor: c.covered ? "rgba(106, 177, 135, 0.35)" : "rgba(143, 163, 190, 0.2)",
                background: c.covered ? "rgba(106, 177, 135, 0.05)" : "rgba(7, 19, 40, 0.4)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="mono text-sm font-semibold" style={{ color: c.covered ? "var(--success)" : "var(--muted)" }}>{c.label}</span>
                <span className={c.covered ? "chip chip-paid" : "chip chip-rejected"}>
                  {c.covered ? "Covered" : "Not covered"}
                </span>
              </div>
              <p className="text-sm text-ivory-soft/75 leading-relaxed">{c.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Premium schedule ───────────────────────────────────────────── */}
      <section>
        <div className="text-center mb-6">
          <div className="eyebrow mb-2">Premium schedule</div>
          <h2 className="display text-2xl">Longer risk window, higher rate</h2>
        </div>
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead style={{ background: "rgba(11, 31, 58, 0.6)" }}>
              <tr>
                <th className="eyebrow text-left px-5 py-3">Duration</th>
                <th className="eyebrow text-left px-5 py-3">Rate (bps)</th>
                <th className="eyebrow text-left px-5 py-3">On 1 GEN coverage</th>
              </tr>
            </thead>
            <tbody>
              {durations.map((row) => (
                <tr key={row.d} className="border-t border-hairline">
                  <td className="px-5 py-4 text-ivory">
                    <span className="display text-lg">{row.d}</span>
                    <span className="text-ivory-soft/60 text-sm ml-2">days</span>
                  </td>
                  <td className="px-5 py-4 mono text-gold-bright">{row.rate}</td>
                  <td className="px-5 py-4 mono text-ivory-soft/80">{row.demo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ivory-soft/50 mt-3 text-center">
          Coverage bounds: 0.1 GEN minimum, 10 GEN maximum per policy (MVP).
        </p>
      </section>

      {/* ── Why GenLayer ───────────────────────────────────────────────── */}
      <section className="card p-6 md:p-10">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="eyebrow">Why GenLayer</div>
          <h2 className="display text-3xl">Cause attribution is narrative work.</h2>
          <p className="text-ivory-soft/75 leading-relaxed">
            Confirming a slashing event is easy — beacon-chain state proves it. Deciding
            <em> whether the cause is covered</em> means reading operator post-mortems,
            client release notes, and incident threads. That&apos;s LLM-shaped work, and
            GenLayer&apos;s <span className="mono text-gold-bright">web.render</span> +
            <span className="mono text-gold-bright"> exec_prompt</span> +
            <span className="mono text-gold-bright"> prompt_comparative</span> primitives
            compose it into a single atomic ruling that any validator can replay.
          </p>
        </div>
      </section>
    </div>
  );
}

function PoolStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="eyebrow mb-1">{label}</div>
      <div className="display text-2xl leading-none mb-1">{value}</div>
      {hint && <div className="text-xs text-ivory-soft/50">{hint}</div>}
    </div>
  );
}
