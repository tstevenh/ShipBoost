"use client";

import React, { useEffect, useRef } from "react";

export default function MinimalHero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();

    type Particle = {
      x: number;
      y: number;
      speed: number;
      opacity: number;
      fadeDelay: number;
      fadeStart: number;
      fadingOut: boolean;
    };

    let particles: Particle[] = [];
    let raf = 0;

    const count = () => Math.floor((canvas.width * canvas.height) / 7000);

    const make = (): Particle => {
      const fadeDelay = Math.random() * 600 + 100;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() / 5 + 0.1,
        opacity: 0.7,
        fadeDelay,
        fadeStart: Date.now() + fadeDelay,
        fadingOut: false,
      };
    };

    const reset = (p: Particle) => {
      p.x = Math.random() * canvas.width;
      p.y = Math.random() * canvas.height;
      p.speed = Math.random() / 5 + 0.1;
      p.opacity = 0.7;
      p.fadeDelay = Math.random() * 600 + 100;
      p.fadeStart = Date.now() + p.fadeDelay;
      p.fadingOut = false;
    };

    const init = () => {
      particles = [];
      for (let i = 0; i < count(); i++) particles.push(make());
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) reset(p);
        if (!p.fadingOut && Date.now() > p.fadeStart) p.fadingOut = true;
        if (p.fadingOut) {
          p.opacity -= 0.008;
          if (p.opacity <= 0) reset(p);
        }
        // Monochrome particles
        ctx.fillStyle = `rgba(161, 161, 170, ${p.opacity * 0.4})`;
        ctx.fillRect(p.x, p.y, 0.8, Math.random() * 2 + 1);
      });
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      setSize();
      init();
    };

    window.addEventListener("resize", onResize);
    init();
    raf = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="minimal-root bg-background text-foreground">
      <style suppressHydrationWarning>{`
.minimal-root {
  position: relative;
  width: 100%;
  height: 60vh;
  overflow: hidden;
  border-bottom: 1px solid var(--border);
}

/* hero center */
.hero-inner {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
  pointer-events: none;
  z-index: 5;
  padding-top: 8vh;
}
.hero-kicker {
  font-size: 12px;
  letter-spacing: 0.4em;
   
  color: var(--foreground);
  font-weight: 900;
  margin-bottom: 24px;
  opacity: 0.6;
}
.hero-title {
  font-weight: 900;
  font-size: clamp(40px, 10vw, 100px);
  line-height: 0.9;
  margin: 0;
  letter-spacing: -0.06em;
}
.hero-subtitle {
  margin-top: 32px;
  font-size: clamp(16px, 2.5vw, 20px);
  color: var(--muted-foreground);
  max-width: 600px;
  margin-inline: auto;
  font-weight: 500;
  line-height: 1.6;
}

/* accent lines container */
.accent-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* base line visuals */
.hline, .vline {
  position: absolute;
  background: var(--border);
  opacity: .3;
  will-change: transform, opacity;
}

/* horizontal lines */
.hline {
  height: 1px; left: 0; right: 0;
  transform: scaleX(0);
  transform-origin: 50% 50%;
  animation: drawX 800ms cubic-bezier(.22,.61,.36,1) forwards;
}
.hline:nth-child(1){ top: 25%; animation-delay: 150ms; }
.hline:nth-child(2){ top: 50%; animation-delay: 280ms; }
.hline:nth-child(3){ top: 75%; animation-delay: 410ms; }

/* vertical lines */
.vline {
  width: 1px; top: 0; bottom: 0;
  transform: scaleY(0);
  transform-origin: 50% 0%;
  animation: drawY 900ms cubic-bezier(.22,.61,.36,1) forwards;
}
.vline:nth-child(4){ left: 25%; animation-delay: 520ms; }
.vline:nth-child(5){ left: 50%; animation-delay: 640ms; }
.vline:nth-child(6){ left: 75%; animation-delay: 760ms; }

/* keyframes */
 @keyframes drawX {
  0% { transform: scaleX(0); opacity: 0; }
  60% { opacity: .5; }
  100% { transform: scaleX(1); opacity: .3; }
}
 @keyframes drawY {
  0% { transform: scaleY(0); opacity: 0; }
  60% { opacity: .5; }
  100% { transform: scaleY(1); opacity: .3; }
}

/* canvas */
.particleCanvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  mix-blend-mode: multiply;
  opacity: .4;
}

.dark .particleCanvas {
  mix-blend-mode: screen;
  opacity: .6;
}
      `}</style>

      {/* Particles */}
      <canvas ref={canvasRef} className="particleCanvas" />

      {/* Accent Lines */}
      <div className="accent-lines">
        <div className="hline" />
        <div className="hline" />
        <div className="hline" />
        <div className="vline" />
        <div className="vline" />
        <div className="vline" />
      </div>

      {/* Hero */}
      <main className="hero-inner">
        <div>
          <div className="hero-kicker">Launch smarter. Get distributed.</div>
          <h1 className="hero-title">Earn trust.<br/>Gain momentum.</h1>
          <p className="hero-subtitle">
            ShipBoost helps bootstrapped SaaS founders earn trust, visibility, and real distribution — not vanity launches.
          </p>
        </div>
      </main>
    </section>
  );
}
