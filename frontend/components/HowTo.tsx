"use client";

import { useEffect, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";

type Item = { label: string; body: string };

interface HowToProps {
  id: string;                 // localStorage key — one collapse state per guide
  title: string;
  intro?: string;
  items: Item[];
  className?: string;
}

/**
 * Collapsible "how-to" callout that sits under a page heading.
 * Same visual language as the rest of the Lloyd's design system —
 * hairline card, gold eyebrow, monospace bullet labels. Remembers
 * the collapsed state per-guide in localStorage so a returning user
 * isn't shouted at.
 */
export function HowTo({ id, title, intro, items, className = "" }: HowToProps) {
  const storageKey = `bulwark_howto_${id}`;
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(storageKey);
    if (saved === "closed") setOpen(false);
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
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left hover:bg-white/[0.02] transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-7 h-7 shrink-0 rounded-sm flex items-center justify-center"
            style={{ background: "rgba(201, 169, 97, 0.10)", border: "1px solid var(--hairline)" }}
          >
            <BookOpen className="w-3.5 h-3.5" style={{ color: "var(--gold-bright)" }} />
          </span>
          <span className="eyebrow">How this works</span>
          <span className="text-sm text-ivory-soft/80 truncate">· {title}</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-ivory-soft/60 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-ivory-soft/60 shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 pt-0 space-y-3 animate-fade-in">
          <div className="hairline" />
          {intro && (
            <p className="text-sm text-ivory-soft/75 leading-relaxed">{intro}</p>
          )}
          <ol className="space-y-2.5">
            {items.map((it, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span
                  className="mono text-xs shrink-0 mt-0.5 tabular-nums"
                  style={{ color: "var(--gold)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-ivory font-medium">{it.label}</span>
                  <span className="text-ivory-soft/70"> — {it.body}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
