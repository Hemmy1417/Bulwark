"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BulwarkWordmark } from "./Logo";
import { ConnectButton } from "./ConnectButton";

const links = [
  { href: "/policies/new", label: "Bind cover" },
  { href: "/policies",     label: "Policies" },
  { href: "/claims",       label: "Claims" },
  { href: "/ledger",       label: "Ledger" },
  { href: "/pool",         label: "Pool" },
];

export function Nav() {
  const path = usePathname();
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md"
      style={{
        background: "rgba(7, 19, 40, 0.75)",
        borderBottom: "1px solid var(--hairline)",
      }}
    >
      <nav className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="hover:opacity-90 transition-opacity shrink-0">
          <BulwarkWordmark size="sm" />
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active =
              l.href === "/" ? path === "/" : path?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className="display text-[0.78rem] tracking-[0.18em] uppercase px-3 py-2 transition-colors"
                style={{
                  color: active ? "var(--gold-bright)" : "rgba(243, 238, 223, 0.65)",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
        <ConnectButton />
      </nav>
    </header>
  );
}
