"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { slaPhase, formatCountdown } from "@/lib/sla";

export default function SlaCountdown({
  expiresAt,
  serverNow,
  size = 16,
  showIcon = true,
}: {
  expiresAt: number;
  serverNow?: number;
  size?: number;
  showIcon?: boolean;
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
  const cls = `sla sla-${phase}`;
  const style: React.CSSProperties = { fontSize: size, display: "inline-flex", alignItems: "center", gap: 5 };

  const content = (
    <>
      {showIcon && <Clock size={size - 1} />}
      {label}
    </>
  );

  if (phase === "danger") {
    return (
      <motion.span className={cls} style={style} animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
        {content}
      </motion.span>
    );
  }
  return (
    <span className={cls} style={style}>
      {content}
    </span>
  );
}
