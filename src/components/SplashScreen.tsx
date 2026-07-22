import { useEffect, useState } from "react";

interface Props {
  onComplete: () => void;
}

// Dot grid coordinates (4×4, 64×64 viewBox)
const COORDS = [14, 26, 38, 50] as const;

// Dots that are "on" in the static CRIVO logo (staircase pattern)
const ON_DOTS: Record<string, true> = {
  "1-3": true,
  "2-2": true, "2-3": true,
  "3-0": true, "3-1": true, "3-2": true, "3-3": true,
};

export function SplashScreen({ onComplete }: Props) {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setOpacity(0), 2500);
    const doneTimer = setTimeout(() => onComplete(), 3100);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  const dots: React.ReactNode[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const i = r * 4 + c;
      const isOn = !!ON_DOTS[`${r}-${c}`];
      // Sóbrio intro: stagger delay by dot index, back-out spring
      const delay = i * 0.08;
      dots.push(
        <circle
          key={i}
          cx={COORDS[c]}
          cy={COORDS[r]}
          r={4.5}
          fill="#2ECC9A"
          style={{
            transformBox: "fill-box" as React.CSSProperties["transformBox"],
            transformOrigin: "center",
            opacity: isOn ? 1 : 0.22,
            animation: `crivo-dot-intro 0.65s cubic-bezier(.34,1.56,.64,1) ${delay}s both`,
          }}
        />
      );
    }
  }

  return (
    <>
      <style>{`
        @keyframes crivo-dot-intro {
          0%   { opacity: 0;    transform: scale(0.12); }
          65%  { opacity: 1;    transform: scale(1.14); }
          100% { opacity: 1;    transform: scale(1);    }
        }
        @keyframes crivo-word-in {
          0%   { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0);    }
        }
        @keyframes crivo-tag-in {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0);    }
        }
        @keyframes crivo-float {
          0%, 100% { transform: translateY(0);   }
          50%       { transform: translateY(-7px); }
        }
        @keyframes crivo-bar-pulse {
          0%, 100% { transform: scaleX(0.7); opacity: 0.45; }
          50%       { transform: scaleX(1.0); opacity: 0.85; }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#1A2E4A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          zIndex: 9999,
          opacity,
          transition: "opacity 0.6s cubic-bezier(0.4,0,0.2,1)",
          pointerEvents: opacity < 1 ? "none" : "all",
          willChange: "opacity",
        }}
      >
        {/* Emerald radial glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 50% 38%, rgba(46,204,154,0.18), transparent 58%)",
            pointerEvents: "none",
          }}
        />

        {/* Floating logo grid */}
        <div
          style={{
            width: 88,
            height: 88,
            animation: "crivo-float 5s ease-in-out 1.5s infinite",
            filter: "drop-shadow(0 0 18px rgba(46,204,154,0.28))",
          }}
        >
          <svg
            viewBox="0 0 64 64"
            width="100%"
            height="100%"
            style={{ display: "block" }}
          >
            <rect x={0} y={0} width={64} height={64} rx={14} fill="#112238" />
            <rect
              x={0.5}
              y={0.5}
              width={63}
              height={63}
              rx={13.5}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={1}
            />
            {dots}
          </svg>
        </div>

        {/* Wordmark + tagline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            position: "relative",
          }}
        >
          <div
            style={{
              fontFamily: '"DM Sans","Helvetica Neue",Arial,sans-serif',
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: 8,
              color: "#fff",
              lineHeight: 1,
              animation: "crivo-word-in 0.55s cubic-bezier(.2,.8,.2,1) 0.9s both",
            }}
          >
            CRIVO
          </div>

          {/* Emerald streak */}
          <div
            style={{
              width: 40,
              height: 1.5,
              borderRadius: 999,
              background: "linear-gradient(to right, #2ECC9A, transparent)",
              animation: "crivo-bar-pulse 2s ease-in-out 1.6s infinite",
            }}
          />

          <div
            style={{
              fontFamily: '"DM Sans","Helvetica Neue",Arial,sans-serif',
              fontWeight: 300,
              fontSize: 11,
              letterSpacing: 4,
              color: "#9CB8D4",
              animation: "crivo-tag-in 0.55s ease 1.1s both",
            }}
          >
            PASSE PELO CRIVO.
          </div>
        </div>

        {/* Bottom loading label */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontFamily: '"DM Mono","ui-monospace",monospace',
            fontSize: 10,
            letterSpacing: 2.5,
            color: "#5C7799",
            textTransform: "uppercase",
            animation: "crivo-tag-in 0.55s ease 1.3s both",
          }}
        >
          Carregando seus dados…
        </div>
      </div>
    </>
  );
}
