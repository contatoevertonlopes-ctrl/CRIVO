import { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  size: number;
  isEmerald: boolean;
}

interface Props {
  onComplete: () => void;
}

// Timing constants (ms)
const DRIFT_END    = 440;
const SPRING_END   = 1720;
const FADE_START   = 1880;
const RING_START   = 1840;
const RING_END     = 2340;
const DONE_AT      = 2560;

export function SplashScreen({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [opacity, setOpacity] = useState(1);

  // Schedule fade-out + completion
  useEffect(() => {
    const fadeTimer  = setTimeout(() => setOpacity(0), FADE_START);
    const doneTimer  = setTimeout(() => onComplete(),  DONE_AT);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onComplete]);

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId   = 0;
    let running  = true;
    let startTs: number | null = null;

    const mobile = window.innerWidth < 768;
    const dpr    = Math.min(window.devicePixelRatio || 1, 2);
    const VW     = window.innerWidth;
    const VH     = window.innerHeight;

    canvas.width  = VW * dpr;
    canvas.height = VH * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    // ── Sample CRIVO text into particle targets ──────────────────────────────
    const fontSize = Math.min(VW * (mobile ? 0.22 : 0.17), mobile ? 92 : 148);
    const tW  = Math.min(VW - 48, 800);
    const tH  = Math.ceil(fontSize * 1.9);
    const tc  = document.createElement("canvas");
    tc.width  = tW;
    tc.height = tH;
    const tctx = tc.getContext("2d")!;
    tctx.font        = `700 ${fontSize}px "Space Grotesk","Helvetica Neue",Arial,sans-serif`;
    tctx.fillStyle   = "#fff";
    tctx.textAlign   = "center";
    tctx.textBaseline = "middle";
    tctx.fillText("CRIVO", tW / 2, tH / 2);

    const img = tctx.getImageData(0, 0, tW, tH);
    const raw: { x: number; y: number }[] = [];
    const step = mobile ? 5 : 4;
    const ox   = (VW - tW) / 2;
    const oy   = VH / 2 - tH / 2;

    for (let y = 0; y < tH; y += step) {
      for (let x = 0; x < tW; x += step) {
        if (img.data[(y * tW + x) * 4 + 3] > 100) {
          raw.push({ x: x + ox, y: y + oy });
        }
      }
    }

    const maxN    = mobile ? 180 : 340;
    const selected = raw.sort(() => Math.random() - 0.5).slice(0, maxN);

    const parts: Particle[] = selected.map((t) => ({
      x: Math.random() * VW,
      y: Math.random() * VH,
      z: Math.random() * 2 - 1,
      vx: (Math.random() - 0.5) * 4.5,
      vy: (Math.random() - 0.5) * 4.5,
      tx: t.x,
      ty: t.y,
      size: 0.5 + Math.random() * 1.9,
      isEmerald: Math.random() < 0.72,
    }));

    // ── Render loop ───────────────────────────────────────────────────────────
    const render = (ts: number) => {
      if (!running) return;
      if (!startTs) startTs = ts;
      const e = ts - startTs; // elapsed ms

      ctx.clearRect(0, 0, VW, VH);
      ctx.fillStyle = "#050A12";
      ctx.fillRect(0, 0, VW, VH);

      // ── Perspective grid ──
      const gridAlpha =
        Math.min(0.09, e / 2800) *
        (e < 1740 ? 1 : Math.max(0, 1 - (e - 1740) / 280));

      if (gridAlpha > 0.004) {
        ctx.save();
        ctx.strokeStyle = `rgba(46,204,154,${gridAlpha})`;
        ctx.lineWidth   = 0.5;
        const vY = VH * 0.46;
        for (let i = 0; i <= 10; i++) {
          const t   = i / 10;
          const y2  = vY + (VH - vY) * Math.pow(t, 1.35);
          const xs  = t * VW * 0.58;
          ctx.beginPath(); ctx.moveTo(VW / 2 - xs, y2); ctx.lineTo(VW / 2 + xs, y2); ctx.stroke();
        }
        for (let i = -8; i <= 8; i++) {
          const sp = i / 8;
          ctx.beginPath(); ctx.moveTo(VW / 2, vY); ctx.lineTo(VW / 2 + sp * VW * 0.58, VH); ctx.stroke();
        }
        ctx.restore();
      }

      // ── Particles ─────────────────────────────────────────────────────────
      for (const p of parts) {
        const depth = (p.z + 1) / 2;

        // Physics
        if (e < DRIFT_END) {
          // Phase 0 — brownian drift
          p.vx += (Math.random() - 0.5) * 0.2;
          p.vy += (Math.random() - 0.5) * 0.2;
          p.vx *= 0.963;
          p.vy *= 0.963;
          p.x  += p.vx;
          p.y  += p.vy;
          if (p.x < 0) p.x = VW; else if (p.x > VW) p.x = 0;
          if (p.y < 0) p.y = VH; else if (p.y > VH) p.y = 0;
        } else if (e < SPRING_END) {
          // Phase 1 — spring to letter targets
          const prog = Math.min(1, (e - DRIFT_END) / 920);
          const k    = 0.038 + prog * 0.068;
          p.vx += (p.tx - p.x) * k;
          p.vy += (p.ty - p.y) * k;
          p.vx *= 0.762;
          p.vy *= 0.762;
          p.x  += p.vx;
          p.y  += p.vy;
        } else {
          // Phase 2 — implode to center
          p.vx += (VW / 2 - p.x) * 0.19;
          p.vy += (VH / 2 - p.y) * 0.19;
          p.vx *= 0.81;
          p.vy *= 0.81;
          p.x  += p.vx;
          p.y  += p.vy;
        }

        // Alpha
        let alpha = (0.32 + depth * 0.58) * Math.min(1, e / 160);
        if (e > SPRING_END) {
          alpha *= Math.max(0, 1 - (e - SPRING_END) / 340);
        }

        // Size + glow pulse when fully assembled
        let sz = p.size * (0.62 + depth * 0.98);
        if (e > 1180 && e < SPRING_END) {
          const pt    = (e - 1180) / (SPRING_END - 1180);
          const pulse = 0.42 + Math.sin(pt * Math.PI * 3.2) * 0.42;
          sz    *= 1 + pulse * 0.58;
          alpha  = Math.min(1, alpha * (1 + pulse * 0.38));
        }

        if (alpha < 0.01 || sz < 0.08) continue;

        ctx.globalAlpha = alpha;
        ctx.fillStyle   = p.isEmerald ? "#2ECC9A" : "#9BD5F2";
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ── Center emerald glow (assembled) ──
      if (e > 1160 && e < 1900) {
        const gt    = Math.min(1, (e - 1160) / 620);
        const pulse = 0.5 + Math.sin(gt * Math.PI * 4.2) * 0.5;
        const rg    = ctx.createRadialGradient(VW / 2, VH / 2, 0, VW / 2, VH / 2, Math.min(VW, VH) * 0.31);
        rg.addColorStop(0, `rgba(46,204,154,${0.14 * pulse})`);
        rg.addColorStop(1, "rgba(46,204,154,0)");
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, VW, VH);
      }

      // ── Portal ring (gateway opening) ──
      if (e > RING_START && e < RING_END) {
        const rt    = (e - RING_START) / (RING_END - RING_START);
        const maxR  = Math.hypot(VW, VH) * 0.68;
        const r     = rt * maxR;
        const ra    = Math.max(0, 1 - rt);

        // Soft glow halo
        const gg = ctx.createRadialGradient(VW / 2, VH / 2, Math.max(0, r - 55), VW / 2, VH / 2, r + 55);
        gg.addColorStop(0, "rgba(46,204,154,0)");
        gg.addColorStop(0.5, `rgba(46,204,154,${ra * 0.28})`);
        gg.addColorStop(1, "rgba(46,204,154,0)");
        ctx.fillStyle = gg;
        ctx.fillRect(0, 0, VW, VH);

        // Sharp leading edge
        ctx.save();
        ctx.beginPath();
        ctx.arc(VW / 2, VH / 2, Math.max(1, r), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(140,255,215,${ra * 0.88})`;
        ctx.lineWidth   = Math.max(0.5, (1 - rt) * 2.8);
        ctx.stroke();
        ctx.restore();

        // Initial core flash
        if (rt < 0.24) {
          const fa  = (1 - rt / 0.24) * 0.52;
          const fg  = ctx.createRadialGradient(VW / 2, VH / 2, 0, VW / 2, VH / 2, Math.max(1, r * 0.85));
          fg.addColorStop(0, `rgba(215,255,248,${fa})`);
          fg.addColorStop(0.55, `rgba(46,204,154,${fa * 0.38})`);
          fg.addColorStop(1, "rgba(46,204,154,0)");
          ctx.fillStyle = fg;
          ctx.fillRect(0, 0, VW, VH);
        }
      }

      if (e < DONE_AT && running) {
        animId = requestAnimationFrame(render);
      }
    };

    // Wait for Space Grotesk before sampling text pixels
    document.fonts.ready.then(() => {
      if (running) animId = requestAnimationFrame(render);
    });

    return () => {
      running = false;
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        zIndex: 9999,
        background: "#050A12",
        opacity,
        transition: `opacity 0.68s cubic-bezier(0.4,0,0.2,1)`,
        pointerEvents: opacity < 1 ? "none" : "all",
        willChange: "opacity",
      }}
    >
      {/* 3D perspective wrapper — gives the canvas a tilt → flat animation */}
      <div
        style={{
          width: "100%",
          height: "100%",
          perspective: "2400px",
          perspectiveOrigin: "50% 44%",
        }}
      >
        <canvas
          ref={canvasRef}
          className="crivo-splash-canvas"
          style={{ display: "block", width: "100%", height: "100%" }}
        />
      </div>

      {/* CRT scanline texture — premium display feel */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.045) 2px,rgba(0,0,0,0.045) 4px)",
          pointerEvents: "none",
        }}
      />

      {/* CRIVO wordmark beneath particle field */}
      <div
        aria-label="CRIVO"
        style={{
          position: "absolute",
          bottom: "10%",
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: '"Space Grotesk","Helvetica Neue",Arial,sans-serif',
          fontSize: "0.65rem",
          fontWeight: 500,
          letterSpacing: "0.45em",
          color: "rgba(46,204,154,0.35)",
          textTransform: "uppercase",
          pointerEvents: "none",
          animation: "crivo-tagline-emerge 1.4s cubic-bezier(0.16,1,0.3,1) 0.6s both",
        }}
      >
        Clareza Financeira
      </div>
    </div>
  );
}
