"use client";

import { useEffect, useRef } from "react";

type Tone = "onNavy" | "onLight";

// Wordmark "STAT" + linha de ECG vermelha animada (traçado de monitor).
// A animação usa Web Animations API + getTotalLength (robusto no Safari iOS/Android),
// em vez de pathLength/non-scaling-stroke (que não animam no Safari).
export default function StatLogo({
  size = 44,
  tone = "onLight",
  animated = true,
  tagline = false,
}: {
  size?: number;
  tone?: Tone;
  animated?: boolean;
  tagline?: boolean;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const ink = tone === "onNavy" ? "oklch(0.99 0.005 255)" : "var(--logo-ink)";
  const sub = tone === "onNavy" ? "oklch(0.84 0.02 255)" : "var(--text-dim)";
  const overhang = size * 0.3;

  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    let len = 0;
    try {
      len = el.getTotalLength();
    } catch {
      len = 320;
    }
    if (!len || !Number.isFinite(len)) len = 320;
    el.style.strokeDasharray = `${len}`;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!animated || reduce) {
      el.style.strokeDashoffset = "0"; // linha completa, estática
      return;
    }

    el.style.strokeDashoffset = `${len}`;
    let anim: Animation | undefined;
    if (typeof el.animate === "function") {
      anim = el.animate(
        [
          { strokeDashoffset: len, offset: 0 }, // escondida
          { strokeDashoffset: 0, offset: 0.55 }, // traça
          { strokeDashoffset: 0, offset: 1 }, // segura
        ],
        { duration: 2200, iterations: Infinity, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
      );
    } else {
      el.style.strokeDashoffset = "0"; // fallback: linha completa
    }
    return () => anim?.cancel();
  }, [animated, size]);

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: Math.round(size * 0.16) }}>
      <span style={{ position: "relative", display: "inline-block", lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "var(--font-archivo), var(--font-mulish), system-ui, sans-serif",
            fontWeight: 800,
            fontSize: size,
            letterSpacing: "-0.045em",
            color: ink,
            lineHeight: 1,
            display: "block",
          }}
        >
          STAT
        </span>
        <svg
          viewBox="0 0 200 38"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "57%",
            left: `${-overhang}px`,
            width: `calc(100% + ${overhang * 2}px)`,
            height: size * 0.6,
            transform: "translateY(-50%)",
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          <path
            ref={pathRef}
            d="M0 19 H80 L90 19 L98 5 L106 33 L114 11 L122 21 L130 19 H200"
            fill="none"
            stroke="var(--red)"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={animated ? { strokeDasharray: 9999, strokeDashoffset: 9999 } : undefined}
          />
        </svg>
      </span>
      {tagline && (
        <span
          style={{
            fontSize: Math.max(9, Math.round(size * 0.15)),
            fontWeight: 700,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: sub,
          }}
        >
          Emergência em 10
        </span>
      )}
    </span>
  );
}
