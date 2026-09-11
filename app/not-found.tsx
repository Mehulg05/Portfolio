"use client";

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";

/* ─── Shared cursor state ─────────────────────────────────────────────────── */

/** Module-level so both the torch and particle hooks share the same pointer. */
const pointer = { x: -9999, y: -9999 };

/* ─── Torch driver ────────────────────────────────────────────────────────── */

/*
  Same pattern as HeroPortrait. Writes --gx/--gy on the wrapper so the
  hero-torch, sheet-grid-bright and the accent grid all light up in the
  same way. Also feeds the shared `pointer` so the particle canvas reacts
  to the same cursor without a second listener.
*/
function useTorch(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let frame = 0;
    let clientX = 0;
    let clientY = 0;

    const apply = () => {
      frame = 0;
      const bounds = section.getBoundingClientRect();
      const lx = clientX - bounds.left;
      const ly = clientY - bounds.top;
      section.style.setProperty("--gx", `${lx}px`);
      section.style.setProperty("--gy", `${ly}px`);
      pointer.x = lx;
      pointer.y = ly;
    };

    const onMove = (e: PointerEvent) => {
      clientX = e.clientX;
      clientY = e.clientY;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onEnter = () => section.classList.add("is-lit");
    const onLeave = () => {
      section.classList.remove("is-lit");
      pointer.x = -9999;
      pointer.y = -9999;
    };

    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerenter", onEnter);
    section.addEventListener("pointerleave", onLeave);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerenter", onEnter);
      section.removeEventListener("pointerleave", onLeave);
      section.classList.remove("is-lit");
    };
  }, [ref]);
}

/* ─── Floating particles ──────────────────────────────────────────────────── */

/*
  Subtle drifting nodes that connect when close. They brighten near the
  cursor (shared via the `pointer` object above) so the effect feels
  integrated with the torch rather than independent. Uses the portfolio's
  accent blue (#5c8dff = rgb 92,141,255). Respects prefers-reduced-motion.
*/
const PARTICLE_COUNT = 90;

function useParticles(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let dpr = window.devicePixelRatio || 1;

    /* HiDPI — scale the backing store so lines stay crisp on retina displays */
    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      r: number; baseAlpha: number;
      phase: number; speed: number;
    };

    const cw = () => canvas.width / dpr;
    const ch = () => canvas.height / dpr;

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2.0 + 0.8,
      baseAlpha: Math.random() * 0.35 + 0.1,
      phase: Math.random() * Math.PI * 2,
      speed: 0.005 + Math.random() * 0.012,
    }));

    const draw = () => {
      const w = cw();
      const h = ch();
      ctx.clearRect(0, 0, w, h);

      /* ── connection pass (drawn first so dots sit on top) ── */
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const ddx = p.x - q.x;
          const ddy = p.y - q.y;
          const d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < 140) {
            /* connections near the cursor glow brighter */
            const midX = (p.x + q.x) / 2;
            const midY = (p.y + q.y) / 2;
            const mdx = midX - pointer.x;
            const mdy = midY - pointer.y;
            const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
            const mProx = Math.max(0, 1 - mDist / 220);
            const lineAlpha = (1 - d / 140) * (0.1 + mProx * 0.2);

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(92,141,255,${lineAlpha.toFixed(3)})`;
            ctx.lineWidth = 0.6 + mProx * 0.4;
            ctx.stroke();
          }
        }
      }

      /* ── particle pass ── */
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += p.speed;

        // wrap
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        // proximity to cursor
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const prox = Math.max(0, 1 - dist / 220);

        const breathe = Math.sin(p.phase) * 0.25 + 0.75;
        const alpha = Math.min(1, p.baseAlpha * breathe + prox * 0.5);
        const radius = p.r * (1 + prox * 1.6);

        /* soft glow halo when near cursor */
        if (prox > 0.05) {
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 4);
          grd.addColorStop(0, `rgba(92,141,255,${(prox * 0.18).toFixed(3)})`);
          grd.addColorStop(1, "rgba(92,141,255,0)");
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 4, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }

        /* dot */
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(92,141,255,${alpha.toFixed(3)})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [canvasRef]);
}

/* ─── Text scramble ───────────────────────────────────────────────────────── */

function useScramble(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const chars = "▓▒░█▄▀├┤┬┴";
    const original = el.textContent ?? "";
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scramble = () => {
      let frame = 0;
      const interval = setInterval(() => {
        el.textContent = original
          .split("")
          .map((_, i) =>
            i < frame
              ? original[i]
              : chars[Math.floor(Math.random() * chars.length)]
          )
          .join("");
        frame++;
        if (frame > original.length) {
          clearInterval(interval);
          el.textContent = original;
          timer = setTimeout(scramble, 5000 + Math.random() * 3000);
        }
      }, 50);
    };

    timer = setTimeout(scramble, 2500);
    return () => { if (timer) clearTimeout(timer); };
  }, [ref]);
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default function NotFound() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrambleRef = useRef<HTMLSpanElement>(null);

  useTorch(sectionRef);
  useParticles(canvasRef);
  useScramble(scrambleRef);

  return (
    <section
      ref={sectionRef}
      /* hero-section is the class that the existing CSS keys the is-lit toggle on */
      className="hero-section relative flex min-h-screen flex-col items-center justify-center overflow-hidden border-b border-line"
    >
      {/* ── Ambient layers — identical to Hero ── */}
      <div className="sheet-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="sheet-grid-bright" aria-hidden="true" />
      <div className="hero-torch" aria-hidden="true" />

      {/* ── Floating particles — canvas between grid and content ── */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
      />

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-5 text-center sm:px-8">

        {/* Error code index */}
        <p
          className="hero-rise font-mono text-[11px] uppercase tracking-[0.16em] text-ink-faint"
          style={{ "--step": 0 } as CSSProperties}
        >
          Error&nbsp;·&nbsp;<span className="text-redline">404</span>
        </p>

        {/* Giant stroked 404 */}
        <div
          className="hero-rise nf-code-wrap mt-6"
          style={{ "--step": 1 } as CSSProperties}
          aria-label="404"
        >
          <span ref={scrambleRef} className="nf-code font-display select-none" aria-hidden="true">
            404
          </span>
        </div>

        {/* Title block separator — matches tick-frame / section header pattern */}
        <div
          className="hero-rise mt-10 w-full max-w-md"
          style={{ "--step": 2 } as CSSProperties}
        >
          <h1 className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
            Looks like you took a wrong&nbsp;turn.
          </h1>
        </div>

        {/* Supporting text — same treatment as Hero's profile.supporting */}
        <p
          className="hero-rise mt-5 max-w-[42ch] text-base leading-relaxed text-ink-dim sm:text-lg"
          style={{ "--step": 3 } as CSSProperties}
        >
          This page doesn&apos;t exist, but there&apos;s plenty more to explore.
        </p>

        {/* CTA row — same button pair pattern as Hero */}
        <div
          className="hero-rise mt-8 flex flex-wrap items-center justify-center gap-3"
          style={{ "--step": 4 } as CSSProperties}
        >
          <Link
            href="/"
            id="not-found-home-link"
            className="bg-accent px-5 py-2.5 font-mono text-[12px] uppercase tracking-[0.14em] text-ground hover:bg-ink"
          >
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Scoped styles — only the giant 404 number needs custom treatment */}
      <style>{`
        .nf-code-wrap {
          position: relative;
          line-height: 1;
        }
        .nf-code {
          font-size: clamp(7rem, 22vw, 16rem);
          font-weight: 700;
          letter-spacing: -0.04em;
          color: transparent;
          -webkit-text-stroke: 1.5px var(--color-line-bright);
          text-stroke: 1.5px var(--color-line-bright);
        }

        /* The torch activates the bright grid layer — echo the same accent on the 404 */
        .hero-section.is-lit .nf-code {
          -webkit-text-stroke-color: color-mix(in srgb, var(--color-accent) 50%, var(--color-line-bright));
          transition: -webkit-text-stroke-color 0.4s ease;
        }
      `}</style>
    </section>
  );
}
