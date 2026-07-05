// Preflight utilities for the claim-evidence form. Applied client-side
// before the user pays a tx fee so we can flag URLs the panel is known to
// fail on. Categories are derived from the empirical fetch matrix in
// README.md — updates there should be mirrored here.

export type EvidenceVerdict =
  | { status: "ok"; note?: string }
  | { status: "warn";  note: string }
  | { status: "block"; note: string };

/**
 * Hosts confirmed to return 403 to non-browser fetchers, or that render
 * their meaningful content only under a JS shell that the validators
 * cannot execute. A URL matching any of these is inadmissible evidence.
 */
const BLOCKED_HOSTS: { rx: RegExp; reason: string }[] = [
  { rx: /(^|\.)beaconcha\.in$/i,
    reason: "beaconcha.in returns 403 to non-browser fetchers — validators cannot read it. Use beaconscan.com/validator/<index> instead." },
  { rx: /(^|\.)etherscan\.io$/i,
    reason: "Etherscan blocks validator queries with 403 — use beaconscan.com or mintscan.io for the target chain." },
  { rx: /(^|\.)twitter\.com$|(^|\.)x\.com$/i,
    reason: "Twitter/X is JavaScript-only — the panel receives an empty shell. Post the content to a public Gist and cite that instead, or use a Nitter mirror." },
  { rx: /(^|\.)mirror\.xyz$/i,
    reason: "Mirror.xyz articles render their body via JavaScript — the panel cannot read the text. Cross-post to a Gist or archive.org and cite that URL." },
  { rx: /(^|\.)linkedin\.com$/i,
    reason: "LinkedIn requires authentication and returns a JS shell to unauthenticated fetchers." },
];

/**
 * Hosts that fetch cleanly and typically carry decision-worthy content.
 * Used only to promote the primary URL confidence — not for gating.
 */
const RECOMMENDED_HOSTS = [
  /(^|\.)beaconscan\.com$/i,
  /(^|\.)mintscan\.io$/i,
  /(^|\.)gist\.githubusercontent\.com$/i,
  /(^|\.)github\.com$/i,
  /(^|\.)ethereum\.org$/i,
  /(^|\.)wikipedia\.org$/i,
];

export function classify(url: string): EvidenceVerdict {
  const raw = url.trim();
  if (!raw) return { status: "ok" };
  if (!/^https?:\/\//i.test(raw)) {
    return {
      status: "block",
      note: "URL must start with http:// or https://",
    };
  }
  let host = "";
  try {
    host = new URL(raw).hostname;
  } catch {
    return { status: "block", note: "Malformed URL" };
  }

  for (const b of BLOCKED_HOSTS) {
    if (b.rx.test(host)) {
      return { status: "block", note: b.reason };
    }
  }

  if (RECOMMENDED_HOSTS.some((rx) => rx.test(host))) {
    return { status: "ok", note: "Fetch-friendly host." };
  }

  // Unknown host — soft warning so the user knows the panel will try but
  // no guarantee. Errs on the side of not blocking legitimate operator blogs.
  return {
    status: "warn",
    note: "Unknown host — the panel will attempt the fetch but if it 403s or serves a JS shell the URL will be dropped from evidence.",
  };
}

/**
 * Whole-form preflight: returns an aggregate verdict. Empty URLs are
 * ignored (they're the placeholders for optional cause slots).
 */
export function preflight(primary: string, causeUrls: string[]) {
  const primaryVerdict = classify(primary);
  const causeVerdicts = causeUrls.map(classify);
  const hasBlocked =
    primaryVerdict.status === "block" ||
    causeVerdicts.some((v) => v.status === "block");
  const causeCount = causeUrls.filter((u) => u.trim().length > 0).length;
  return {
    primary: primaryVerdict,
    cause:   causeVerdicts,
    hasBlocked,
    causeCount,
  };
}
