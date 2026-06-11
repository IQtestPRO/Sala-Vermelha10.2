"use client";

import { useRef, useState } from "react";
import HfIcon from "@/components/icons/HfIcon";
import EcgIcon from "@/components/icons/EcgIcon";
import { Calculator, CalendarClock } from "lucide-react";

type Slide = { tipo: "logo" | "icon"; icon?: React.ReactNode; tint: string; cor: string; title: string; desc: string };

const SLIDES: Slide[] = [
  {
    tipo: "logo",
    tint: "var(--navy)", /* logo branco precisa do tile navy sólido (nos 2 temas) */
    cor: "var(--navy)",
    title: "Bem-vindo ao STAT",
    desc: "Seu apoio de sala vermelha: protocolos, calculadoras, IA e gestão de plantão — tudo num lugar só. Veja em 30 segundos onde fica cada coisa.",
  },
  {
    tipo: "icon",
    icon: <HfIcon name="nav-condutas" size={40} />,
    tint: "var(--navy-tint)",
    cor: "var(--navy)",
    title: "Protocolos + Modo PCR",
    desc: "Protocolos de emergência objetivos. E o MODO PCR interativo: cronômetro de ciclo, adrenalina e metrônomo que conduzem a parada — toque em RCP / ACLS.",
  },
  {
    tipo: "icon",
    icon: <Calculator size={38} />,
    tint: "var(--navy-tint)",
    cor: "var(--navy)",
    title: "Calculadoras",
    desc: "Escores (NIHSS, qSOFA…), gasometria interpretada passo a passo, a SUA diluição de drogas em bomba, pediatria e função renal.",
  },
  {
    tipo: "icon",
    icon: <EcgIcon size={40} stroke={2.2} />,
    tint: "color-mix(in srgb, var(--red) 12%, var(--surface))",
    cor: "var(--red)",
    title: "STAT IA",
    desc: "Mande a foto do ECG/exame + o caso e discuta com a IA. Devolve a conduta padrão-ouro e a alternativa adaptada à UPA/SUS.",
  },
  {
    tipo: "icon",
    icon: <CalendarClock size={38} />,
    tint: "var(--navy-tint)",
    cor: "var(--navy)",
    title: "Plantão",
    desc: "Organize seus plantões com o financeiro (recebido/a receber) e faça a passagem de plantão compartilhável pelo WhatsApp — o próximo médico continua de onde você parou.",
  },
];

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const swipeX = useRef<number | null>(null);
  const last = i === SLIDES.length - 1;
  const s = SLIDES[i];
  const proximo = () => (last ? onDone() : setI((x) => x + 1));
  const anterior = () => setI((x) => Math.max(0, x - 1));

  return (
    <div
      style={overlay}
      onPointerDown={(e) => (swipeX.current = e.clientX)}
      onPointerUp={(e) => {
        if (swipeX.current == null) return;
        const dx = e.clientX - swipeX.current;
        swipeX.current = null;
        if (Math.abs(dx) > 45) (dx < 0 ? proximo : anterior)();
      }}
    >
      <button onClick={onDone} style={pular}>Pular</button>

      <div style={conteudo}>
        <div style={{ ...tile, background: s.tint, color: s.cor }}>
          {s.tipo === "logo" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/stat-logo.svg" alt="STAT" style={{ height: 40, width: "auto" }} />
          ) : (
            s.icon
          )}
        </div>
        <h2 className="screen-hero-title" style={{ fontSize: 26, margin: "0 0 10px", color: "var(--text)" }}>{s.title}</h2>
        <p style={{ fontSize: 15.5, lineHeight: 1.55, color: "var(--text-dim)", maxWidth: 340, margin: 0 }}>{s.desc}</p>
      </div>

      <div style={rodape}>
        <div style={{ display: "flex", gap: 7, justifyContent: "center", marginBottom: 18 }}>
          {SLIDES.map((_, k) => (
            <span key={k} style={{ width: k === i ? 22 : 7, height: 7, borderRadius: 999, background: k === i ? "var(--primary)" : "var(--border)", transition: "width .2s, background .2s" }} />
          ))}
        </div>
        <button className="btn btn-primary" onClick={proximo} style={{ width: "100%", maxWidth: 380, minHeight: 52, fontSize: 16.5 }}>
          {last ? "Começar a usar" : "Próximo"}
        </button>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 300,
  background: "var(--surface)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px 22px",
  paddingTop: "calc(env(safe-area-inset-top) + 24px)",
  paddingBottom: "calc(env(safe-area-inset-bottom) + 22px)",
  touchAction: "pan-y",
};
const pular: React.CSSProperties = {
  position: "absolute",
  top: "calc(env(safe-area-inset-top) + 14px)",
  right: 18,
  background: "none",
  border: "none",
  color: "var(--text-faint)",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};
const conteudo: React.CSSProperties = { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 18 };
const tile: React.CSSProperties = { width: 96, height: 96, borderRadius: 26, display: "grid", placeItems: "center", marginBottom: 6 };
const rodape: React.CSSProperties = { width: "100%", display: "flex", flexDirection: "column", alignItems: "center" };
