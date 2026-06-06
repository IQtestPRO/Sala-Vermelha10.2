"use client";

import { Eye, ListChecks, Stethoscope, AlertTriangle } from "lucide-react";
import { DISCLAIMER_CURTO } from "@/lib/legal/disclaimer";

export type Analysis = {
  achados: string[];
  hipoteses: string[];
  conduta: string[];
  alertas: string[];
  gravidade: string;
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
        <Bloco icon={<Eye size={16} />} titulo="Achados" itens={a.achados} />
        <Bloco icon={<ListChecks size={16} />} titulo="Hipóteses" itens={a.hipoteses} />
        <Bloco icon={<Stethoscope size={16} />} titulo="Conduta sugerida" itens={a.conduta} accent="var(--primary)" />
        <Bloco icon={<AlertTriangle size={16} />} titulo="Alertas" itens={a.alertas} accent="var(--red)" />
        <div className="faint" style={{ fontSize: 11, lineHeight: 1.5 }}>{DISCLAIMER_CURTO}</div>
      </div>
    </div>
  );
}
