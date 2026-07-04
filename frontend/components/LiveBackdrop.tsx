"use client";

import { useEffect, useRef } from "react";

// Bulwark — "banger 2026" Lloyd's editorial spectacle.
// Higher-drama redesign built on:
//   • massive gold aurora glows drifting slowly
//   • parallax star field that tracks the cursor
//   • hero coat-of-arms shield with animated engravings + halo pulse
//   • rotating sunburst rays behind the shield
//   • cinematic searchlight beams sweeping the surface
//   • laurel-wreath ring
//   • sovereign coin glints, silk sweep, ripple pulses
//   • marquee ticker along the top edge
//   • diamond chart-hall grid + drifting policy hairlines
//   • respects prefers-reduced-motion

export function LiveBackdrop() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  // Parallax on the star field — subtle enough to feel alive, not gimmicky
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const el = parallaxRef.current;
    if (!el) return;
    let raf = 0;
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;

    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      targetX = (e.clientX / w - 0.5) * 24;
      targetY = (e.clientY / h - 0.5) * 24;
    };
    const tick = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      el.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const tickerText =
    "· COVERED: BUG · UNAVOIDABLE · NOT COVERED: NEGLIGENCE · NOT_SLASHED · SEALED ON GENLAYER STUDIONET · PREMIUMS FROM 1.0% · PAYOUTS IN MINUTES · MMXXVI · ";

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">

      {/* Base wash */}
      <div className="bw-vignette" />

      {/* Massive aurora glows */}
      <div className="bw-aurora bw-aur-1" />
      <div className="bw-aurora bw-aur-2" />
      <div className="bw-aurora bw-aur-3" />

      {/* Diamond grid */}
      <div className="bw-grid" />

      {/* Parallax star field */}
      <div ref={parallaxRef} className="bw-stars">
        {Array.from({ length: 60 }).map((_, i) => (
          <span key={i} className={`bw-star bw-s${i % 30}`} />
        ))}
      </div>

      {/* Rotating sunburst rays behind the shield */}
      <div className="bw-sunburst-wrap">
        <svg className="bw-sunburst" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="bw-ray-fade">
              <stop offset="0%"  stopColor="#E6C77A" stopOpacity="0" />
              <stop offset="40%" stopColor="#C9A961" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#C9A961" stopOpacity="0" />
            </radialGradient>
          </defs>
          {Array.from({ length: 36 }).map((_, i) => {
            const a = (i * Math.PI) / 18;
            const long = i % 2 === 0;
            const r = long ? 360 : 260;
            const x2 = (400 + Math.cos(a) * r).toFixed(3);
            const y2 = (400 + Math.sin(a) * r).toFixed(3);
            return (
              <line
                key={i}
                x1="400" y1="400"
                x2={x2} y2={y2}
                stroke="url(#bw-ray-fade)"
                strokeWidth={long ? "1" : "0.6"}
              />
            );
          })}
        </svg>
      </div>

      {/* Hero shield emblem with laurels + engravings */}
      <div className="bw-emblem-wrap">
        <svg className="bw-emblem" viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bw-shield-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#C9A961" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#0B1F3A" stopOpacity="0.15" />
            </linearGradient>
            <linearGradient id="bw-shield-stroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#E6C77A" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#8F7A45" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Laurel wreaths */}
          <g stroke="#C9A961" strokeOpacity="0.5" strokeWidth="1.5" fill="none">
            <path d="M 90 260 Q 70 200 90 130 Q 105 100 120 90" />
            <path d="M 310 260 Q 330 200 310 130 Q 295 100 280 90" />
            {Array.from({ length: 7 }).map((_, i) => {
              const t = i / 6;
              const y = 250 - t * 160;
              const angle = (i % 2 === 0 ? 1 : -1) * 0.3;
              return (
                <g key={i}>
                  <ellipse cx={82 - Math.abs(Math.sin(angle)) * 12} cy={y} rx="12" ry="4" transform={`rotate(${(angle * 180) / Math.PI + 200} ${82} ${y})`} fill="#C9A961" fillOpacity="0.28" />
                  <ellipse cx={318 + Math.abs(Math.sin(angle)) * 12} cy={y} rx="12" ry="4" transform={`rotate(${-((angle * 180) / Math.PI + 200)} ${318} ${y})`} fill="#C9A961" fillOpacity="0.28" />
                </g>
              );
            })}
          </g>

          {/* Shield body */}
          <path
            d="M 200 60 L 320 90 L 320 260 Q 320 360 200 430 Q 80 360 80 260 L 80 90 Z"
            fill="url(#bw-shield-fill)"
            stroke="url(#bw-shield-stroke)"
            strokeWidth="2"
          />
          {/* Inner border */}
          <path
            d="M 200 76 L 310 102 L 310 258 Q 310 350 200 415 Q 90 350 90 258 L 90 102 Z"
            fill="none"
            stroke="#C9A961" strokeOpacity="0.4"
            strokeWidth="1" strokeDasharray="6 4"
          />

          {/* Central bulwark bars — the wall */}
          <g fill="#E6C77A" fillOpacity="0.7">
            <rect x="146" y="180" width="14" height="120" rx="2" />
            <rect x="193" y="160" width="14" height="140" rx="2" />
            <rect x="240" y="180" width="14" height="120" rx="2" />
          </g>

          {/* Crenellations on top of the bars */}
          <g fill="#E6C77A" fillOpacity="0.55">
            <rect x="146" y="174" width="4" height="10" />
            <rect x="153" y="174" width="4" height="10" />
            <rect x="193" y="154" width="4" height="10" />
            <rect x="200" y="154" width="4" height="10" />
            <rect x="240" y="174" width="4" height="10" />
            <rect x="247" y="174" width="4" height="10" />
          </g>

          {/* Motto scroll */}
          <g fontFamily="EB Garamond, serif" fill="#E6C77A" fillOpacity="0.6" textAnchor="middle">
            <text x="200" y="345" fontSize="10" letterSpacing="6">SLASHING · SEALED · SETTLED</text>
            <text x="200" y="365" fontSize="8"  letterSpacing="10">MMXXVI</text>
          </g>

          {/* Corner rivets */}
          <g fill="#C9A961" fillOpacity="0.6">
            <circle cx="98"  cy="106" r="3" />
            <circle cx="302" cy="106" r="3" />
            <circle cx="98"  cy="260" r="3" />
            <circle cx="302" cy="260" r="3" />
          </g>

          {/* Halo pulse — bigger animation on this circle */}
          <circle
            className="bw-halo"
            cx="200" cy="250" r="180"
            fill="none"
            stroke="#E6C77A"
            strokeOpacity="0.35"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Cinematic searchlight beams */}
      <div className="bw-beams">
        <span className="bw-beam bw-beam-1" />
        <span className="bw-beam bw-beam-2" />
      </div>

      {/* Silk sweep */}
      <div className="bw-silk" />

      {/* Marquee ticker along the top edge */}
      <div className="bw-ticker">
        <div className="bw-ticker-track">
          <span>{tickerText}{tickerText}{tickerText}</span>
        </div>
      </div>

      {/* Sovereign glints */}
      <div className="bw-glints">
        {Array.from({ length: 16 }).map((_, i) => (
          <span key={i} className={`bw-glint bw-g${i}`} />
        ))}
      </div>

      {/* Wax ripples */}
      <div className="bw-ripples">
        <span className="bw-ripple bw-rip-tl" />
        <span className="bw-ripple bw-rip-br" />
        <span className="bw-ripple bw-rip-tr" />
      </div>

      {/* Drifting hairlines */}
      <div className="bw-lines">
        {Array.from({ length: 11 }).map((_, i) => (
          <span key={i} className={`bw-line bw-l${i}`} />
        ))}
      </div>

      <style jsx>{`
        /* ── Base wash ───────────────────────────────────────────────── */
        .bw-vignette {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 70% 50% at 50% 15%,
              rgba(201, 169, 97, 0.14) 0%, transparent 65%),
            radial-gradient(ellipse 90% 60% at 50% 100%,
              rgba(7, 19, 40, 0.98) 0%, transparent 60%),
            linear-gradient(180deg, #071328 0%, #0B1F3A 50%, #071328 100%);
        }

        /* ── Aurora blooms ───────────────────────────────────────────── */
        .bw-aurora {
          position: absolute;
          border-radius: 9999px;
          filter: blur(90px);
          opacity: 0.55;
          mix-blend-mode: screen;
          will-change: transform;
        }
        .bw-aur-1 {
          width: 620px; height: 620px;
          top: -160px; left: -140px;
          background: radial-gradient(circle at 40% 40%, #E6C77A, transparent 70%);
          animation: bwDriftA 26s ease-in-out infinite;
        }
        .bw-aur-2 {
          width: 720px; height: 720px;
          top: 30%; right: -180px;
          background: radial-gradient(circle at 60% 40%, #C9A961, transparent 70%);
          animation: bwDriftB 32s ease-in-out infinite;
        }
        .bw-aur-3 {
          width: 560px; height: 560px;
          bottom: -140px; left: 40%;
          background: radial-gradient(circle at 50% 50%, #8F7A45, transparent 70%);
          animation: bwDriftC 36s ease-in-out infinite;
        }
        @keyframes bwDriftA {
          0%, 100% { transform: translate(0, 0)          scale(1);    }
          50%       { transform: translate(120px, 80px)   scale(1.15); }
        }
        @keyframes bwDriftB {
          0%, 100% { transform: translate(0, 0)          scale(1);    }
          50%       { transform: translate(-140px, 100px) scale(1.1);  }
        }
        @keyframes bwDriftC {
          0%, 100% { transform: translate(0, 0)          scale(1);    }
          50%       { transform: translate(80px, -120px)  scale(1.2);  }
        }

        /* ── Chart-hall grid ─────────────────────────────────────────── */
        .bw-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(45deg,  rgba(201,169,97,0.05) 25%, transparent 25.5%, transparent 74.5%, rgba(201,169,97,0.05) 75%),
            linear-gradient(-45deg, rgba(201,169,97,0.05) 25%, transparent 25.5%, transparent 74.5%, rgba(201,169,97,0.05) 75%);
          background-size: 72px 72px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 25%, transparent 90%);
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 25%, transparent 90%);
        }

        /* ── Star field ──────────────────────────────────────────────── */
        .bw-stars {
          position: absolute; inset: 0;
          will-change: transform;
        }
        .bw-star {
          position: absolute;
          width: 2px; height: 2px;
          background: #E6C77A;
          border-radius: 50%;
          box-shadow: 0 0 6px rgba(230, 199, 122, 0.6);
          animation: bwTwinkle ease-in-out infinite;
        }
        @keyframes bwTwinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.6); }
          50%       { opacity: 0.95; transform: scale(1.3); }
        }
        ${starRules(60)}

        /* ── Sunburst rays ───────────────────────────────────────────── */
        .bw-sunburst-wrap {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: min(96vw, 900px);
          height: min(96vw, 900px);
          mix-blend-mode: screen;
          opacity: 0.55;
          will-change: transform;
        }
        .bw-sunburst {
          width: 100%; height: 100%;
          animation: bwRaysSpin 90s linear infinite;
          transform-origin: 50% 50%;
        }
        @keyframes bwRaysSpin {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }

        /* ── Hero emblem ─────────────────────────────────────────────── */
        .bw-emblem-wrap {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -46%);
          width: min(70vw, 520px);
          height: min(70vw, 520px);
          opacity: 0.35;
          mix-blend-mode: screen;
          filter: drop-shadow(0 0 40px rgba(230, 199, 122, 0.25));
          animation: bwEmblemBreathe 8s ease-in-out infinite;
          will-change: transform, filter;
        }
        .bw-emblem { width: 100%; height: 100%; }
        @keyframes bwEmblemBreathe {
          0%, 100% { transform: translate(-50%, -46%) scale(1);
                      filter: drop-shadow(0 0 30px rgba(230, 199, 122, 0.2)); }
          50%       { transform: translate(-50%, -46%) scale(1.04);
                      filter: drop-shadow(0 0 60px rgba(230, 199, 122, 0.4)); }
        }
        .bw-halo {
          transform-origin: 200px 250px;
          transform-box: fill-box;
          animation: bwHalo 5s ease-out infinite;
        }
        @keyframes bwHalo {
          0%   { transform: scale(0.8); stroke-opacity: 0.7; }
          100% { transform: scale(1.4); stroke-opacity: 0;   }
        }

        /* ── Searchlight beams ───────────────────────────────────────── */
        .bw-beams { position: absolute; inset: 0; overflow: hidden; }
        .bw-beam {
          position: absolute;
          top: -20%;
          width: 80px; height: 140vh;
          background: linear-gradient(180deg,
            transparent 0%,
            rgba(230, 199, 122, 0.10) 40%,
            rgba(230, 199, 122, 0.05) 55%,
            transparent 100%);
          filter: blur(4px);
          transform-origin: top center;
          mix-blend-mode: screen;
        }
        .bw-beam-1 {
          left: 22%;
          transform: rotate(12deg);
          animation: bwBeamSweep1 22s ease-in-out infinite;
        }
        .bw-beam-2 {
          left: 68%;
          transform: rotate(-12deg);
          animation: bwBeamSweep2 26s ease-in-out infinite;
        }
        @keyframes bwBeamSweep1 {
          0%, 100% { transform: rotate(4deg)  translateX(0);    opacity: 0.6; }
          50%       { transform: rotate(18deg) translateX(80px); opacity: 1;   }
        }
        @keyframes bwBeamSweep2 {
          0%, 100% { transform: rotate(-4deg)  translateX(0);    opacity: 0.6; }
          50%       { transform: rotate(-18deg) translateX(-80px); opacity: 1;   }
        }

        /* ── Silk sweep ──────────────────────────────────────────────── */
        .bw-silk {
          position: absolute; inset: 0;
          background: linear-gradient(105deg,
            transparent 0%,
            transparent 40%,
            rgba(230, 199, 122, 0.09) 50%,
            transparent 60%,
            transparent 100%);
          background-size: 250% 100%;
          animation: bwSilk 18s linear infinite;
          mix-blend-mode: screen;
        }
        @keyframes bwSilk {
          from { background-position: -100% 0; }
          to   { background-position:  250% 0; }
        }

        /* ── Ticker ──────────────────────────────────────────────────── */
        .bw-ticker {
          position: absolute;
          top: 4px; left: 0; right: 0;
          height: 22px;
          overflow: hidden;
          mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
        }
        .bw-ticker-track {
          animation: bwTicker 80s linear infinite;
          white-space: nowrap;
          will-change: transform;
        }
        .bw-ticker-track span {
          font-family: ui-monospace, monospace;
          font-size: 11px;
          letter-spacing: 0.24em;
          color: rgba(201, 169, 97, 0.4);
          text-transform: uppercase;
        }
        @keyframes bwTicker {
          from { transform: translateX(0);      }
          to   { transform: translateX(-33.33%);}
        }

        /* ── Glints ──────────────────────────────────────────────────── */
        .bw-glints { position: absolute; inset: 0; }
        .bw-glint {
          position: absolute;
          width: 8px; height: 8px;
          background: radial-gradient(circle,
            rgba(255, 240, 190, 1) 0%,
            rgba(230, 199, 122, 0.7) 40%,
            transparent 70%);
          border-radius: 50%;
          animation: bwGlint ease-in-out infinite;
        }
        @keyframes bwGlint {
          0%, 92%, 100% { opacity: 0; transform: scale(0.4); }
          4%             { opacity: 1; transform: scale(1.6); }
        }
        ${glintRules(16)}

        /* ── Wax ripples ─────────────────────────────────────────────── */
        .bw-ripples { position: absolute; inset: 0; }
        .bw-ripple {
          position: absolute;
          width: 240px; height: 240px;
          border-radius: 50%;
          border: 1.5px solid rgba(201, 169, 97, 0.35);
          animation: bwRipple 9s ease-out infinite;
        }
        .bw-rip-tl { top:   6%; left:  3%; animation-delay: 0s; }
        .bw-rip-br { bottom:8%; right: 5%; animation-delay: 4s; }
        .bw-rip-tr { top:   4%; right:12%; animation-delay: 6s; }
        @keyframes bwRipple {
          0%   { transform: scale(0.25); opacity: 0.7; border-color: rgba(230, 199, 122, 0.55); }
          100% { transform: scale(2.4);  opacity: 0;   border-color: rgba(201, 169, 97, 0);     }
        }

        /* ── Drifting hairlines ──────────────────────────────────────── */
        .bw-lines { position: absolute; inset: 0; }
        .bw-line {
          position: absolute;
          height: 1px;
          width: 40vw;
          background: linear-gradient(to right,
            transparent 0%,
            rgba(230, 199, 122, 0.4) 50%,
            transparent 100%);
          animation: bwDrift linear infinite;
          will-change: transform, opacity;
        }
        @keyframes bwDrift {
          0%   { transform: translateX(120vw); opacity: 0; }
          20%  { opacity: 0.65; }
          80%  { opacity: 0.65; }
          100% { transform: translateX(-120vw); opacity: 0; }
        }
        .bw-l0  { top:  8%; animation-duration: 26s; animation-delay:  0s;  }
        .bw-l1  { top: 16%; animation-duration: 32s; animation-delay:  3s;  }
        .bw-l2  { top: 24%; animation-duration: 28s; animation-delay:  7s;  }
        .bw-l3  { top: 34%; animation-duration: 34s; animation-delay:  2s;  }
        .bw-l4  { top: 44%; animation-duration: 30s; animation-delay:  6s;  }
        .bw-l5  { top: 54%; animation-duration: 26s; animation-delay: 10s;  }
        .bw-l6  { top: 64%; animation-duration: 32s; animation-delay:  4s;  }
        .bw-l7  { top: 74%; animation-duration: 28s; animation-delay:  8s;  }
        .bw-l8  { top: 82%; animation-duration: 34s; animation-delay:  1s;  }
        .bw-l9  { top: 90%; animation-duration: 30s; animation-delay:  5s;  }
        .bw-l10 { top: 96%; animation-duration: 28s; animation-delay:  9s;  }

        @media (prefers-reduced-motion: reduce) {
          .bw-aurora, .bw-sunburst, .bw-emblem-wrap, .bw-halo, .bw-beam,
          .bw-silk, .bw-ticker-track, .bw-glint, .bw-ripple, .bw-line,
          .bw-star { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

// ── Generated CSS blocks (kept in JS for cleanliness / repeatability) ──────

// 60 stars, positioned deterministically from index so SSR/CSR match.
function starRules(n: number): string {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    // Simple hash based on i — no randomness, so SSR + CSR agree.
    const top   = ((i * 37) % 100).toFixed(2);
    const left  = ((i * 53 + 7) % 100).toFixed(2);
    const dur   = (3 + ((i * 17) % 40) / 10).toFixed(2);
    const delay = (((i * 11) % 60) / 10).toFixed(2);
    const size  = i % 5 === 0 ? "3px" : i % 3 === 0 ? "2px" : "1.5px";
    out.push(
      `.bw-s${i} { top: ${top}%; left: ${left}%; width: ${size}; height: ${size}; ` +
      `animation-duration: ${dur}s; animation-delay: ${delay}s; }`
    );
  }
  return out.join("\n");
}

function glintRules(n: number): string {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const top   = ((i * 43 + 12) % 90).toFixed(2);
    const left  = ((i * 67 + 5)  % 95).toFixed(2);
    const dur   = (8 + ((i * 13) % 60) / 10).toFixed(2);
    const delay = ((i * 7) % 12).toFixed(2);
    out.push(
      `.bw-g${i} { top: ${top}%; left: ${left}%; animation-duration: ${dur}s; animation-delay: ${delay}s; }`
    );
  }
  return out.join("\n");
}
