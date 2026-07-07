"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ConnectButton } from "./ConnectButton";
import { useProtocolParams } from "@/lib/hooks/useBulwark";
import { formatGen } from "@/lib/utils";

const links = [
  { href: "/policies/new", label: "Bind cover", num: "I" },
  { href: "/policies",     label: "Policies",   num: "II" },
  { href: "/claims",       label: "Claims",     num: "III" },
  { href: "/ledger",       label: "Ledger",     num: "IV" },
  { href: "/pool",         label: "Pool",       num: "V" },
];

function Nameplate() {
  return (
    <Link href="/" className="block group">
      <div className="eyebrow text-gold/70 mb-1">Est. on GenLayer</div>
      <div
        className="leading-[0.9] tracking-tight"
        style={{ fontFamily: "var(--font-garamond), serif", fontSize: "2.9rem", color: "var(--ivory)" }}
      >
        Bulwark
      </div>
      <div
        className="mt-1 italic text-gold/80"
        style={{ fontFamily: "var(--font-garamond), serif", fontSize: "1.05rem" }}
      >
        the underwriting broadsheet
      </div>
    </Link>
  );
}

function Index({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const isActive = (href: string) =>
    href === "/" ? path === "/" : path?.startsWith(href);
  return (
    <nav className="flex flex-col">
      {links.map((l) => {
        const active = isActive(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className="group flex items-baseline gap-3 py-2 border-b transition-colors"
            style={{ borderColor: "var(--hairline)" }}
          >
            <span className="mono text-[10px] w-6 shrink-0" style={{ color: "var(--gold-soft)" }}>{l.num}</span>
            <span
              className="text-[0.95rem] transition-colors"
              style={{
                fontFamily: "var(--font-garamond), serif",
                fontSize: "1.15rem",
                color: active ? "var(--gold-bright)" : "var(--ivory-soft)",
              }}
            >
              {l.label}
            </span>
            <span className="ml-auto text-gold/0 group-hover:text-gold/70 transition-colors">→</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Figures() {
  const { data: p } = useProtocolParams();
  const rows = [
    { k: "Reserve", v: p ? `${formatGen(p.reserve_wei)} GEN` : "—" },
    { k: "Policies in force", v: p ? String(p.active_policy_count) : "—" },
    { k: "Claims filed", v: p ? String(p.total_claims) : "—" },
  ];
  return (
    <div className="pt-1">
      <div className="eyebrow text-gold/60 mb-2">Today's figures</div>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.k} className="flex items-baseline justify-between">
            <span className="text-xs text-muted">{r.k}</span>
            <span className="mono text-xs" style={{ color: "var(--ivory)" }}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Masthead() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : prev || "";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <>
      {/* Desktop masthead panel */}
      <aside
        className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[340px] flex-col px-8 py-9 z-30 overflow-y-auto"
        style={{ background: "rgba(7,19,40,0.72)", borderRight: "1px solid var(--hairline)", backdropFilter: "blur(10px)" }}
      >
        <Nameplate />
        <div className="mt-9"><Index /></div>
        <div className="mt-9"><Figures /></div>
        <div className="mt-auto pt-8 space-y-3">
          <ConnectButton />
          <p className="text-[11px] leading-relaxed text-muted" style={{ fontFamily: "var(--font-garamond), serif", fontSize: "0.9rem", fontStyle: "italic" }}>
            Insure a validator. If it is slashed, a panel of GenLayer validators
            reads the evidence and settles in minutes.
          </p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div
        className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-[60px]"
        style={{ background: "rgba(7,19,40,0.9)", borderBottom: "1px solid var(--hairline)", backdropFilter: "blur(10px)" }}
      >
        <Link href="/" style={{ fontFamily: "var(--font-garamond), serif", fontSize: "1.5rem", color: "var(--ivory)" }}>
          Bulwark
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <ConnectButton />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-10 h-10 flex items-center justify-center rounded-md"
            style={{ background: "var(--navy-mid)", border: "1px solid var(--hairline)", color: "var(--ivory)" }}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="lg:hidden fixed inset-0 z-40 animate-fade-in"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          />
          <aside
            className="lg:hidden fixed left-0 top-0 bottom-0 w-[80%] max-w-[320px] z-40 px-7 py-8 flex flex-col animate-slide-in overflow-y-auto"
            style={{ background: "var(--navy-deep)", borderRight: "1px solid var(--hairline)" }}
          >
            <Nameplate />
            <div className="mt-8"><Index onNavigate={() => setOpen(false)} /></div>
            <div className="mt-8"><Figures /></div>
          </aside>
        </>
      )}
    </>
  );
}
