"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, ChevronRight, AlertTriangle, Zap } from "lucide-react";
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
      <TopBar title="Condutas" subtitle="Sala vermelha • referência rápida" right={<LogoutButton />} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <DisclaimerBar />

        <div style={{ position: "relative" }}>
          <Search size={18} className="faint" style={{ position: "absolute", left: 14, top: 17 }} />
          <input className="field" placeholder="Buscar conduta, droga, sintoma…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft: 42 }} />
        </div>

        <div className="scroll-x">
          <button className={`chip ${cat === "ALL" ? "chip-on" : ""}`} onClick={() => setCat("ALL")} style={{ flex: "0 0 auto" }}>
            Todas
          </button>
          {CATEGORIAS.map((c) => (
            <button key={c.key} className={`chip ${cat === c.key ? "chip-on" : ""}`} onClick={() => setCat(c.key)} style={{ flex: "0 0 auto" }}>
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map((c) => (
            <button key={c.id} className="card-2" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => setSelected(c)}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <span style={{ fontWeight: 800, fontSize: 15.5, display: "flex", alignItems: "center", gap: 7 }}>
                  {c.acaoRapida && <Zap size={15} color="var(--navy)" />}
                  {c.titulo}
                </span>
                <ChevronRight size={18} className="faint" />
              </div>
              {c.resumo && <div className="faint" style={{ fontSize: 13, marginTop: 4, lineHeight: 1.4 }}>{c.resumo}</div>}
            </button>
          ))}
          {list.length === 0 && <div className="muted" style={{ textAlign: "center", padding: 20 }}>Nada encontrado.</div>}
        </div>
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
