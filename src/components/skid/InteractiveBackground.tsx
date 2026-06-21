import { useEffect, useRef } from "react";

/**
 * Interactive canvas background — floating orbs connected by thin filaments,
 * attracted to the cursor. Wires snap when stretched too far.
 * Fixed full-viewport, behind all content (z-index: -1), pointer-events none.
 */
export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;

    const mouse = { x: -9999, y: -9999, active: false };

    type Orb = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      base: number; // base radius for pulse
      hue: number; // 0..1 mix between crimson and blood
    };

    const ORB_COUNT = Math.round(
      Math.min(70, Math.max(28, (window.innerWidth * window.innerHeight) / 36000)),
    );
    const orbs: Orb[] = [];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      orbs.length = 0;
      for (let i = 0; i < ORB_COUNT; i++) {
        const r = 0.5 + Math.random() * 1.0;
        // Zero-g: small random constant velocity, never decays
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.08 + Math.random() * 0.12;
        orbs.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r,
          base: r,
          hue: Math.random(),
        });
      }
    };

    resize();
    seed();

    const onResize = () => {
      resize();
    };
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    const ATTRACT_RADIUS = 200;
    const ATTRACT_STRENGTH = 0.0035;
    const MAX_SPEED = 0.9;
    const LINK_DIST = 160;

    const draw = () => {
      // Trail wipe (slight smear for filament glow)
      ctx.fillStyle = "rgba(10, 4, 6, 0.55)";
      ctx.fillRect(0, 0, width, height);

      // Update — zero gravity: no friction, no random drift, constant motion
      for (const o of orbs) {
        if (mouse.active) {
          const dx = mouse.x - o.x;
          const dy = mouse.y - o.y;
          const d = Math.hypot(dx, dy) || 0.001;
          if (d < ATTRACT_RADIUS) {
            const force = (1 - d / ATTRACT_RADIUS) * ATTRACT_STRENGTH;
            o.vx += (dx / d) * force;
            o.vy += (dy / d) * force;
          }
        }

        const sp = Math.hypot(o.vx, o.vy);
        if (sp > MAX_SPEED) {
          o.vx = (o.vx / sp) * MAX_SPEED;
          o.vy = (o.vy / sp) * MAX_SPEED;
        }
        o.x += o.vx;
        o.y += o.vy;

        // Wrap edges softly
        if (o.x < -20) o.x = width + 20;
        else if (o.x > width + 20) o.x = -20;
        if (o.y < -20) o.y = height + 20;
        else if (o.y > height + 20) o.y = -20;
      }

      // Filaments — only between orbs currently captured by the cursor
      ctx.lineWidth = 1;
      if (mouse.active) {
        const captured: Orb[] = [];
        for (const o of orbs) {
          if (Math.hypot(mouse.x - o.x, mouse.y - o.y) < ATTRACT_RADIUS) {
            captured.push(o);
          }
        }
        for (let i = 0; i < captured.length; i++) {
          const a = captured[i];
          for (let j = i + 1; j < captured.length; j++) {
            const b = captured[j];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d > LINK_DIST) continue;
            const alpha = (1 - d / LINK_DIST) * 0.3;
            ctx.strokeStyle = `oklch(0.5 0.2 22 / ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Orbs (with glow)
      for (const o of orbs) {
        const glow = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 5);
        const lightness = 0.42 + o.hue * 0.08;
        glow.addColorStop(0, `oklch(${lightness} 0.2 22 / 0.65)`);
        glow.addColorStop(0.4, `oklch(${lightness} 0.2 22 / 0.12)`);
        glow.addColorStop(1, "oklch(0.45 0.18 22 / 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r * 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `oklch(${0.6 + o.hue * 0.06} 0.16 22 / 0.75)`;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-screen w-screen"
    />
  );
}
