"use client";

// Lloyd's-of-London editorial: navy fog, a slow gold seal-of-office
// rotating behind the hero, drifting policy-doc horizontal lines, and
// a faint diamond chart-hall grid. Rich but restrained.

export function LiveBackdrop() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="bw-fog" />

      {/* Gold seal — SVG so it renders crisp at any size */}
      <div className="bw-seal-wrap">
        <svg className="bw-seal" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="#C9A961" strokeOpacity="0.35">
            <circle cx="200" cy="200" r="180" strokeWidth="1" />
            <circle cx="200" cy="200" r="150" strokeWidth="1" strokeDasharray="4 8" />
            <circle cx="200" cy="200" r="120" strokeWidth="1" />
            <circle cx="200" cy="200" r="60"  strokeWidth="1.5" />
            {Array.from({ length: 24 }).map((_, i) => {
              const a = (i * Math.PI) / 12;
              const x1 = 200 + Math.cos(a) * 140;
              const y1 = 200 + Math.sin(a) * 140;
              const x2 = 200 + Math.cos(a) * 172;
              const y2 = 200 + Math.sin(a) * 172;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1" />;
            })}
          </g>
          <g fontFamily="EB Garamond, serif" fontSize="14" fill="#C9A961" fillOpacity="0.5" textAnchor="middle">
            <text x="200" y="204" fontSize="34" letterSpacing="6">BULWARK</text>
            <text x="200" y="230" fontSize="10" letterSpacing="8">MMXXVI</text>
          </g>
        </svg>
      </div>

      <div className="bw-grid" />
      <div className="bw-lines">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className={`bw-line bw-l${i}`} />
        ))}
      </div>

      <style jsx>{`
        .bw-fog {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 50% 15%,
              rgba(201, 169, 97, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 80% 60% at 50% 100%,
              rgba(7, 19, 40, 0.9) 0%, transparent 60%);
        }

        .bw-seal-wrap {
          position: absolute;
          top: 5%; left: 50%;
          transform: translateX(-50%);
          width: min(90vw, 720px);
          height: min(90vw, 720px);
          opacity: 0.22;
          mix-blend-mode: screen;
          will-change: transform;
          animation: bwSpin 120s linear infinite;
        }
        .bw-seal { width: 100%; height: 100%; }
        @keyframes bwSpin {
          from { transform: translateX(-50%) rotate(0deg);   }
          to   { transform: translateX(-50%) rotate(360deg); }
        }

        .bw-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(45deg,  rgba(201, 169, 97, 0.03) 25%, transparent 25.5%, transparent 74.5%, rgba(201, 169, 97, 0.03) 75%),
            linear-gradient(-45deg, rgba(201, 169, 97, 0.03) 25%, transparent 25.5%, transparent 74.5%, rgba(201, 169, 97, 0.03) 75%);
          background-size: 64px 64px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 85%);
          -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 85%);
        }

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
          20%  { opacity: 0.6; }
          80%  { opacity: 0.6; }
          100% { transform: translateX(-120vw); opacity: 0; }
        }
        .bw-l0 { top:  8%; animation-duration: 28s; animation-delay:  0s;  }
        .bw-l1 { top: 18%; animation-duration: 34s; animation-delay:  4s;  }
        .bw-l2 { top: 28%; animation-duration: 30s; animation-delay:  8s;  }
        .bw-l3 { top: 40%; animation-duration: 36s; animation-delay:  2s;  }
        .bw-l4 { top: 52%; animation-duration: 32s; animation-delay:  6s;  }
        .bw-l5 { top: 64%; animation-duration: 28s; animation-delay: 10s;  }
        .bw-l6 { top: 76%; animation-duration: 34s; animation-delay:  3s;  }
        .bw-l7 { top: 86%; animation-duration: 30s; animation-delay:  7s;  }
        .bw-l8 { top: 94%; animation-duration: 32s; animation-delay:  1s;  }

        @media (prefers-reduced-motion: reduce) {
          .bw-seal-wrap, .bw-line { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
