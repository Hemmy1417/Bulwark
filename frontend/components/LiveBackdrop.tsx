"use client";

// Bulwark — Lloyd's-of-London editorial live backdrop.
// Layers, back to front:
//   1. Deep navy vignette + soft fog wash
//   2. Faint chartered-hall diamond grid
//   3. Constellation of gold stars (upper hemisphere)
//   4. Twin counter-rotating gold seals-of-office (main + faint outer)
//   5. Silk beam sweep passing across the whole surface
//   6. Floating insurance certificates (translucent parchment cards)
//   7. Gold sovereign glints (tiny bright flashes)
//   8. Wax-seal ripple pulses in the corners
//   9. Drifting policy-doc horizontal hairlines

export function LiveBackdrop() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="bw-vignette" />
      <div className="bw-grid" />

      {/* Constellation */}
      <div className="bw-stars">
        {Array.from({ length: 28 }).map((_, i) => (
          <span key={i} className={`bw-star bw-s${i}`} />
        ))}
      </div>

      {/* Twin seals — one rotating clockwise, one counter, at different rates */}
      <div className="bw-seal-wrap">
        <svg className="bw-seal-outer" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="#C9A961" strokeOpacity="0.22">
            <circle cx="200" cy="200" r="195" strokeWidth="1" strokeDasharray="2 6" />
            <circle cx="200" cy="200" r="184" strokeWidth="1" />
            {Array.from({ length: 48 }).map((_, i) => {
              const a = (i * Math.PI) / 24;
              // Round to fixed precision so SSR and client-render produce
              // byte-identical strings — otherwise React flags a hydration
              // mismatch on the 14th decimal place of Math.cos/sin output.
              const x1 = (200 + Math.cos(a) * 184).toFixed(3);
              const y1 = (200 + Math.sin(a) * 184).toFixed(3);
              const x2 = (200 + Math.cos(a) * 195).toFixed(3);
              const y2 = (200 + Math.sin(a) * 195).toFixed(3);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="0.7" />;
            })}
          </g>
        </svg>

        <svg className="bw-seal-inner" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="bw-seal-glow">
              <stop offset="0%"  stopColor="#E6C77A" stopOpacity="0.15" />
              <stop offset="70%" stopColor="#C9A961" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#C9A961" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="200" cy="200" r="170" fill="url(#bw-seal-glow)" />
          <g fill="none" stroke="#C9A961" strokeOpacity="0.35">
            <circle cx="200" cy="200" r="160" strokeWidth="1" />
            <circle cx="200" cy="200" r="130" strokeWidth="1" strokeDasharray="4 8" />
            <circle cx="200" cy="200" r="100" strokeWidth="1" />
            <circle cx="200" cy="200" r="60"  strokeWidth="1.5" />
            <circle cx="200" cy="200" r="40"  strokeWidth="1" strokeDasharray="2 3" />
            {Array.from({ length: 24 }).map((_, i) => {
              const a = (i * Math.PI) / 12;
              const x1 = (200 + Math.cos(a) * 130).toFixed(3);
              const y1 = (200 + Math.sin(a) * 130).toFixed(3);
              const x2 = (200 + Math.cos(a) * 158).toFixed(3);
              const y2 = (200 + Math.sin(a) * 158).toFixed(3);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1" />;
            })}
          </g>
          {/* Bulwark shield inside the seal */}
          <g transform="translate(200 200)" fill="#C9A961" fillOpacity="0.4">
            <rect x="-14" y="-16" width="3" height="32" />
            <rect x="-1"  y="-20" width="3" height="40" />
            <rect x="12"  y="-16" width="3" height="32" />
          </g>
          <g fontFamily="EB Garamond, serif" fill="#C9A961" fillOpacity="0.5" textAnchor="middle">
            <text x="200" y="245" fontSize="10" letterSpacing="8">BULWARK · MMXXVI</text>
          </g>
        </svg>
      </div>

      {/* Silk sweep */}
      <div className="bw-silk" />

      {/* Floating certificates */}
      <div className="bw-certs">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={`bw-cert bw-c${i}`} />
        ))}
      </div>

      {/* Sovereign glints — tiny gold flashes */}
      <div className="bw-glints">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className={`bw-glint bw-g${i}`} />
        ))}
      </div>

      {/* Corner wax ripples */}
      <div className="bw-ripples">
        <span className="bw-ripple bw-rip-tl" />
        <span className="bw-ripple bw-rip-br" />
      </div>

      {/* Drifting policy-doc hairlines */}
      <div className="bw-lines">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className={`bw-line bw-l${i}`} />
        ))}
      </div>

      <style jsx>{`
        /* ── Base wash ── */
        .bw-vignette {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 50% 10%,
              rgba(201, 169, 97, 0.10) 0%, transparent 60%),
            radial-gradient(ellipse 90% 60% at 50% 100%,
              rgba(7, 19, 40, 0.95) 0%, transparent 60%);
        }

        .bw-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(45deg,  rgba(201,169,97,0.035) 25%, transparent 25.5%, transparent 74.5%, rgba(201,169,97,0.035) 75%),
            linear-gradient(-45deg, rgba(201,169,97,0.035) 25%, transparent 25.5%, transparent 74.5%, rgba(201,169,97,0.035) 75%);
          background-size: 72px 72px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 85%);
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 85%);
        }

        /* ── Constellation ── */
        .bw-stars { position: absolute; inset: 0; }
        .bw-star {
          position: absolute;
          width: 2px; height: 2px;
          background: #E6C77A;
          border-radius: 50%;
          box-shadow: 0 0 5px rgba(230, 199, 122, 0.6);
          animation: bwTwinkle ease-in-out infinite;
        }
        @keyframes bwTwinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.7); }
          50%       { opacity: 0.85; transform: scale(1.2); }
        }
        .bw-s0  { top:  4%; left:  6%; animation-duration: 4s;  animation-delay: 0s;   }
        .bw-s1  { top:  7%; left: 18%; animation-duration: 5s;  animation-delay: 1s;   }
        .bw-s2  { top: 10%; left: 34%; animation-duration: 3s;  animation-delay: 2s;   }
        .bw-s3  { top:  5%; left: 44%; animation-duration: 6s;  animation-delay: 0.5s; }
        .bw-s4  { top:  8%; left: 58%; animation-duration: 4s;  animation-delay: 3s;   }
        .bw-s5  { top: 11%; left: 72%; animation-duration: 5s;  animation-delay: 1.5s; }
        .bw-s6  { top:  6%; left: 84%; animation-duration: 3.5s; animation-delay: 2.5s; }
        .bw-s7  { top:  9%; left: 94%; animation-duration: 4.5s; animation-delay: 0.8s; }
        .bw-s8  { top: 14%; left: 10%; animation-duration: 5s;  animation-delay: 1.2s; width: 1.5px; height: 1.5px; }
        .bw-s9  { top: 16%; left: 26%; animation-duration: 4s;  animation-delay: 0.3s; }
        .bw-s10 { top: 18%; left: 42%; animation-duration: 6s;  animation-delay: 2.2s; }
        .bw-s11 { top: 20%; left: 62%; animation-duration: 3.5s; animation-delay: 1.8s; }
        .bw-s12 { top: 22%; left: 78%; animation-duration: 4.5s; animation-delay: 2.8s; }
        .bw-s13 { top: 24%; left: 90%; animation-duration: 5s;  animation-delay: 0s;   }
        .bw-s14 { top: 28%; left:  4%; animation-duration: 4s;  animation-delay: 3.2s; width: 1.5px; height: 1.5px; }
        .bw-s15 { top: 30%; left: 22%; animation-duration: 6s;  animation-delay: 1s;   }
        .bw-s16 { top: 32%; left: 82%; animation-duration: 4.5s; animation-delay: 2s;   }
        .bw-s17 { top: 34%; left: 96%; animation-duration: 3s;  animation-delay: 0.7s; }
        .bw-s18 { top: 68%; left:  8%; animation-duration: 5s;  animation-delay: 1.6s; width: 1.5px; height: 1.5px; }
        .bw-s19 { top: 74%; left: 92%; animation-duration: 4s;  animation-delay: 2.4s; }
        .bw-s20 { top: 82%; left: 14%; animation-duration: 6s;  animation-delay: 0.5s; }
        .bw-s21 { top: 86%; left: 30%; animation-duration: 3.5s; animation-delay: 1.9s; }
        .bw-s22 { top: 90%; left: 48%; animation-duration: 5s;  animation-delay: 2.6s; width: 1.5px; height: 1.5px; }
        .bw-s23 { top: 88%; left: 66%; animation-duration: 4s;  animation-delay: 0.9s; }
        .bw-s24 { top: 92%; left: 80%; animation-duration: 5.5s; animation-delay: 3s;   }
        .bw-s25 { top: 96%; left:  6%; animation-duration: 4s;  animation-delay: 2.1s; }
        .bw-s26 { top: 96%; left: 96%; animation-duration: 5s;  animation-delay: 1.4s; }
        .bw-s27 { top: 40%; left:  2%; animation-duration: 6s;  animation-delay: 0.6s; width: 1.5px; height: 1.5px; }

        /* ── Seals of office ── */
        .bw-seal-wrap {
          position: absolute;
          top: 4%; left: 50%;
          transform: translateX(-50%);
          width: min(90vw, 780px);
          height: min(90vw, 780px);
          mix-blend-mode: screen;
          will-change: transform;
        }
        .bw-seal-outer,
        .bw-seal-inner {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          transform-origin: 50% 50%;
        }
        .bw-seal-outer {
          opacity: 0.28;
          animation: bwSpinCW 180s linear infinite;
        }
        .bw-seal-inner {
          opacity: 0.34;
          animation: bwSpinCCW 120s linear infinite, bwBreathe 8s ease-in-out infinite;
        }
        @keyframes bwSpinCW  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);   } }
        @keyframes bwSpinCCW { from { transform: rotate(0deg);   } to { transform: rotate(-360deg);  } }
        @keyframes bwBreathe {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(230, 199, 122, 0.15)); }
          50%       { filter: drop-shadow(0 0 24px rgba(230, 199, 122, 0.35)); }
        }

        /* ── Silk sweep ── */
        .bw-silk {
          position: absolute; inset: 0;
          background: linear-gradient(105deg,
            transparent 0%,
            transparent 40%,
            rgba(230, 199, 122, 0.06) 50%,
            transparent 60%,
            transparent 100%);
          background-size: 250% 100%;
          animation: bwSilk 24s linear infinite;
        }
        @keyframes bwSilk {
          from { background-position: -100% 0; }
          to   { background-position:  250% 0; }
        }

        /* ── Floating certificates ── */
        .bw-certs { position: absolute; inset: 0; }
        .bw-cert {
          position: absolute;
          width: 90px; height: 62px;
          border: 1px solid rgba(201, 169, 97, 0.28);
          background: linear-gradient(135deg,
            rgba(243, 238, 223, 0.03) 0%,
            rgba(201, 169, 97, 0.03) 100%);
          border-radius: 2px;
          box-shadow: 0 0 20px rgba(201, 169, 97, 0.08),
                      inset 0 1px 0 rgba(230, 199, 122, 0.15);
          animation: bwCertDrift linear infinite;
          will-change: transform, opacity;
        }
        .bw-cert::before,
        .bw-cert::after {
          content: "";
          position: absolute;
          left: 10px; right: 10px;
          height: 1px;
          background: rgba(201, 169, 97, 0.35);
        }
        .bw-cert::before { top: 14px; }
        .bw-cert::after  { top: 26px; right: 30px; }
        @keyframes bwCertDrift {
          0%   { transform: translate(0, 0) rotate(-6deg); opacity: 0; }
          10%  { opacity: 0.65; }
          90%  { opacity: 0.65; }
          100% { transform: translate(var(--dx, 60px), -110vh) rotate(4deg); opacity: 0; }
        }
        .bw-c0 { left:  8%; bottom: -80px; --dx:  40px; animation-duration: 46s; animation-delay:  0s; }
        .bw-c1 { left: 30%; bottom: -80px; --dx: -50px; animation-duration: 54s; animation-delay: 12s; }
        .bw-c2 { left: 52%; bottom: -80px; --dx:  70px; animation-duration: 48s; animation-delay:  6s; }
        .bw-c3 { left: 72%; bottom: -80px; --dx: -30px; animation-duration: 52s; animation-delay: 18s; }
        .bw-c4 { left: 90%; bottom: -80px; --dx: -60px; animation-duration: 50s; animation-delay:  9s; }

        /* ── Sovereign glints ── */
        .bw-glints { position: absolute; inset: 0; }
        .bw-glint {
          position: absolute;
          width: 6px; height: 6px;
          background: radial-gradient(circle,
            rgba(255, 235, 170, 0.9) 0%,
            rgba(230, 199, 122, 0.6) 40%,
            transparent 70%);
          border-radius: 50%;
          animation: bwGlint ease-in-out infinite;
        }
        @keyframes bwGlint {
          0%, 90%, 100% { opacity: 0; transform: scale(0.4); }
          5%             { opacity: 1; transform: scale(1.4); }
        }
        .bw-g0  { top: 15%; left:  6%; animation-duration: 9s;  animation-delay:  0s; }
        .bw-g1  { top: 23%; left: 28%; animation-duration: 11s; animation-delay:  2s; }
        .bw-g2  { top: 12%; left: 42%; animation-duration: 8s;  animation-delay:  4s; }
        .bw-g3  { top: 26%; left: 66%; animation-duration: 10s; animation-delay:  6s; }
        .bw-g4  { top: 18%; left: 84%; animation-duration: 12s; animation-delay:  1s; }
        .bw-g5  { top: 40%; left: 12%; animation-duration: 9s;  animation-delay:  8s; }
        .bw-g6  { top: 46%; left: 90%; animation-duration: 11s; animation-delay:  3s; }
        .bw-g7  { top: 62%; left:  8%; animation-duration: 10s; animation-delay:  5s; }
        .bw-g8  { top: 68%; left: 46%; animation-duration: 8s;  animation-delay:  7s; }
        .bw-g9  { top: 74%; left: 88%; animation-duration: 12s; animation-delay:  9s; }
        .bw-g10 { top: 86%; left: 24%; animation-duration: 9s;  animation-delay: 11s; }
        .bw-g11 { top: 90%; left: 70%; animation-duration: 11s; animation-delay:  4s; }

        /* ── Wax ripples ── */
        .bw-ripples { position: absolute; inset: 0; }
        .bw-ripple {
          position: absolute;
          width: 200px; height: 200px;
          border-radius: 50%;
          border: 1.5px solid rgba(201, 169, 97, 0.35);
          animation: bwRipple 8s ease-out infinite;
        }
        .bw-rip-tl { top: 8%;  left: 4%;   animation-delay: 0s; }
        .bw-rip-br { bottom: 12%; right: 6%; animation-delay: 4s; }
        @keyframes bwRipple {
          0%   { transform: scale(0.3); opacity: 0.7; border-color: rgba(230, 199, 122, 0.5); }
          100% { transform: scale(2.2); opacity: 0;   border-color: rgba(201, 169, 97, 0);    }
        }

        /* ── Drifting hairlines ── */
        .bw-lines { position: absolute; inset: 0; }
        .bw-line {
          position: absolute;
          height: 1px;
          width: 40vw;
          background: linear-gradient(to right,
            transparent 0%,
            rgba(201, 169, 97, 0.35) 50%,
            transparent 100%);
          animation: bwDrift linear infinite;
          will-change: transform, opacity;
        }
        @keyframes bwDrift {
          0%   { transform: translateX(120vw); opacity: 0; }
          20%  { opacity: 0.55; }
          80%  { opacity: 0.55; }
          100% { transform: translateX(-120vw); opacity: 0; }
        }
        .bw-l0 { top: 10%; animation-duration: 30s; animation-delay:  0s;  }
        .bw-l1 { top: 20%; animation-duration: 36s; animation-delay:  4s;  }
        .bw-l2 { top: 30%; animation-duration: 32s; animation-delay:  8s;  }
        .bw-l3 { top: 42%; animation-duration: 38s; animation-delay:  2s;  }
        .bw-l4 { top: 54%; animation-duration: 34s; animation-delay:  6s;  }
        .bw-l5 { top: 66%; animation-duration: 30s; animation-delay: 10s;  }
        .bw-l6 { top: 78%; animation-duration: 36s; animation-delay:  3s;  }
        .bw-l7 { top: 88%; animation-duration: 32s; animation-delay:  7s;  }
        .bw-l8 { top: 95%; animation-duration: 34s; animation-delay:  1s;  }

        @media (prefers-reduced-motion: reduce) {
          .bw-star, .bw-seal-outer, .bw-seal-inner, .bw-silk, .bw-cert,
          .bw-glint, .bw-ripple, .bw-line { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
