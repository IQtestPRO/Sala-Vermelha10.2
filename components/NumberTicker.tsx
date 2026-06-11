"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

/* Número que ROLA até o valor (ticker de instrumento) em vez de trocar seco.
   Mono tabular por padrão (dado é dado). Estático em prefers-reduced-motion. */
export default function NumberTicker({
  value,
  format,
  duration = 0.6,
  className = "data",
  style,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (reduced || prev.current === value) {
      prev.current = value;
      setShown(value);
      return;
    }
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.25, 1, 0.5, 1],
      onUpdate: (v) => setShown(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, reduced, duration]);

  const f = format ?? ((n: number) => String(Math.round(n)));
  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {f(shown)}
    </span>
  );
}
