"use client";

import { AlertTriangle } from "lucide-react";
import { useWallet } from "@/lib/genlayer/wallet";
import { CHAIN_NAME } from "@/lib/config";

/**
 * Site-wide warning that surfaces when the connected wallet is on the wrong
 * chain. Writes will fail with an opaque provider error otherwise; the
 * banner catches the mismatch earlier and offers a one-click switch.
 */
export function NetworkBanner() {
  const { wrongChain, switchChain, isConnected } = useWallet();
  if (!isConnected || !wrongChain) return null;

  return (
    <div
      role="alert"
      className="w-full"
      style={{
        background: "rgba(230, 199, 122, 0.10)",
        borderBottom: "1px solid rgba(230, 199, 122, 0.35)",
      }}
    >
      <div className="mx-auto max-w-6xl px-5 py-2.5 flex items-center gap-3 flex-wrap">
        <AlertTriangle
          className="w-4 h-4 shrink-0"
          style={{ color: "var(--gold-bright)" }}
        />
        <span className="text-sm text-ivory-soft/90 flex-1 min-w-0">
          Your wallet is on the wrong network. Writes will fail until you
          switch to <span className="text-ivory font-medium">{CHAIN_NAME}</span>.
        </span>
        <button
          type="button"
          onClick={() => {
            switchChain().catch(() => {
              /* provider surfaced the error; nothing to do here */
            });
          }}
          className="text-xs uppercase tracking-[0.14em] px-3 py-1.5 rounded-sm transition-colors"
          style={{
            background: "rgba(201, 169, 97, 0.15)",
            border: "1px solid rgba(201, 169, 97, 0.4)",
            color: "var(--gold-bright)",
            fontFamily: "var(--font-garamond, ui-serif, serif)",
          }}
        >
          Switch network
        </button>
      </div>
    </div>
  );
}
