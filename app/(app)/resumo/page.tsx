"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { toast } from "sonner";
import TopBar, { LogoutButton } from "@/components/TopBar";
import EmptyState from "@/components/EmptyState";
import { apiGet } from "@/lib/client";
import { questionMeta } from "@/lib/types/case";

type Agg = {
  totalCasos: number;
  porTipo: { tipo: string; n: number }[];
  respostas: number;
  tempoMedioSeg: number | null;
  pcrs: number;
  aderenciaPct: number | null;
  recebido: number;
  aReceber: number;
};
type Resumo = { month: string; anterior: string; atual: Agg; prev: Agg };

const MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const mmss = (seg: number) => `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, "0")}`;

function mesLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MES[m - 1]} ${y}`;
}
function navMes(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// ↑↓ discreto vs mês anterior (verde = melhor; p/ tempo de resposta, menor é melhor).
function Delta({ atual, prev, menorMelhor = false }: { atual: number | null; prev: number | null; menorMelhor?: boolean }) {
  if (atual == null || prev == null || atual === prev) return null;
  const subiu = atual > prev;
  const melhor = menorMelhor ? !subiu : subiu;
  return (
    <span style={{ fontSize: 12, fontWeight: 800, color: melhor ? "var(--green)" : "var(--amber)", marginLeft: 6 }}>
      {subiu ? "↑" : "↓"}
    </span>
  );
}

function Metrica({ label, valor, delta }: { label: string; valor: React.ReactNode; delta?: React.ReactNode }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 0, padding: "12px 14px" }}>
      <div className="data-xl" style={{ fontSize: 26, display: "flex", alignItems: "baseline" }}>
        {valor}
        {delta}
      </div>
      <div className="label" style={{ margin: "4px 0 0" }}>{label}</div>
    </div>
  );
}

export default function ResumoPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [r, setR] = useState<Resumo | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      setR(await apiGet<Resumo>(`/api/resumo?month=${month}`));
    } catch {
      /* noop */
    } finally {
      setLoaded(true);
    }
  }, [month]);
  useEffect(() => {
    load();
  }, [load]);

  async function compartilhar() {
    try {
      const res = await fetch(`/api/resumo/card?month=${month}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const file = new File([blob], `stat-resumo-${month}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Meu resumo do plantão — STAT" });
      } else {
        window.open(URL.createObjectURL(blob), "_blank");
      }
    } catch {
      toast.error("Não consegui gerar o card agora.");
    }
  }

  const a = r?.atual;
  const p = r?.prev;
  const vazio = loaded && a && a.totalCasos === 0 && a.respostas === 0 && a.pcrs === 0 && a.recebido === 0 && a.aReceber === 0;

  return (
    <>
      <TopBar brand title="Resumo" subtitle="Seu mês, em números" right={<LogoutButton />} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, paddingBottom: 96 }}>
        {/* Navegação de mês */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button className="chip" onClick={() => setMonth((m) => navMes(m, -1))} aria-label="Mês anterior" style={{ width: 44, minHeight: 44, justifyContent: "center" }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontWeight: 800, fontSize: 15.5, textTransform: "capitalize" }}>{mesLabel(month)}</span>
          <button className="chip" onClick={() => setMonth((m) => navMes(m, 1))} aria-label="Próximo mês" style={{ width: 44, minHeight: 44, justifyContent: "center" }}>
            <ChevronRight size={18} />
          </button>
        </div>

        {vazio ? (
          <EmptyState title="Mês sem registros." subtitle="Casos, PCRs e plantões deste mês aparecem aqui automaticamente." />
        ) : a ? (
          <>
            <div style={{ display: "flex", gap: 10 }}>
              <Metrica label="Casos" valor={a.totalCasos} delta={<Delta atual={a.totalCasos} prev={p?.totalCasos ?? null} />} />
              <Metrica label="Respostas" valor={a.respostas} delta={<Delta atual={a.respostas} prev={p?.respostas ?? null} />} />
              <Metrica label="PCRs" valor={a.pcrs} delta={<Delta atual={a.pcrs} prev={p?.pcrs ?? null} />} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Metrica
                label="Tempo médio de resposta"
                valor={a.tempoMedioSeg != null ? mmss(a.tempoMedioSeg) : "—"}
                delta={<Delta atual={a.tempoMedioSeg} prev={p?.tempoMedioSeg ?? null} menorMelhor />}
              />
              <Metrica
                label="Aderência (debriefs)"
                valor={a.aderenciaPct != null ? `${a.aderenciaPct}%` : "—"}
                delta={<Delta atual={a.aderenciaPct} prev={p?.aderenciaPct ?? null} />}
              />
            </div>

            {a.porTipo.length > 0 && (
              <div>
                <div className="label">Casos por tipo</div>
                <div className="card" style={{ padding: "4px 14px" }}>
                  {a.porTipo.map((t) => (
                    <div key={t.tipo} className="ficha-row">
                      <span className="ficha-key">{questionMeta(t.tipo).short}</span>
                      <span className="ficha-val">{t.n}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="label">Financeiro do plantão</div>
              <div style={{ display: "flex", gap: 10 }}>
                <div className="card" style={{ flex: 1, padding: "12px 14px" }}>
                  <div className="data" style={{ fontSize: 18, fontWeight: 800, color: "var(--green)", display: "flex", alignItems: "baseline" }}>
                    {brl(a.recebido)}
                    <Delta atual={a.recebido} prev={p?.recebido ?? null} />
                  </div>
                  <div className="label" style={{ margin: "4px 0 0" }}>Recebido</div>
                </div>
                <div className="card" style={{ flex: 1, padding: "12px 14px" }}>
                  <div className="data" style={{ fontSize: 18, fontWeight: 800, color: "var(--amber)" }}>{brl(a.aReceber)}</div>
                  <div className="label" style={{ margin: "4px 0 0" }}>A receber</div>
                </div>
              </div>
            </div>

            <button className="btn btn-primary" onClick={compartilhar} style={{ minHeight: 50 }}>
              <Share2 size={18} /> Compartilhar resumo
            </button>
            <div className="faint" style={{ fontSize: 11, lineHeight: 1.45 }}>
              O card compartilhado tem só os seus números agregados — nenhum dado de paciente.
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
