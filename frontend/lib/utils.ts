import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Parse a decimal GEN string into wei-scale BigInt. Route through
// micro-GEN (1e12) so 0.05 GEN never eats a float-precision penalty at
// wei scale (>1e15).
export function parseGen(input: string | number): bigint {
  const s = String(input).trim();
  if (!s) return BigInt(0);
  const [whole, frac = ""] = s.split(".");
  const microFrac = (frac + "000000").slice(0, 6);           // 6-decimal micro-GEN
  const micro = BigInt(whole || "0") * BigInt(1_000_000) + BigInt(microFrac || "0");
  return micro * BigInt(10 ** 12);                            // × 1e12 = wei
}

export function formatGen(wei: bigint | string | number | null | undefined, maxDecimals = 6): string {
  if (wei === null || wei === undefined) return "0";
  let big: bigint;
  try {
    big = typeof wei === "bigint" ? wei : BigInt(wei as any);
  } catch {
    return "0";
  }
  const negative = big < BigInt(0);
  if (negative) big = -big;
  const unit = BigInt(10) ** BigInt(18);
  const whole = big / unit;
  const frac = big % unit;
  if (frac === BigInt(0)) return (negative ? "-" : "") + whole.toString();
  let fracStr = frac.toString().padStart(18, "0").slice(0, maxDecimals);
  fracStr = fracStr.replace(/0+$/, "");
  return (negative ? "-" : "") + (fracStr ? `${whole}.${fracStr}` : whole.toString());
}

export function shortAddr(a: string | null | undefined): string {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}
