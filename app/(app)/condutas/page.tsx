"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, ChevronRight, AlertTriangle, Zap, Activity } from "lucide-react";
import TopBar, { LogoutButton } from "@/components/TopBar";
import CondutaDetalhe, { categoriaLabel } from "@/components/CondutaDetalhe";
import {
  CONDUTAS,
  CATEGORIAS,
  CondutaCard,
  CondutaCategoria,
  condutaById,
  searchCondutas,
} from "@/lib/condutas";
import { DISCLAIMER_CURTO } from "@/lib/legal/disclaimer";

function DisclaimerBar() {
  return (
    <div className="card-2" style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11.5, color: "var(--text-dim)", padding: "10px 12px", boxShadow: "none" }}>
      <AlertTriangle size={15} color="var(--amber)" style={{ flex: "0 0 auto", marginTop: 1 }} />
      <span>{DISCLAIMER_CURTO}</span>
    </div>
  );
}

function CondutasInner() {
  const params = useSearchParams();
  const initial = params.get("c");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<CondutaCategoria | "ALL">("ALL");
  const [selected, setSelected] = useState<CondutaCard | null>(initial ? condutaById(initial) ?? null : null);

  const list = useMemo(() => {
    let r = searchCondutas(query);
    if (cat !== "ALL") r = r.filter((c) => c.categoria === cat);
    return r;
  }, [query, cat]);

  if (selected) {
    return (
      <>
        <TopBar title={selected.titulo} subtitle={categoriaLabel(selected)} onBack={() => setSelected(null)} />
        <CondutaDetalhe card={selected} />
      </>
    );
  }

  return (
    <>
      <TopBar brand title="Condutas" subtitle="Sala vermelha • referência rápida" right={<LogoutButton />} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <DisclaimerBar />

        <div style={{ position: "relative" }}>
          <Search size={18} className="faint" style={{ position: "absolute", left: 14, top: 16 }} />
          <input
            className="field"
            placeholder="Buscar conduta, droga, sintoma…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: 42, background: "var(--surface-sunken)", boxShadow: "var(--shadow-inset)" }}
          />
        </div>

        <div className="scroll-x" style={{ scrollSnapType: "x proximity" }}>
          <button className={`chip ${cat === "ALL" ? "chip-on" : ""}`} onClick={() => setCat("ALL")} style={{ flex: "0 0 auto", scrollSnapAlign: "start" }}>
            Todas
          </button>
          {CATEGORIAS.map((c) => (
            <button key={c.key} className={`chip ${cat === c.key ? "chip-on" : ""}`} onClick={() => setCat(c.key)} style={{ flex: "0 0 auto", scrollSnapAlign: "start" }}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="eyebrow" style={{ margin: "2px 0 -4px" }}>
          {list.length} {list.length === 1 ? "conduta" : "condutas"}
        </div>

        {list.length === 0 ? (
          <div className="muted" style={{ textAlign: "center", padding: 24 }}>Nada encontrado.</div>
        ) : (
          <div className="card" style={{ padding: "2px 14px" }}>
            {list.map((c) => (
              <button key={c.id} className="list-row" onClick={() => setSelected(c)}>
                <span
                  style={{
                    width: 36, height: 36, borderRadius: 10, flex: "0 0 auto",
                    display: "grid", placeItems: "center",
                    background: c.acaoRapida ? "var(--red-tint)" : "var(--navy-tint)",
                    color: c.acaoRapida ? "var(--red)" : "var(--navy)",
                  }}
                >
                  {c.acaoRapida ? <Zap size={18} /> : <Activity size={18} />}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 800, fontSize: 15, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.titulo}
                  </span>
                  {c.resumo && (
                    <span style={{ display: "block", fontSize: 12.5, color: "var(--text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                      {c.resumo}
                    </span>
                  )}
                </span>
                <ChevronRight size={18} className="faint" style={{ flex: "0 0 auto" }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function CondutasPage() {
  return (
    <Suspense fallback={<div className="app-main" style={{ alignItems: "center", justifyContent: "center" }}><div className="muted">Carregando…</div></div>}>
      <CondutasInner />
    </Suspense>
  );
}
