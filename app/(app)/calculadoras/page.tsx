"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, ChevronRight, ChevronLeft, FlaskConical, Baby, Activity, ListChecks, Droplet, AlertTriangle, Gauge } from "lucide-react";
import TopBar, { LogoutButton } from "@/components/TopBar";
import ScoreCalculator from "@/components/ScoreCalculator";
import { SCORES, type ScoreDef } from "@/lib/scores";
import { estimarPeso, valoresPediatricos, clearanceCreatinina, bandaRenal, fmtNum } from "@/lib/pedCalc";
import { DISCLAIMER_CURTO } from "@/lib/legal/disclaimer";
import CalcFormulas from "@/components/CalcFormulas";
import CalcInfusao from "@/components/CalcInfusao";
import CalcGaso from "@/components/CalcGaso";

type Tab = "escores" | "medicacoes" | "formulas" | "gaso" | "pediatria" | "renal";

function num(v: string): number | undefined {
  const x = Number(String(v).replace(",", "."));
  return Number.isFinite(x) && x > 0 ? x : undefined;
}

const TABS: { key: Tab; label: string; icon: React.ReactNode; desc: string; novo?: boolean }[] = [
  { key: "escores", label: "Escores", icon: <ListChecks size={24} />, desc: "NIHSS, qSOFA, Glasgow, Wells, CHA₂DS₂…" },
  { key: "medicacoes", label: "Medicações", icon: <Droplet size={24} />, desc: "Diluição em bomba (BIC) com a SUA concentração", novo: true },
  { key: "formulas", label: "Fórmulas", icon: <FlaskConical size={24} />, desc: "Sódio, heparina, hidantalização, glicêmico" },
  { key: "gaso", label: "Gasometria", icon: <Activity size={24} />, desc: "Interpreta pH, pCO₂ e HCO₃ passo a passo", novo: true },
  { key: "pediatria", label: "Pediatria", icon: <Baby size={24} />, desc: "Doses por idade e peso" },
  { key: "renal", label: "Renal", icon: <Gauge size={24} />, desc: "Clearance de creatinina (Cockcroft-Gault)" },
];

function Disclaimer() {
  return (
    <div className="card-2" style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11.5, color: "var(--text-dim)", padding: "10px 12px", boxShadow: "none" }}>
      <AlertTriangle size={15} color="var(--amber)" style={{ flex: "0 0 auto", marginTop: 1 }} />
      <span>{DISCLAIMER_CURTO}</span>
    </div>
  );
}

// ---------- Escores ----------
function Escores() {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<ScoreDef | null>(null);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? SCORES.filter((s) => (s.nome + " " + s.categoria + " " + (s.descricao || "")).toLowerCase().includes(t)) : SCORES;
  }, [q]);
  const grupos = useMemo(() => {
    const m: Record<string, ScoreDef[]> = {};
    for (const s of list) (m[s.categoria] ??= []).push(s);
    return m;
  }, [list]);

  if (sel) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setSel(null)}>
          <ChevronLeft size={16} /> Escores
        </button>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{sel.nome}</div>
          <div className="faint" style={{ fontSize: 12.5 }}>{sel.categoria}</div>
        </div>
        <ScoreCalculator def={sel} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ position: "relative" }}>
        <Search size={18} className="faint" style={{ position: "absolute", left: 14, top: 16 }} />
        <input className="field" placeholder="Buscar escore (NIHSS, qSOFA, Wells…)" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 42, background: "var(--surface-sunken)", boxShadow: "var(--shadow-inset)" }} />
      </div>
      {Object.keys(grupos).length === 0 ? (
        <div className="muted" style={{ textAlign: "center", padding: 24 }}>Nada encontrado.</div>
      ) : (
        Object.entries(grupos).map(([cat, arr]) => (
          <div key={cat}>
            <div className="eyebrow" style={{ margin: "2px 0 6px" }}>{cat}</div>
            <div className="card" style={{ padding: "2px 14px" }}>
              {arr.map((s) => (
                <button key={s.id} className="list-row" onClick={() => setSel(s)}>
                  <span style={{ flex: "0 0 36px", height: 36, borderRadius: 10, background: "var(--navy-tint)", color: "var(--navy)", display: "grid", placeItems: "center" }}>
                    <ListChecks size={18} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 800, fontSize: 15, color: "var(--text)" }}>{s.nome}</span>
                    <span className="faint" style={{ display: "block", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.itens.length} itens</span>
                  </span>
                  <ChevronRight size={18} className="faint" style={{ flex: "0 0 auto" }} />
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ---------- Pediatria ----------
function Pediatria() {
  const [unidade, setUnidade] = useState<"anos" | "meses">("anos");
  const [idade, setIdade] = useState("");
  const [peso, setPeso] = useState("");

  const raw = num(idade);
  const anos = raw == null ? undefined : unidade === "meses" ? raw / 12 : raw;
  let p = num(peso);
  let estimado = false;
  if (!p && anos != null) {
    p = estimarPeso(anos);
    estimado = true;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label className="label">Idade</label>
        <div className="scroll-x" style={{ marginBottom: 8 }}>
          {(["anos", "meses"] as const).map((u) => (
            <button key={u} className={`chip ${unidade === u ? "chip-on" : ""}`} onClick={() => setUnidade(u)} style={{ flex: "0 0 auto" }}>{u}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input className="field" inputMode="decimal" placeholder={unidade === "anos" ? "ex.: 4" : "ex.: 8"} value={idade} onChange={(e) => setIdade(e.target.value)} style={{ minHeight: 48, paddingRight: 44 }} />
            <span className="faint" style={{ position: "absolute", right: 12, top: 15, fontSize: 12 }}>{unidade}</span>
          </div>
          <div style={{ position: "relative", flex: 1 }}>
            <input className="field" inputMode="decimal" placeholder="peso (opcional)" value={peso} onChange={(e) => setPeso(e.target.value)} style={{ minHeight: 48, paddingRight: 34 }} />
            <span className="faint" style={{ position: "absolute", right: 12, top: 15, fontSize: 12 }}>kg</span>
          </div>
        </div>
        <div className="faint" style={{ fontSize: 11.5, marginTop: 6, lineHeight: 1.4 }}>Sem o peso, estimamos pela idade (APLS). Informe o peso real sempre que possível.</div>
      </div>

      {!p ? (
        <div className="muted" style={{ textAlign: "center", padding: 20 }}>Informe a idade (e o peso, se tiver).</div>
      ) : (
        <>
          <div className="z-sunken" style={{ padding: "11px 13px", borderColor: "var(--primary)" }}>
            <div className="faint" style={{ fontSize: 12, fontWeight: 700 }}>Peso usado nos cálculos</div>
            <div className="data" style={{ fontSize: 19, fontWeight: 800, color: "var(--primary-press)", marginTop: 2 }}>
              {fmtNum(p)} kg {estimado && <span className="faint" style={{ fontSize: 12, fontWeight: 600 }}>(estimado)</span>}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {valoresPediatricos(p, anos).map((v, i) => (
              <div key={i} className="z-sunken" style={{ padding: "10px 12px" }}>
                <div className="faint" style={{ fontSize: 12, fontWeight: 700 }}>{v.titulo}</div>
                <div className="data" style={{ fontSize: 15.5, fontWeight: 700, color: "var(--primary-press)", marginTop: 2 }}>{v.valor}</div>
                {v.nota && <div className="faint" style={{ fontSize: 11, marginTop: 2 }}>{v.nota}</div>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Renal ----------
function Renal() {
  const [idade, setIdade] = useState("");
  const [peso, setPeso] = useState("");
  const [creat, setCreat] = useState("");
  const [sexo, setSexo] = useState<"M" | "F">("M");
  const a = num(idade), p = num(peso), c = num(creat);
  const crcl = a != null && p != null && c != null ? clearanceCreatinina(a, p, c, sexo) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input className="field" inputMode="decimal" placeholder="idade" value={idade} onChange={(e) => setIdade(e.target.value)} style={{ minHeight: 48, paddingRight: 42 }} />
          <span className="faint" style={{ position: "absolute", right: 12, top: 15, fontSize: 12 }}>anos</span>
        </div>
        <div style={{ position: "relative", flex: 1 }}>
          <input className="field" inputMode="decimal" placeholder="peso" value={peso} onChange={(e) => setPeso(e.target.value)} style={{ minHeight: 48, paddingRight: 34 }} />
          <span className="faint" style={{ position: "absolute", right: 12, top: 15, fontSize: 12 }}>kg</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <label className="label">Creatinina</label>
          <input className="field" inputMode="decimal" placeholder="ex.: 1,2" value={creat} onChange={(e) => setCreat(e.target.value)} style={{ minHeight: 48, paddingRight: 48 }} />
          <span className="faint" style={{ position: "absolute", right: 12, top: 38, fontSize: 11 }}>mg/dL</span>
        </div>
        <div style={{ flex: 1 }}>
          <label className="label">Sexo</label>
          <div className="scroll-x">
            {(["M", "F"] as const).map((s) => (
              <button key={s} className={`chip ${sexo === s ? "chip-on" : ""}`} onClick={() => setSexo(s)} style={{ flex: "0 0 auto" }}>{s === "M" ? "Masculino" : "Feminino"}</button>
            ))}
          </div>
        </div>
      </div>
      {crcl == null ? (
        <div className="muted" style={{ textAlign: "center", padding: 20 }}>Informe idade, peso e creatinina.</div>
      ) : (
        <div className="z-sunken" style={{ padding: "13px 14px", borderColor: "var(--primary)" }}>
          <div className="faint" style={{ fontSize: 12, fontWeight: 700 }}>Clearance de creatinina (Cockcroft-Gault)</div>
          <div className="data" style={{ fontSize: 24, fontWeight: 800, color: "var(--primary-press)", marginTop: 2 }}>{fmtNum(crcl, 0)} mL/min</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: bandaRenal(crcl).cor }}>{bandaRenal(crcl).txt}</div>
        </div>
      )}
    </div>
  );
}

export default function CalculadorasPage() {
  const [tab, setTab] = useState<Tab | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  useEffect(() => {
    try {
      setSeen(JSON.parse(localStorage.getItem("stat_calc_seen") || "[]"));
    } catch {
      /* noop */
    }
  }, []);
  function abrir(k: Tab) {
    setTab(k);
    const t = TABS.find((x) => x.key === k);
    if (t?.novo && !seen.includes(k)) {
      const ns = [...seen, k];
      setSeen(ns);
      try {
        localStorage.setItem("stat_calc_seen", JSON.stringify(ns));
      } catch {
        /* noop */
      }
    }
  }
  const atual = TABS.find((t) => t.key === tab);

  return (
    <>
      <TopBar brand title="Calculadoras" subtitle={atual ? atual.label : "Toque na calculadora que precisa"} right={<LogoutButton />} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, paddingBottom: 96 }}>
        {!tab ? (
          <>
            <Disclaimer />
            {/* Grade: todas as seções já visíveis (sem scroll lateral) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
              {TABS.map((t) => {
                const novo = t.novo && !seen.includes(t.key);
                return (
                  <button key={t.key} onClick={() => abrir(t.key)} className="card" style={{ position: "relative", textAlign: "left", display: "flex", flexDirection: "column", gap: 8, padding: "14px 14px 13px", cursor: "pointer", minHeight: 118 }}>
                    {novo && <span style={{ position: "absolute", top: 10, right: 10, fontSize: 9, fontWeight: 800, background: "var(--primary)", color: "#fff", borderRadius: 999, padding: "2px 6px", letterSpacing: "0.03em" }}>NOVO</span>}
                    <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--navy-tint)", color: "var(--navy)", display: "grid", placeItems: "center" }}>{t.icon}</span>
                    <span style={{ fontWeight: 800, fontSize: 15.5 }}>{t.label}</span>
                    <span className="faint" style={{ fontSize: 12, lineHeight: 1.35 }}>{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => setTab(null)} style={{ alignSelf: "flex-start" }}><ChevronLeft size={16} /> Calculadoras</button>
            <Disclaimer />
            {tab === "escores" && <Escores />}
            {tab === "medicacoes" && <CalcInfusao />}
            {tab === "formulas" && <CalcFormulas />}
            {tab === "gaso" && <CalcGaso />}
            {tab === "pediatria" && <Pediatria />}
            {tab === "renal" && <Renal />}
          </>
        )}
      </div>
    </>
  );
}
