"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Zap, Search, ChevronRight, HeartCrack, HeartPulse, Heart, Wind, Brain, Droplet, FlaskConical, Camera, Sparkles } from "lucide-react";
import TopBar, { LogoutButton } from "@/components/TopBar";
import CondutaDetalhe from "@/components/CondutaDetalhe";
import { searchComAcao, CondutaCard } from "@/lib/condutas";

const ICON: Record<string, React.ReactNode> = {
  "acls-pcr": <HeartCrack size={22} />,
  "bradi-instavel": <HeartPulse size={22} />,
  cardioversao: <Zap size={22} />,
  anafilaxia: <Droplet size={22} />,
  sri: <Wind size={22} />,
  eme: <Brain size={22} />,
  "choque-sepse": <Droplet size={22} />,
  "iam-supra": <Heart size={22} />,
  hipercalemia: <FlaskConical size={22} />,
};

export default function RapidoPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CondutaCard | null>(null);
  const list = useMemo(() => searchComAcao(query), [query]);

  if (selected) {
    return (
      <>
        <TopBar title={selected.titulo} subtitle="Ação imediata" onBack={() => setSelected(null)} />
        <CondutaDetalhe card={selected} />
      </>
    );
  }

  return (
    <>
      <TopBar title="Ação rápida" subtitle="O que fazer agora — sala vermelha" right={<LogoutButton />} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <Link
          href="/analisar"
          className="card"
          style={{ display: "flex", alignItems: "center", gap: 12, borderColor: "var(--navy)", background: "linear-gradient(180deg, var(--navy-tint), var(--surface))" }}
        >
          <div style={{ flex: "0 0 46px", height: 46, borderRadius: 13, background: "var(--navy)", color: "#fff", display: "grid", placeItems: "center" }}>
            <Camera size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", gap: 6 }}>
              Analisar ECG / monitor <Sparkles size={15} color="var(--navy)" />
            </div>
            <div className="faint" style={{ fontSize: 12.5, marginTop: 2 }}>A IA lê a foto e interpreta este paciente</div>
          </div>
          <ChevronRight size={20} className="faint" />
        </Link>

        <div style={{ position: "relative" }}>
          <Search size={18} className="faint" style={{ position: "absolute", left: 14, top: 17 }} />
          <input
            className="field"
            placeholder="Buscar situação (ex.: bradicardia)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: 42 }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {list.map((c) => (
            <button
              key={c.id}
              className="card-2"
              style={{ textAlign: "left", cursor: "pointer", display: "flex", gap: 12, alignItems: "center" }}
              onClick={() => setSelected(c)}
            >
              <div style={{ flex: "0 0 44px", height: 44, borderRadius: 12, background: "var(--navy-tint)", color: "var(--navy)", display: "grid", placeItems: "center" }}>
                {ICON[c.id] ?? <Zap size={22} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{c.titulo}</div>
                <div
                  className="faint"
                  style={{ fontSize: 12.5, marginTop: 2, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                >
                  {c.acaoRapida?.gatilho}
                </div>
              </div>
              <ChevronRight size={20} className="faint" />
            </button>
          ))}
          {list.length === 0 && <div className="muted" style={{ textAlign: "center", padding: 20 }}>Nada encontrado.</div>}
        </div>
      </div>
    </>
  );
}
