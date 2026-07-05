"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type Item = { label: string; body: string };

interface HowToProps {
  id: string;                 // localStorage key — one collapse state per note
  reference: string;          // e.g. "BW-01", "BW-04" — the underwriter reference
  title: string;              // short title of the note
  intro?: string;             // preamble paragraph, italic serif
  items: Item[];              // numbered clauses
  clauseLabel?: string;       // default: "Clause"; can be "Schedule", "Note", etc.
  className?: string;
}

/**
 * Editorial guidance card in the Lloyd's underwriter voice.
 * - Numbered clauses (01., 02., ...) with bold label + hairline body
 * - Reference stamp in the header (BW-nn) and again as a footer serial
 * - Serif intro paragraph for the preamble
 * - Collapse state persisted per-note in localStorage
 */
export function HowTo({
  id,
  reference,
  title,
  intro,
  items,
  clauseLabel = "Clause",
  className = "",
}: HowToProps) {
  const storageKey = `bulwark_howto_${id}`;
  const [open, setOpen] = useState(true);
  const [stampDate, setStampDate] = useState("");

  useEffect(() => {
    // Both localStorage lookups and Date.now() must run only on the client so
    // SSR and CSR produce byte-identical HTML on first paint — otherwise React
    // flags a hydration mismatch and bails the tree.
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(storageKey);
    if (saved === "closed") setOpen(false);
    setStampDate(new Date().toISOString().slice(0, 10));
  }, [storageKey]);

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      try {
        localStorage.setItem(storageKey, next ? "open" : "closed");
      } catch { /* silent */ }
      return next;
    });
  };

  return (
    <div className={`card overflow-hidden ${className}`}>
      {/* Header */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-white/[0.02] transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-4 min-w-0">
          <span
            className="mono text-[10px] tracking-[0.18em] uppercase px-2 py-1 rounded-sm shrink-0"
            style={{
              background: "rgba(201, 169, 97, 0.08)",
              border: "1px solid rgba(201, 169, 97, 0.25)",
              color: "var(--gold-bright)",
            }}
          >
            {reference}
          </span>
          <div className="min-w-0">
            <div className="eyebrow" style={{ color: "var(--gold)" }}>
              Guidance note
            </div>
            <div className="display text-base leading-tight truncate">
              {title}
            </div>
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-ivory-soft/60 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-ivory-soft/60 shrink-0" />
        )}
      </button>

      {open && (
        <div className="animate-fade-in">
          <div className="hairline" />

          <div className="px-6 pt-5 pb-4 space-y-5">
            {intro && (
              <p
                className="text-[0.95rem] leading-relaxed text-ivory-soft/85"
                style={{
                  fontFamily: "var(--font-serif, 'EB Garamond', ui-serif, Georgia, serif)",
                  fontStyle: "italic",
                }}
              >
                {intro}
              </p>
            )}

            {intro && <div className="hairline" />}

            <ol className="space-y-4">
              {items.map((it, i) => (
                <li key={i} className="flex gap-4">
                  <div className="shrink-0 pt-0.5 w-14">
                    <div className="mono text-[10px] uppercase tracking-[0.16em] text-ivory-soft/40">
                      {clauseLabel}
                    </div>
                    <div
                      className="mono text-lg tabular-nums leading-none mt-0.5"
                      style={{ color: "var(--gold-bright)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="text-[0.95rem] font-medium text-ivory leading-snug">
                      {it.label}
                    </div>
                    <p className="text-sm text-ivory-soft/70 leading-relaxed mt-1">
                      {it.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Footer stamp */}
          <div className="hairline" />
          <div className="px-6 py-2.5 flex items-center justify-between gap-3 text-[10px]">
            <span className="mono uppercase tracking-[0.16em] text-ivory-soft/40">
              Reference {reference}
            </span>
            <span className="mono uppercase tracking-[0.16em] text-ivory-soft/40">
              Sealed on GenLayer · {stampDate}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
