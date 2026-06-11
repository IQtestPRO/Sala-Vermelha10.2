/* A LINHA VITAL como elemento de sistema (não só logo).
   Variantes:
   - "flat"  → flatline (empty states: "sem atividade")
   - "calm"  → 2 complexos QRS estáticos (divisores/decor discreto)
   - "run"   → traçado varrendo (loaders: a IA está "monitorando")
   - "sla"   → densidade 0..1 (countdown degrada: ritmo → espaçado → flatline)
   Sem hooks (server-safe). Animação 100% CSS (.ecg-run) — respeita prefers-reduced-motion. */

type Variant = "flat" | "calm" | "run" | "sla";

// Complexo QRS: começa e termina na linha de base; 19 unidades de largura.
function qrs(x: number, mid: number, amp: number): string {
  const a = amp;
  return `L${x} ${mid} l3 ${-0.18 * a} l3 ${0.36 * a} l3 ${-a} l4 ${1.55 * a} l3 ${-0.9 * a} l3 ${0.17 * a}`;
}

function buildPath(positions: number[], mid: number, amp: number, w: number): string {
  let d = `M0 ${mid}`;
  for (const x of positions) d += ` H${x} ${qrs(x, mid, amp)}`;
  return d + ` H${w}`;
}

export default function EcgLine({
  variant = "calm",
  density = 1,
  height = 30,
  stroke = 2,
  color = "var(--red-line)",
  opacity = 1,
  glow = false,
  className = "",
  style,
}: {
  variant?: Variant;
  density?: number; // só p/ "sla": 1 ritmo cheio → 0 flatline
  height?: number;
  stroke?: number;
  color?: string;
  opacity?: number;
  glow?: boolean; // brilha levemente no Modo Plantão (dark)
  className?: string;
  style?: React.CSSProperties;
}) {
  const W = 200;
  const mid = 19;
  const amp = 13;

  let positions: number[] = [];
  if (variant === "calm") positions = [58, 136];
  else if (variant === "run") positions = [34, 96, 158];
  else if (variant === "sla") {
    if (density > 0.72) positions = [22, 70, 118, 166];
    else if (density > 0.45) positions = [36, 98, 160];
    else if (density > 0.2) positions = [56, 148];
    else if (density > 0) positions = [100];
  }
  const d = positions.length ? buildPath(positions, mid, amp, W) : `M0 ${mid} H${W}`;

  return (
    <svg
      viewBox={`0 0 ${W} 38`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
      style={{ display: "block", width: "100%", height, overflow: "visible", opacity, ...style }}
    >
      <path
        className={`${variant === "run" ? "ecg-run" : ""} ${glow ? "ecg-glow" : ""}`.trim() || undefined}
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
