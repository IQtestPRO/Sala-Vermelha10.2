"use client";

import { useMemo, useState } from "react";
import { Search, ChevronLeft, AlertTriangle, Copy, Calculator } from "lucide-react";
import { toast } from "sonner";
import TopBar, { LogoutButton } from "@/components/TopBar";
import {
  CONDUTAS,
  CATEGORIAS,
  CondutaCard,
  CondutaCategoria,
  searchCondutas,
} from "@/lib/condutas";
import { calcDose } from "@/lib/doseCalculator";
import { DISCLAIMER_CURTO } from "@/lib/legal/disclaimer";

function DisclaimerBar() {
  return (
    <div
      className="card-2"
      style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11.5, color: "var(--text-dim)", padding: "10px 12px" }}
    >
      <AlertTriangle size={15} color="var(--amber)" style={{ flex: "0 0 auto", marginTop: 1 }} />
      <span>{DISCLAIMER_CURTO}</span>
    </div>
  );
}

function Detalhe({ card, onBack }: { card: CondutaCard; onBack: () => void }) {
  const [peso, setPeso] = useState<number | undefined>(undefined);
  const temCalculo = card.doses.some((d) => d.mgPorKg);

  function copiar() {
    const linhas: string[] = [card.titulo, ""];
    linhas.push("Indicações:");
    card.indicacoes.forEach((i) => linhas.push("• " + i));
    linhas.push("", "Passos:");
    card.passos.forEach((p) => linhas.push(p));
    if (card.doses.length) {
      linhas.push("", "Doses:");
      card.doses.forEach((d) => linhas.push(`• ${d.farmaco}: ${d.dose}${d.via ? " " + d.via : ""}`));
    }
    if (card.energia?.length) {
      linhas.push("", "Energia:");
      card.energia.forEach((e) => linhas.push("• " + e));
    }
    navigator.clipboard?.writeText(linhas.join("\n")).then(
      () => toast.success("Conduta copiada."),
      () => toast.error("Não consegui copiar.")
    );
  }

  return (
    <>
      <TopBar title={card.titulo} subtitle={CATEGORIAS.find((c) => c.key === card.categoria)?.label} onBack={onBack} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16, paddingBottom: 28 }}>
        <DisclaimerBar />

        <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }} onClick={copiar}>
          <Copy size={16} /> Copiar conduta
        </button>

        <Section title="Indicações">
          <ul style={ulStyle}>
            {card.indicacoes.map((i, k) => (
              <li key={k}>{i}</li>
            ))}
          </ul>
        </Section>

        {card.contraindicacoes && card.contraindicacoes.length > 0 && (
          <Section title="Contraindicações / não confundir">
            <ul style={ulStyle}>
              {card.contraindicacoes.map((i, k) => (
                <li key={k}>{i}</li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Passos">
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {card.passos.map((p, k) => (
              <div key={k} style={{ fontSize: 14.5, lineHeight: 1.5 }}>
                {p}
              </div>
            ))}
          </div>
        </Section>

        {card.energia && card.energia.length > 0 && (
          <Section title="Energia">
            <div className="card-2" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {card.energia.map((e, k) => (
                <div key={k} style={{ fontSize: 14.5, fontWeight: 600 }}>
                  ⚡ {e}
                </div>
              ))}
            </div>
          </Section>
        )}

        {card.doses.length > 0 && (
          <Section title="Doses">
            {temCalculo && (
              <div className="card-2" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Calculator size={18} color="var(--blue)" />
                <span className="muted" style={{ fontSize: 13 }}>Peso</span>
                <input
                  className="field"
                  inputMode="numeric"
                  placeholder="kg"
                  value={peso ?? ""}
                  onChange={(e) => {
                    const n = e.target.value === "" ? undefined : Number(e.target.value.replace(",", "."));
                    setPeso(Number.isNaN(n as number) ? undefined : n);
                  }}
                  style={{ minHeight: 42, width: 90 }}
                />
                <span className="faint" style={{ fontSize: 12 }}>libera as doses calculadas</span>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {card.doses.map((d, k) => {
                const calc = peso ? calcDose(d, peso) : null;
                return (
                  <div key={k} className="card-2">
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                      <span style={{ fontWeight: 800 }}>{d.farmaco}</span>
                      <span className="muted" style={{ fontSize: 13 }}>
                        {d.dose}
                        {d.via ? ` · ${d.via}` : ""}
                      </span>
                    </div>
                    {calc && (
                      <div style={{ marginTop: 6, color: "var(--blue)", fontWeight: 800, fontSize: 15 }}>
                        {peso} kg → {calc.label}
                      </div>
                    )}
                    {d.obs && (
                      <div className="faint" style={{ fontSize: 12.5, marginTop: 5, lineHeight: 1.4 }}>
                        {d.obs}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {temCalculo && (
              <div className="faint" style={{ fontSize: 11, marginTop: 8 }}>
                Confira a dose calculada antes de administrar.
              </div>
            )}
          </Section>
        )}

        <Section title="Alertas">
          <div className="card" style={{ borderColor: "color-mix(in srgb, var(--red) 35%, var(--border))", display: "flex", flexDirection: "column", gap: 7 }}>
            {card.alertas.map((a, k) => (
              <div key={k} style={{ fontSize: 14, lineHeight: 1.45, display: "flex", gap: 7 }}>
                <AlertTriangle size={15} color="var(--red)" style={{ flex: "0 0 auto", marginTop: 2 }} />
                <span>{a}</span>
              </div>
            ))}
          </div>
        </Section>

        <div className="faint" style={{ fontSize: 11.5, lineHeight: 1.5 }}>
          Referência: {card.referencia}
        </div>
      </div>
    </>
  );
}

const ulStyle: React.CSSProperties = { margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5, fontSize: 14.5, lineHeight: 1.45 };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label">{title}</div>
      {children}
    </div>
  );
}

export default function CondutasPage() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<CondutaCategoria | "ALL">("ALL");
  const [selected, setSelected] = useState<CondutaCard | null>(null);

  const list = useMemo(() => {
    let r = searchCondutas(query);
    if (cat !== "ALL") r = r.filter((c) => c.categoria === cat);
    return r;
  }, [query, cat]);

  if (selected) {
    return <Detalhe card={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <>
      <TopBar title="Condutas" subtitle="Sala vermelha • referência rápida" right={<LogoutButton />} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <DisclaimerBar />

        <div style={{ position: "relative" }}>
          <Search size={18} className="faint" style={{ position: "absolute", left: 14, top: 17 }} />
          <input
            className="field"
            placeholder="Buscar conduta, droga, sintoma…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: 42 }}
          />
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
                <span style={{ fontWeight: 800, fontSize: 15.5 }}>{c.titulo}</span>
                <ChevronLeft size={18} className="faint" style={{ transform: "rotate(180deg)" }} />
              </div>
              {c.resumo && (
                <div className="faint" style={{ fontSize: 13, marginTop: 4, lineHeight: 1.4 }}>
                  {c.resumo}
                </div>
              )}
            </button>
          ))}
          {list.length === 0 && <div className="muted" style={{ textAlign: "center", padding: 20 }}>Nada encontrado.</div>}
        </div>
      </div>
    </>
  );
}
