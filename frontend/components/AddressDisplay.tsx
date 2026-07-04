"use client";

import { Copy } from "lucide-react";
import { shortAddr } from "@/lib/utils";
import { success } from "@/lib/toast";

export function AddressDisplay({
  address,
  showCopy = false,
  className = "",
}: {
  address: string;
  showCopy?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 mono text-xs ${className}`}>
      <span className="text-ivory-soft/80">{shortAddr(address)}</span>
      {showCopy && (
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(address);
            success("Address copied");
          }}
          className="text-muted hover:text-gold-bright transition-colors"
          aria-label="Copy address"
        >
          <Copy className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
