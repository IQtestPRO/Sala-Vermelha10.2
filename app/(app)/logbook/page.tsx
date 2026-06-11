"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookMarked, Printer, Zap, Stethoscope, MessageSquareReply } from "lucide-react";
import TopBar, { LogoutButton } from "@/components/TopBar";
import EmptyState from "@/components/EmptyState";
import { apiGet } from "@/lib/client";

type Entry = { id: string; kind: string; case_id: string | null; titulo: string; meta: string | null; created_at: number };

const KIND_META: Record<string, { label: string; icon: React.ReactNode }> = {
  caso_criado: { label: "Caso criado", icon: <Stethoscope size={14} /> },
  caso_respondido: { label: "Caso respondido", icon: <MessageSquareReply size={14} /> },
  pcr_conduzida: { label: "PCR conduzida", icon: <Zap size={14} /> },
  conduta_consultada_aplicada: { label: "Conduta aplicada", icon: <BookMarked size={14} /> },
};
const MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function mesLabel(ts: number): string {
  const d = new Date(ts);
  return `${MES[d.getMonth()]} ${d.getFullYear()}`;
}
const dd = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function LogbookPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [kind, setKind] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await apiGet<{ entries: Entry[] }>(`/api/logbook${kind ? `?kind=${kind}` : ""}`);
      setEntries(r.entries);
    } catch {
      /* noop */
    } finally {
      setLoaded(true);
    }
  }, [kind]);
  useEffect(() => {
    load();
  }, [load]);

  // Contadores sempre do total (independente do filtro ativo).
  const [tot, setTot] = useState({ casos: 0, respostas: 0, pcrs: 0 });
  useEffect(() => {
    apiGet<{ entries: Entry[] }>("/api/logbook")
      .then((r) =>
        setTot({
          casos: r.entries.filter((e) => e.kind === "caso_criado").length,
          respostas: r.entries.filter((e) => e.kind === "caso_respondido").length,
          pcrs: r.entries.filter((e) => e.kind === "pcr_conduzida").length,
        })
      )
      .catch(() => {});
  }, []);

  const grupos = useMemo(() => {
    const g: { mes: string; itens: Entry[] }[] = [];
    for (const e of entries) {
      const m = mesLabel(e.created_at);
      const last = g[g.length - 1];
      if (last && last.mes === m) last.itens.push(e);
      else g.push({ mes: m, itens: [e] });
    }
    return g;
  }, [entries]);

  const aderenciaDe = (e: Entry): string | null => {
    try {
      const m = e.meta ? JSON.parse(e.meta) : null;
      return m?.aderencia ?? null;
    } catch {
      return null;
    }
  };

  return (
    <>
      <TopBar brand title="Logbook" subtitle="Seu portfólio clínico — preenche sozinho" right={<LogoutButton />} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, paddingBottom: 96 }}>
        {/* Contadores de instrumento */}
        <div style={{ display: "flex", gap: 10 }}>
          {(
            [
              ["Casos", tot.casos],
              ["Respostas", tot.respostas],
              ["PCRs", tot.pcrs],
            ] as const
          ).map(([l, n]) => (
            <div key={l} className="card" style={{ flex: 1, padding: "12px 14px", textAlign: "center" }}>
              <div className="data-xl" style={{ fontSize: 26 }}>{n}</div>
              <div className="label" style={{ margin: "4px 0 0" }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
          <div className="scroll-x" style={{ flex: 1 }}>
            {([["", "Tudo"], ["caso_criado", "Casos"], ["caso_respondido", "Respostas"], ["pcr_conduzida", "PCRs"]] as const).map(([k, l]) => (
              <button key={k} className={`chip ${kind === k ? "chip-on" : ""}`} onClick={() => setKind(k)} style={{ flex: "0 0 auto" }}>
                {l}
              </button>
            ))}
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => window.open("/api/logbook/export", "_blank")}
            style={{ flex: "0 0 auto" }}
          >
            <Printer size={15} /> Exportar PDF
          </button>
        </div>

        {loaded && entries.length === 0 ? (
          <EmptyState title="Nada registrado ainda." subtitle="O logbook preenche sozinho: casos, respostas e PCRs entram aqui automaticamente." />
        ) : (
          grupos.map((g) => (
            <div key={g.mes}>
              <div className="label">{g.mes}</div>
              <div className="card" style={{ padding: "4px 14px" }}>
                {g.itens.map((e) => {
                  const km = KIND_META[e.kind] ?? KIND_META.caso_criado;
                  const ad = aderenciaDe(e);
                  return (
                    <div key={e.id} className="ficha-row" style={{ alignItems: "center", padding: "9px 0" }}>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className="microlabel" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          {km.icon} {km.label}
                          {ad && (
                            <span className={`badge ${ad === "alta" ? "badge-answered" : ad === "parcial" ? "badge-claimed" : "badge-expired"}`} style={{ fontSize: 9.5 }}>
                              aderência {ad}
                            </span>
                          )}
                        </span>
                        <span style={{ display: "block", fontSize: 13.5, lineHeight: 1.4, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {e.titulo}
                        </span>
                      </span>
                      <span className="data" style={{ fontSize: 11.5, color: "var(--text-faint)", flex: "0 0 auto" }}>{dd(e.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        <div className="faint" style={{ fontSize: 11, lineHeight: 1.45 }}>
          Casos pseudonimizados — o logbook não guarda nenhum dado identificável de paciente (LGPD).
        </div>
      </div>
    </>
  );
}
