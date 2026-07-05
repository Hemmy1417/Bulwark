import type { Metadata, Viewport } from "next";
import { Inter, EB_Garamond, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";
import { NetworkBanner } from "@/components/NetworkBanner";
import { LiveBackdrop } from "@/components/LiveBackdrop";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-garamond",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BULWARK — AI-arbitrated slashing insurance",
  description:
    "Insure your validator against slashing. If it happens, a panel of GenLayer AI validators reads the evidence and pays you out in minutes — no adjuster, no queue.",
  openGraph: {
    title: "BULWARK — AI-arbitrated slashing insurance on GenLayer",
    description:
      "Buy a policy on your validator. If it's slashed, a GenLayer AI panel rules the cause and settles automatically.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#0B1F3A" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${garamond.variable} ${mono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <LiveBackdrop />
        <Providers>
          <Nav />
          <NetworkBanner />
          <main className="flex-1 relative">{children}</main>
          <footer className="mt-16 border-t border-hairline">
            <div className="mx-auto max-w-6xl px-5 py-6 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="eyebrow">Sealed on GenLayer · Studionet</span>
              <span className="text-ivory-soft/40">
                AI adjudication with public evidence · payouts in GEN
              </span>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
