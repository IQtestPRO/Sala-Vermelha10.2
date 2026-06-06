"use client";

import { useEffect, useState } from "react";

// Abertura curta com a marca STAT (logo exata). Some sozinha (~1,1s).
export default function Splash() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGone(true), 1150);
    return () => clearTimeout(t);
  }, []);
  if (gone) return null;
  return (
    <div className="splash" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/stat-logo.png" alt="STAT" style={{ width: "min(72vw, 340px)" }} />
    </div>
  );
}
