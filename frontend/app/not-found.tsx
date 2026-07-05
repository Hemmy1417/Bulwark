import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";

/**
 * Custom 404 in the Lloyd's editorial voice. Preserves the frame (nav +
 * footer) so a mistyped URL doesn't strand the user on a bare page.
 */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <div className="card p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div
            className="w-11 h-11 rounded-sm flex items-center justify-center shrink-0"
            style={{
              background: "rgba(201, 169, 97, 0.08)",
              border: "1px solid var(--hairline)",
            }}
          >
            <Compass className="w-5 h-5" style={{ color: "var(--gold-bright)" }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="eyebrow mb-1">Not on the schedule</div>
            <h1 className="display text-3xl leading-tight">
              This page is not part of the register
            </h1>
            <p className="text-sm text-ivory-soft/70 mt-2 leading-relaxed">
              The requested resource does not correspond to any policy,
              claim, or reserve document held on file. Please return to the
              landing page or use the navigation to reach a known section.
            </p>
          </div>
        </div>

        <div className="hairline" />

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/" className="btn btn-gold">
            <ArrowLeft className="w-4 h-4" />
            Return to landing
          </Link>
          <Link href="/ledger" className="btn btn-ghost">
            View the public ledger
          </Link>
        </div>
      </div>
    </div>
  );
}
