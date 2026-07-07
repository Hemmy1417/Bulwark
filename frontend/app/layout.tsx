import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Masthead } from "@/components/Masthead";
import { NetworkBanner } from "@/components/NetworkBanner";
import { LiveBackdrop } from "@/components/LiveBackdrop";
import { CONTRACT_ADDRESS, explorerAddressUrl } from "@/lib/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Instrument Serif — dramatic high-contrast display; the broadsheet masthead.
const garamond = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
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
      <body className="min-h-screen">
        <LiveBackdrop />
        <Providers>
          <Masthead />
          <div className="lg:ml-[340px] min-h-screen flex flex-col">
            <NetworkBanner />
            <main className="flex-1 relative">{children}</main>
            <footer className="mt-16 border-t border-hairline">
              <div className="px-6 lg:px-12 py-6 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="eyebrow">Sealed on GenLayer · Studionet</span>
                <span className="text-ivory-soft/40">
                  AI adjudication with public evidence · payouts in GEN ·{" "}
                  <a
                    href={explorerAddressUrl(CONTRACT_ADDRESS)}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-ivory"
                  >
                    Verify on explorer ↗
                  </a>
                </span>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
