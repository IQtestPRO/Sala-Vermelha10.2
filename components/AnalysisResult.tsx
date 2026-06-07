"use client";

import { Eye, ListChecks, Stethoscope, AlertTriangle } from "lucide-react";
import { DISCLAIMER_CURTO } from "@/lib/legal/disclaimer";

export type Analysis = {
  condutaImediata?: string;
  resumo?: string;
  achados: string[];
  hipoteses: string[];
  conduta: string[];
  alternativaUPA?: string[];
  alertas: string[];
  gravidade: string;
  fontes?: string[];
  mensagemPlantonista?: string;
  perguntas?: { pergunta: string; opcoes: string[] }[];
};

const GRAV: Record<string, { label: string; cls: string }> = {
  critico: { label: "Crítico", cls: "badge-expired" },
  alto: { label: "Alto", cls: "badge-claimed" },
  moderado: { label: "Moderado", cls: "badge-claimed" },
  baixo: { label: "Baixo", cls: "badge-answered" },
  indeterminado: { label: "Indeterminado", cls: "badge-closed" },
};

function Bloco({ icon, titulo, itens, accent }: { icon: React.ReactNode; titulo: string; itens: string[]; accent?: string }) {
  if (!itens || itens.length === 0) return null;
  return (
    <div className="card-2" style={{ boxShadow: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ color: accent || "var(--navy)" }}>{icon}</span>
        <span style={{ fontWeight: 800, fontSize: 14 }}>{titulo}</span>
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5, fontSize: 14.5, lineHeight: 1.45 }}>
        {itens.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

export default function AnalysisResult({ a }: { a: Analysis }) {
  const grav = GRAV[a.gravidade] || GRAV.indeterminado;
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", borderColor: "var(--navy)" }}>
      <div style={{ background: "var(--navy)", color: "#fff", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, letterSpacing: "0.04em", fontSize: 13 }}>
          <Eye size={18} /> LEITURA DA IA
        </span>
        <span className={`badge ${grav.cls}`}>{grav.label}</span>
      </div>
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        {a.condutaImediata && (
          <div
            className="card-2"
            style={{ boxShadow: "none", border: "1px solid color-mix(in srgb, var(--red) 38%, var(--border))", background: "var(--red-tint)", padding: "11px 13px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <Stethoscope size={15} color="var(--red)" />
              <span style={{ fontWeight: 900, fontSize: 12, letterSpacing: "0.04em", color: "var(--red)" }}>FAZER AGORA</span>
            </div>
            <div style={{ fontSize: 15.5, fontWeight: 700, lineHeight: 1.45 }}>{a.condutaImediata}</div>
          </div>
        )}
        {a.resumo && (
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--text)" }}>{a.resumo}</p>
        )}
        <Bloco icon={<Eye size={16} />} titulo="Achados" itens={a.achados} />
        <Bloco icon={<ListChecks size={16} />} titulo="Hipóteses" itens={a.hipoteses} />
        <Bloco icon={<Stethoscope size={16} />} titulo="Conduta sugerida (padrão-ouro)" itens={a.conduta} accent="var(--primary)" />
        {a.alternativaUPA && a.alternativaUPA.length > 0 && (
          <div
            className="card-2"
            style={{ boxShadow: "none", border: "1px solid color-mix(in srgb, var(--primary) 32%, var(--border))", background: "color-mix(in srgb, var(--primary) 6%, var(--surface))", padding: "11px 13px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontWeight: 900, fontSize: 11, letterSpacing: "0.06em", color: "#fff", background: "var(--primary)", borderRadius: 6, padding: "2px 7px" }}>UPA</span>
              <span style={{ fontWeight: 800, fontSize: 13.5 }}>Alternativa no SUS / UPA</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5, fontSize: 14.5, lineHeight: 1.45 }}>
              {a.alternativaUPA.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}
        <Bloco icon={<AlertTriangle size={16} />} titulo="Alertas" itens={a.alertas} accent="var(--red)" />
        {a.fontes && a.fontes.length > 0 && (
          <div className="faint" style={{ fontSize: 11, lineHeight: 1.5 }}>Fontes: {a.fontes.join(" · ")}</div>
        )}
        <div className="faint" style={{ fontSize: 11, lineHeight: 1.5 }}>{DISCLAIMER_CURTO}</div>
      </div>
    </div>
  );
}
