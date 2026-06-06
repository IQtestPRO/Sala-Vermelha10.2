"use client";

import { ChevronLeft } from "lucide-react";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

// Cabecalho cinematografico: banner Higgsfield (navy/ECG) + scrim + titulo com
// efeito Aceternity (text-generate). Substitui o TopBar de texto plano.
export default function ScreenHero({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <header className="screen-hero">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/stat-hero.jpg" alt="" className="screen-hero-bg" />
      <div className="screen-hero-top">
        {onBack ? (
          <button className="hero-btn" onClick={onBack} aria-label="Voltar">
            <ChevronLeft size={22} />
          </button>
        ) : (
          <span aria-hidden />
        )}
        <div className="screen-hero-actions">{right}</div>
      </div>
      <div className="screen-hero-text">
        <TextGenerateEffect key={title} words={title} duration={0.5} className="screen-hero-title" />
        {subtitle && <p className="screen-hero-sub">{subtitle}</p>}
      </div>
    </header>
  );
}
