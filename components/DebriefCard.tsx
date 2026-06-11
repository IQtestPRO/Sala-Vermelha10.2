"use client";

import { useState } from "react";
import { ChevronDown, GraduationCap } from "lucide-react";
import EcgLine from "@/components/EcgLine";

type Debrief = {
  resumo: string;
  conduta_executada: string;
  referencia_diretriz: string;
  pontos_fortes: string[];
  pontos_de_melhoria: string[];
  aderencia: "alta" | "parcial" | "baixa";
};

const ADER: Record<string, { label: string; cls: string }> = {
  alta: { label: "Aderência alta", cls: "badge-answered" },
  parcial: { label: "Aderência parcial", cls: "badge-claimed" },
  baixa: { label: "Aderência baixa", cls: "badge-expired" },
};

/* Debrief educativo do caso encerrado: colapsado por padrão; gera lazy se o
   disparo em segundo plano (no encerrar) não tiver completado. Tom: apoio entre
   profissionais — nunca fiscalização. */
export default function DebriefCard({ caseId }: { caseId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debrief, setDebrief] = useState<Debrief | null>(null);
  const [erro, setErro] = useState(false);

  async function carregar() {
    setLoading(true);
    setErro(false);
    try {
      let r = await fetch(`/api/cases/${caseId}/debrief`);
      if (r.status === 404) {
        r = await fetch(`/api/cases/${caseId}/debrief`, { method: "POST" });
      }
      if (!r.ok) {
        setErro(true);
        return;
      }
      const d = await r.json();
      setDebrief(d.debrief as Debrief);
    } catch {
      setErro(true);
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !debrief && !loading) carregar();
  }

  const ad = debrief ? ADER[debrief.aderencia] ?? ADER.parcial : null;

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <button className="list-row" onClick={toggle} style={{ width: "100%", padding: "13px 14px", borderBottom: open ? "1px solid var(--border)" : "none" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, minWidth: 0, textAlign: "left" }}>
          <GraduationCap size={17} color="var(--primary)" style={{ flex: "0 0 auto" }} />
          <span style={{ fontWeight: 800, fontSize: 14.5 }}>Debrief do caso</span>
          {ad && <span className={`badge ${ad.cls}`}>{ad.label}</span>}
        </span>
        <ChevronDown size={18} className="faint" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s", flex: "0 0 auto" }} />
      </button>

      {open && (
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center", padding: "10px 0" }}>
              <EcgLine variant="run" height={20} stroke={1.8} opacity={0.9} style={{ width: 150 }} />
              <span className="muted" style={{ fontSize: 12.5 }}>Gerando o debrief…</span>
            </div>
          ) : erro ? (
            <div className="faint" style={{ fontSize: 13, textAlign: "center", padding: "6px 0" }}>
              Não consegui gerar agora.{" "}
              <button onClick={carregar} style={{ background: "none", border: "none", color: "var(--primary-press)", fontWeight: 700, cursor: "pointer" }}>Tentar de novo</button>
            </div>
          ) : debrief ? (
            <>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55 }}>{debrief.resumo}</p>

              <div>
                <div className="microlabel" style={{ marginBottom: 4 }}>Conduta executada</div>
                <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "var(--text-dim)" }}>{debrief.conduta_executada}</p>
              </div>

              {debrief.pontos_fortes?.length > 0 && (
                <div>
                  <div className="microlabel" style={{ marginBottom: 4, color: "var(--green)" }}>Pontos fortes</div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4, fontSize: 13.5, lineHeight: 1.5 }}>
                    {debrief.pontos_fortes.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {debrief.pontos_de_melhoria?.length > 0 && (
                <div>
                  <div className="microlabel" style={{ marginBottom: 4 }}>Oportunidades de melhoria</div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4, fontSize: 13.5, lineHeight: 1.5 }}>
                    {debrief.pontos_de_melhoria.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="faint" style={{ fontSize: 11.5, lineHeight: 1.45 }}>
                Referência: {debrief.referencia_diretriz}. Debrief educativo entre profissionais — avalia o registro documentado, não substitui revisão por pares.
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
