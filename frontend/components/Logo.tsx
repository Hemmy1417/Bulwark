export function BulwarkWordmark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const scale = size === "sm" ? 0.75 : size === "lg" ? 1.35 : 1;
  return (
    <div className="flex items-center gap-2.5" style={{ transform: `scale(${scale})`, transformOrigin: "left center" }}>
      <BulwarkMark />
      <span className="display text-[1.35rem] tracking-[0.14em] font-medium text-ivory">
        BULWARK
      </span>
    </div>
  );
}

export function BulwarkMark({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Shield outline in gold */}
      <path
        d="M20 4 L34 8 V22 C34 30 28 35 20 38 C12 35 6 30 6 22 V8 Z"
        stroke="#C9A961"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="rgba(201, 169, 97, 0.06)"
      />
      {/* Center notch — three vertical bars = the wall of a bulwark */}
      <rect x="14" y="14" width="2" height="14" fill="#E6C77A" />
      <rect x="19" y="12" width="2" height="16" fill="#E6C77A" />
      <rect x="24" y="14" width="2" height="14" fill="#E6C77A" />
      {/* Crown line */}
      <path d="M13 10 L20 6 L27 10" stroke="#E6C77A" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
