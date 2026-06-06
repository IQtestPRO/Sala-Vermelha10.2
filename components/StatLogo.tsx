type Tone = "onNavy" | "onLight";

// Wordmark "STAT" + linha de ECG vermelha animada (traçado de monitor).
// Animação por CSS (stroke-dashoffset) — funciona no Safari iOS/Android e no desktop.
// O traçado <path> tem ~250 unidades de comprimento no viewBox (stroke-dasharray fixo),
// sem pathLength (que o Safari ignora) nem non-scaling-stroke.
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
  const ink = tone === "onNavy" ? "oklch(0.99 0.005 255)" : "var(--logo-ink)";
  const sub = tone === "onNavy" ? "oklch(0.84 0.02 255)" : "var(--text-dim)";
  const overhang = size * 0.3;

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
            className={animated ? "ecg-draw" : undefined}
            d="M0 19 H80 L90 19 L98 5 L106 33 L114 11 L122 21 L130 19 H200"
            fill="none"
            stroke="var(--red)"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
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
