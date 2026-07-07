"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

/**
 * Global error boundary for all routes below `app/`. Catches any thrown
 * error inside a page or nested component and shows a Lloyd's-styled retry
 * card instead of blanking the tree. Preserves the frame (nav + footer)
 * so the user isn't stranded.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error to the dev console — the digest is what Next.js
    // logs on the server so an operator can correlate.
    // eslint-disable-next-line no-console
    console.error("[Bulwark] page-level error", error);
  }, [error]);

  return (
    <div className="max-w-3xl px-6 lg:px-12 py-16">
      <div
        className="card p-8 space-y-6"
        style={{ borderColor: "rgba(195, 106, 106, 0.35)" }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-11 h-11 rounded-sm flex items-center justify-center shrink-0"
            style={{
              background: "rgba(195, 106, 106, 0.10)",
              border: "1px solid rgba(195, 106, 106, 0.3)",
            }}
          >
            <AlertTriangle
              className="w-5 h-5"
              style={{ color: "var(--danger)" }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="eyebrow mb-1" style={{ color: "var(--danger)" }}>
              System notice
            </div>
            <h1 className="display text-3xl leading-tight">
              This page could not be rendered
            </h1>
            <p className="text-sm text-ivory-soft/70 mt-2 leading-relaxed">
              An unexpected error interrupted the page. Reserve balances,
              policies, and claim rulings on-chain are unaffected —
              retrying will simply re-issue the underlying queries.
            </p>
          </div>
        </div>

        {error?.message && (
          <div className="hairline" />
        )}

        {error?.message && (
          <div className="space-y-1.5">
            <div className="eyebrow">Reported detail</div>
            <pre
              className="mono text-xs whitespace-pre-wrap break-words p-3 rounded-sm"
              style={{
                background: "rgba(0, 0, 0, 0.35)",
                border: "1px solid var(--hairline)",
                color: "var(--ivory-soft)",
              }}
            >
              {error.message}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          </div>
        )}

        <div className="hairline" />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="btn btn-gold"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <Link href="/" className="btn btn-ghost">
            <ArrowLeft className="w-4 h-4" />
            Return to landing
          </Link>
        </div>
      </div>
    </div>
  );
}
