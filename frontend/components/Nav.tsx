"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [path]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = drawerOpen ? "hidden" : previous || "";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  const isActive = (href: string) =>
    href === "/" ? path === "/" : path?.startsWith(href);

  return (
    <>
      <header
        className="sticky top-0 z-40 backdrop-blur-md"
        style={{
          background: "rgba(7, 19, 40, 0.75)",
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        <nav className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="hover:opacity-90 transition-opacity shrink-0"
          >
            <BulwarkWordmark size="sm" />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="display text-[0.78rem] tracking-[0.18em] uppercase px-3 py-2 transition-colors"
                style={{
                  color: isActive(l.href)
                    ? "var(--gold-bright)"
                    : "rgba(243, 238, 223, 0.65)",
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ConnectButton />
            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setDrawerOpen((v) => !v)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-sm transition-colors"
              style={{
                background: "rgba(201, 169, 97, 0.06)",
                border: "1px solid var(--hairline)",
                color: "var(--gold-bright)",
              }}
              aria-label={drawerOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={drawerOpen}
              aria-controls="mobile-drawer"
            >
              {drawerOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile drawer + backdrop */}
      {drawerOpen && (
        <>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
            className="md:hidden fixed inset-0 z-40 animate-fade-in"
            style={{ background: "rgba(3, 11, 26, 0.65)", backdropFilter: "blur(4px)" }}
          />
          <aside
            id="mobile-drawer"
            className="md:hidden fixed right-0 top-16 bottom-0 z-40 w-[78%] max-w-[320px] animate-slide-in"
            style={{
              background: "rgba(11, 31, 58, 0.98)",
              borderLeft: "1px solid var(--hairline)",
              boxShadow: "-12px 0 24px rgba(0,0,0,0.4)",
            }}
          >
            <div className="px-5 pt-5 pb-3">
              <div className="eyebrow" style={{ color: "var(--gold)" }}>
                Navigation
              </div>
            </div>
            <div className="hairline" />
            <ul className="flex flex-col p-2">
              {links.map((l) => {
                const active = isActive(l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="block px-4 py-3 rounded-sm transition-colors"
                      style={{
                        color: active
                          ? "var(--gold-bright)"
                          : "rgba(243, 238, 223, 0.85)",
                        background: active
                          ? "rgba(201, 169, 97, 0.08)"
                          : "transparent",
                        borderLeft: active
                          ? "2px solid var(--gold-bright)"
                          : "2px solid transparent",
                      }}
                    >
                      <span className="display text-[0.95rem] tracking-[0.10em] uppercase">
                        {l.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="hairline" />
            <div className="px-5 py-3 text-[10px]">
              <span className="eyebrow text-ivory-soft/40">
                Sealed on GenLayer · Studionet
              </span>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
