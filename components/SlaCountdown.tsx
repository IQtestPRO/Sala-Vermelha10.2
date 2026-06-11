"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { slaPhase, formatCountdown } from "@/lib/sla";
import { SLA_MS } from "@/lib/constants";
import EcgLine from "@/components/EcgLine";

export default function SlaCountdown({
  expiresAt,
  serverNow,
  size = 16,
  showIcon = true,
  trace = false,
}: {
  expiresAt: number;
  serverNow?: number;
  size?: number;
  showIcon?: boolean;
  /** Traçado de ECG que DEGRADA com o tempo: ritmo cheio → espaçado → flatline ao expirar. */
  trace?: boolean;
}) {
  // Corrige desvio do relogio do aparelho usando o tempo do servidor.
  const skew = useMemo(() => (serverNow ? serverNow - Date.now() : 0), [serverNow]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = expiresAt - (now + skew);
  const phase = slaPhase(remaining);
  const label = phase === "expired" ? "EXPIRADO" : formatCountdown(remaining);
  const cls = `sla sla-${phase} data`;
  const style: React.CSSProperties = { fontSize: size, display: "inline-flex", alignItems: "center", gap: 5 };

  const content = (
    <>
      {showIcon && <Clock size={size - 1} />}
      {label}
    </>
  );

  const counter =
    phase === "danger" ? (
      <motion.span className={cls} style={style} animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
        {content}
      </motion.span>
    ) : (
      <span className={cls} style={style}>
        {content}
      </span>
    );

  if (!trace) return counter;

  // densidade do traçado = fração restante do SLA (flatline ao expirar)
  const density = Math.max(0, Math.min(1, remaining / SLA_MS));
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 2, minWidth: 86 }}>
      {counter}
      <EcgLine
        variant="sla"
        density={phase === "expired" ? 0 : density}
        height={14}
        stroke={1.6}
        glow={phase === "danger"}
        color={phase === "expired" ? "var(--text-ghost)" : "var(--red-line)"}
        opacity={phase === "expired" ? 0.8 : 0.9}
        style={{ width: 86 }}
      />
    </span>
  );
}
