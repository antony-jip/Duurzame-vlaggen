"use client";

/**
 * Homepage effects — the boundary-pushing bits that need a whisper of client
 * JS. Everything degrades gracefully: no pointer → ambient drift only, no JS →
 * static specks, reduced motion → global animation kill-switch applies.
 */

import { useEffect, useRef, useState } from "react";

/* Deterministic speck field (no Math.random: SSR and client must match).
   `depth` drives how strongly a speck responds to the pointer-wind. */
const SPECKS = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i * 31) % 68}%`,
  top: `${(i * 37 + 11) % 92}%`,
  size: 3 + ((i * 7) % 6),
  delay: `${-((i * 1.7) % 12)}s`,
  duration: `${9 + ((i * 3) % 8)}s`,
  depth: 14 + ((i * 13) % 42), // px of max wind-shift
}));

/**
 * Drifting microplastic specks that lean with the visitor's pointer, like
 * wind catching debris. The wind value eases towards the pointer position and
 * is written to a CSS variable; each speck multiplies it by its own depth.
 */
export function WindSpecks({
  className,
  speckClassName,
}: {
  className: string;
  speckClassName: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let target = 0;
    let wind = 0;

    const tick = () => {
      wind += (target - wind) * 0.05;
      el.style.setProperty("--wind", wind.toFixed(4));
      if (Math.abs(target - wind) > 0.002) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };
    const onMove = (e: PointerEvent) => {
      target = (e.clientX / window.innerWidth - 0.5) * 2; // -1 … 1
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={className} aria-hidden="true">
      {SPECKS.map((s, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            transform: `translateX(calc(var(--wind, 0) * ${s.depth}px))`,
          }}
        >
          <span
            className={speckClassName}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              animationDelay: s.delay,
              animationDuration: s.duration,
            }}
          />
        </span>
      ))}
    </div>
  );
}

/**
 * Live decay counter: an illustrative estimate of microplastic shed by Dutch
 * polyester company flags since this page was opened. Updates 10×/s — fast
 * enough to feel alive, slow enough to stay cheap.
 */
const MG_PER_SECOND = 2.4; // illustratieve schatting, zie voetnoot in de UI

export function DecayCounter({ className }: { className?: string }) {
  const [mg, setMg] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const interval = setInterval(() => {
      setMg(((performance.now() - start) / 1000) * MG_PER_SECOND);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={className}>
      {mg.toLocaleString("nl-NL", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}{" "}
      mg
    </span>
  );
}

/**
 * SVG displacement filter that makes the hero photo genuinely ripple like
 * cloth. Rendered once, referenced from CSS with `filter: url(#wapper)`.
 * The turbulence frequency breathes via SMIL, so the wave pattern never
 * repeats visibly.
 */
export function WapperFilter() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <filter id="wapper" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.012 0.028"
          numOctaves="2"
          seed="7"
          result="noise"
        >
          <animate
            attributeName="baseFrequency"
            dur="14s"
            keyTimes="0;0.5;1"
            values="0.012 0.028;0.016 0.022;0.012 0.028"
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap
          in="SourceGraphic"
          in2="noise"
          scale="12"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
