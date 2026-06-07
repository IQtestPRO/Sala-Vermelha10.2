"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, ChevronRight, AlertTriangle } from "lucide-react";
import TopBar, { LogoutButton } from "@/components/TopBar";
import CondutaDetalhe, { categoriaLabel } from "@/components/CondutaDetalhe";
import ScreenHero from "@/components/ScreenHero";
import { CondutaCard, condutaById, searchCondutas } from "@/lib/condutas";
import { DISCLAIMER_CURTO } from "@/lib/legal/disclaimer";
import HfIcon from "@/components/icons/HfIcon";

// Lista enxuta de protocolos (os demais ficam no código; readicionar depois). RCP abre o Modo PCR.
const PROTOCOLOS_VISIVEIS = ["acls-pcr", "choque-sepse", "dor-toracica", "avc"];

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
  const router = useRouter();
  const initial = params.get("c");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CondutaCard | null>(initial ? condutaById(initial) ?? null : null);

  const list = useMemo(() => {
    const base = searchCondutas(query).filter((c) => PROTOCOLOS_VISIVEIS.includes(c.id));
    return PROTOCOLOS_VISIVEIS.map((id) => base.find((c) => c.id === id)).filter(Boolean) as CondutaCard[];
  }, [query]);

  if (selected) {
    return (
      <>
        <ScreenHero bg="/hero-condutas.jpg" title={selected.titulo} subtitle={categoriaLabel(selected) ?? undefined} onBack={() => setSelected(null)} />
        <CondutaDetalhe card={selected} />
      </>
    );
  }

  return (
    <>
      <TopBar brand title="Protocolos" subtitle="Sala vermelha • referência rápida" right={<LogoutButton />} />
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

        <div className="eyebrow" style={{ margin: "2px 0 -4px" }}>
          {list.length} {list.length === 1 ? "protocolo" : "protocolos"}
        </div>

        {list.length === 0 ? (
          <div className="muted" style={{ textAlign: "center", padding: 24 }}>Nada encontrado.</div>
        ) : (
          <div className="card" style={{ padding: "2px 14px" }}>
            {list.map((c) => {
              const isRcp = c.id === "acls-pcr";
              return (
                <button key={c.id} className="list-row" onClick={() => (isRcp ? router.push("/protocolos/rcp") : setSelected(c))}>
                  <span
                    style={{
                      width: 36, height: 36, borderRadius: 10, flex: "0 0 auto",
                      display: "grid", placeItems: "center",
                      background: isRcp ? "var(--red-tint)" : "var(--navy-tint)",
                      color: isRcp ? "var(--red)" : "var(--navy)",
                    }}
                  >
                    {isRcp ? <HfIcon name="nav-rapida" size={20} /> : <HfIcon name="ecg" size={20} />}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 800, fontSize: 15, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {isRcp ? "RCP / ACLS — Modo PCR interativo" : c.titulo}
                    </span>
                    <span style={{ display: "block", fontSize: 12.5, color: "var(--text-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                      {isRcp ? "Cronômetro de ciclo, adrenalina e metrônomo" : c.resumo}
                    </span>
                  </span>
                  <ChevronRight size={18} className="faint" style={{ flex: "0 0 auto" }} />
                </button>
              );
            })}
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
