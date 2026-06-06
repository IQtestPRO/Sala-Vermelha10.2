type Tone = "onNavy" | "onLight";

// Wordmark "STAT" + linha de ECG vermelha cruzando (do logo da marca).
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
  const lineW = Math.max(2, size * 0.075);
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
          viewBox="0 0 120 40"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "57%",
            left: `${-overhang}px`,
            width: `calc(100% + ${overhang * 2}px)`,
            height: size * 0.62,
            transform: "translateY(-50%)",
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          <polyline
            className={animated ? "ecg-line" : ""}
            pathLength={100}
            points="0,20 46,20 53,20 59,9 64,31 69,12 74,22 81,20 120,20"
            fill="none"
            stroke="var(--red)"
            strokeWidth={lineW}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
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
