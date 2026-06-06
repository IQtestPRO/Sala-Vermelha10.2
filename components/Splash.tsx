"use client";

import { useEffect, useState } from "react";
import StatLogo from "./StatLogo";

// Abertura curta com a marca STAT + linha de ECG. Some sozinha (~1,1s).
export default function Splash() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGone(true), 1150);
    return () => clearTimeout(t);
  }, []);
  if (gone) return null;
  return (
    <div className="splash" aria-hidden="true">
      <StatLogo size={68} tone="onNavy" animated tagline />
    </div>
  );
}
