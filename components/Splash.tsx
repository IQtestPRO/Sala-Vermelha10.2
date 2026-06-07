"use client";

import { useEffect, useState } from "react";
import { LoaderThree } from "@/components/ui/loader";

// Abertura cinematográfica: logo (SVG) + loader-three (raio vermelho). Some sozinha.
export default function Splash() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGone(true), 1700);
    return () => clearTimeout(t);
  }, []);
  if (gone) return null;
  return (
    <div className="splash" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/stat-hero.jpg" alt="" className="splash-bg" />
      <div className="splash-stack">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/stat-logo.svg" alt="STAT" className="splash-logo" />
        <div className="splash-loader">
          <LoaderThree className="h-11 w-11" />
        </div>
      </div>
    </div>
  );
}
