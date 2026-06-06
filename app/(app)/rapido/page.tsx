"use client";

import { useMemo, useState } from "react";
import { Zap, Search, ChevronRight, HeartCrack, HeartPulse, Heart, Wind, Brain, Droplet, FlaskConical } from "lucide-react";
import TopBar, { LogoutButton } from "@/components/TopBar";
import CondutaDetalhe from "@/components/CondutaDetalhe";
import ScreenHero from "@/components/ScreenHero";
import { searchComAcao, CondutaCard } from "@/lib/condutas";
import HfIcon from "@/components/icons/HfIcon";

const ICON: Record<string, React.ReactNode> = {
  "acls-pcr": <HfIcon name="pcr" size={24} />,
  "bradi-instavel": <HfIcon name="arritmia" size={24} />,
  cardioversao: <HfIcon name="bolt" size={24} />,
  anafilaxia: <HfIcon name="fluid" size={24} />,
  sri: <HfIcon name="airway" size={24} />,
  eme: <HfIcon name="brain" size={24} />,
  "choque-sepse": <HfIcon name="fluid" size={24} />,
  "iam-supra": <HfIcon name="heart" size={24} />,
  hipercalemia: <HfIcon name="tox" size={24} />,
};

export default function RapidoPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CondutaCard | null>(null);
  const list = useMemo(() => searchComAcao(query), [query]);

  if (selected) {
    return (
      <>
        <ScreenHero bg="/hero-rapida.jpg" title={selected.titulo} subtitle="Ação imediata" onBack={() => setSelected(null)} />
        <CondutaDetalhe card={selected} />
      </>
    );
  }

  return (
    <>
      <TopBar brand title="Ação rápida" subtitle="O que fazer agora — sala vermelha" right={<LogoutButton />} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ position: "relative" }}>
          <Search size={18} className="faint" style={{ position: "absolute", left: 14, top: 16 }} />
          <input
            className="field"
            placeholder="Buscar situação (ex.: bradicardia)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: 42, background: "var(--surface-sunken)", boxShadow: "var(--shadow-inset)" }}
          />
        </div>

        <div className="eyebrow" style={{ margin: "2px 0 -4px" }}>
          {list.length} {list.length === 1 ? "situação" : "situações"}
        </div>

        {list.length === 0 ? (
          <div className="muted" style={{ textAlign: "center", padding: 24 }}>Nada encontrado.</div>
        ) : (
          <div className="card" style={{ padding: "2px 14px" }}>
            {list.map((c) => (
              <button key={c.id} className="list-row" onClick={() => setSelected(c)}>
                <span style={{ flex: "0 0 40px", height: 40, borderRadius: 11, background: "var(--navy-tint)", color: "var(--navy)", display: "grid", placeItems: "center" }}>
                  {ICON[c.id] ?? <HfIcon name="nav-rapida" size={22} />}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontWeight: 800, fontSize: 15.5, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.titulo}
                  </span>
                  <span className="faint" style={{ display: "block", fontSize: 12.5, marginTop: 2, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.acaoRapida?.gatilho}
                  </span>
                </span>
                <ChevronRight size={20} className="faint" style={{ flex: "0 0 auto" }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
