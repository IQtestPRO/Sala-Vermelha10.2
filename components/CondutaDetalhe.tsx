"use client";

import { useState } from "react";
import { AlertTriangle, Copy, Calculator, Zap, Droplet, Lock } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIAS, CondutaCard } from "@/lib/condutas";
import { UPA } from "@/lib/upa";
import { calcDose, calcInfusao } from "@/lib/doseCalculator";
import { DISCLAIMER_CURTO } from "@/lib/legal/disclaimer";
import AcaoRapidaCard from "./AcaoRapidaCard";
import ImageAnalyzer from "./ImageAnalyzer";
import UpaSection from "./UpaSection";

const ulStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: "flex",
  flexDirection: "column",
  gap: 5,
  fontSize: 14.5,
  lineHeight: 1.45,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label">{title}</div>
      {children}
    </div>
  );
}

export function categoriaLabel(card: CondutaCard) {
  return CATEGORIAS.find((c) => c.key === card.categoria)?.label;
}

export default function CondutaDetalhe({ card }: { card: CondutaCard }) {
  const [peso, setPeso] = useState<number | undefined>(undefined);
  const temCalculo = card.doses.some((d) => d.mgPorKg || d.infusao);
  const upa = card.upa ?? UPA[card.id];

  function copiar() {
    const linhas: string[] = [card.titulo, ""];
    if (card.acaoRapida) {
      linhas.push("AÇÃO IMEDIATA:");
      card.acaoRapida.passos.forEach((p) =>
        linhas.push(`• ${p.acao}${p.ampola ? " — " + p.ampola : ""}${p.repetir ? " (" + p.repetir + ")" : ""}`)
      );
      if (card.acaoRapida.seRefratario) linhas.push(`Se não resolver: ${card.acaoRapida.seRefratario}`);
      linhas.push("");
    }
    linhas.push("Indicações:");
    card.indicacoes.forEach((i) => linhas.push("• " + i));
    linhas.push("", "Passos:");
    card.passos.forEach((p) => linhas.push(p));
    if (card.doses.length) {
      linhas.push("", "Doses:");
      card.doses.forEach((d) => linhas.push(`• ${d.farmaco}: ${d.dose}${d.via ? " " + d.via : ""}`));
    }
    navigator.clipboard?.writeText(linhas.join("\n")).then(
      () => toast.success("Conduta copiada."),
      () => toast.error("Não consegui copiar.")
    );
  }

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16, paddingBottom: 28 }}>
      {/* Análise por IA — especialista nesta situação */}
      <ImageAnalyzer condutaId={card.id} area={card.titulo} />

      {card.acaoRapida && <AcaoRapidaCard acao={card.acaoRapida} />}

      <div className="card-2" style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11.5, color: "var(--text-dim)", padding: "10px 12px", boxShadow: "none" }}>
        <AlertTriangle size={15} color="var(--amber)" style={{ flex: "0 0 auto", marginTop: 1 }} />
        <span>{DISCLAIMER_CURTO}</span>
      </div>

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
            <div key={k} style={{ fontSize: 14.5, lineHeight: 1.5 }}>{p}</div>
          ))}
        </div>
      </Section>

      {card.energia && card.energia.length > 0 && (
        <Section title="Energia">
          <div className="z-sunken" style={{ display: "flex", flexDirection: "column", gap: 9, padding: "12px 14px" }}>
            {card.energia.map((e, k) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <Zap size={15} color="var(--red)" style={{ flex: "0 0 auto" }} />
                <span className="data" style={{ fontSize: 15 }}>{e}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {card.doses.length > 0 && (
        <Section title="Doses">
          {temCalculo && (
            <div className="card-2" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, boxShadow: "none" }}>
              <Calculator size={18} color="var(--primary)" />
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
              <span className="faint" style={{ fontSize: 12 }}>Libera as doses</span>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {card.doses.map((d, k) => {
              const calc = peso ? calcDose(d, peso) : null;
              const inf = d.infusao ? calcInfusao(d.infusao, peso) : null;
              return (
                <div
                  key={k}
                  className="z-sunken"
                  style={{ padding: "12px 14px", cursor: "pointer" }}
                  title="Tocar para copiar"
                  onClick={() => {
                    const txt = `${d.farmaco}: ${d.dose}${d.via ? " " + d.via : ""}${calc ? ` (${peso} kg → ${calc.label})` : ""}`;
                    navigator.clipboard?.writeText(txt).then(
                      () => {
                        toast.success("Dose copiada.");
                        if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(12);
                      },
                      () => toast.error("Não consegui copiar.")
                    );
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                    <span style={{ fontWeight: 800 }}>{d.farmaco}</span>
                    <span className="data" style={{ fontSize: 13.5, color: "var(--text-dim)" }}>
                      {d.dose}
                      {d.via ? ` · ${d.via}` : ""}
                    </span>
                  </div>
                  {calc && (
                    <div className="data" style={{ marginTop: 7, color: "var(--primary-press)", fontWeight: 700, fontSize: 17 }}>
                      {peso} kg → {calc.label}
                    </div>
                  )}
                  {d.obs && <div className="faint" style={{ fontSize: 12.5, marginTop: 6, lineHeight: 1.4 }}>{d.obs}</div>}
                  {peso && !d.mgPorKg && !d.infusao && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, fontSize: 11.5, color: "var(--text-faint)" }}>
                      <Lock size={12} /> Dose fixa — não varia com o peso
                    </div>
                  )}
                  {d.infusao && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        const linhas = [
                          d.farmaco,
                          `${d.infusao!.diluicao} = ${d.infusao!.concentracao}`,
                          d.infusao!.inicio ? `Início: ${d.infusao!.inicio}` : "",
                          inf ? `${inf.faixaLabel} → ${inf.mlh}` : "",
                        ].filter(Boolean);
                        navigator.clipboard?.writeText(linhas.join("\n")).then(
                          () => {
                            toast.success("Diluição copiada.");
                            if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(12);
                          },
                          () => toast.error("Não consegui copiar.")
                        );
                      }}
                      style={{
                        marginTop: 9,
                        padding: "10px 12px",
                        borderRadius: 12,
                        background: "color-mix(in srgb, var(--primary) 7%, var(--surface))",
                        border: "1px solid color-mix(in srgb, var(--primary) 22%, var(--border))",
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800, fontSize: 11, letterSpacing: "0.05em", color: "var(--primary-press)", textTransform: "uppercase" }}>
                        <Droplet size={13} /> Diluição & bomba (BIC)
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.45 }}>
                        {d.infusao.diluicao} <b>= {d.infusao.concentracao}</b>
                      </div>
                      {d.infusao.inicio && <div className="faint" style={{ fontSize: 12 }}>Início: {d.infusao.inicio}</div>}
                      {d.infusao.titulacao && <div className="faint" style={{ fontSize: 12 }}>Titulação: {d.infusao.titulacao}</div>}
                      {d.infusao.gatilho && <div className="faint" style={{ fontSize: 12 }}>Quando: {d.infusao.gatilho}</div>}
                      {inf ? (
                        <div className="data" style={{ marginTop: 3, color: "var(--red)", fontWeight: 800, fontSize: 15.5 }}>
                          {inf.faixaLabel} → {inf.mlh}
                        </div>
                      ) : (
                        <div className="faint" style={{ fontSize: 11.5 }}>Informe o peso acima para ver os mL/h.</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {upa && upa.length > 0 && <UpaSection items={upa} />}

      <Section title="Alertas">
        <div className="card" style={{ borderColor: "color-mix(in srgb, var(--red) 30%, var(--border))", display: "flex", flexDirection: "column", gap: 7 }}>
          {card.alertas.map((a, k) => (
            <div key={k} style={{ fontSize: 14, lineHeight: 1.45, display: "flex", gap: 7 }}>
              <AlertTriangle size={15} color="var(--red)" style={{ flex: "0 0 auto", marginTop: 2 }} />
              <span>{a}</span>
            </div>
          ))}
        </div>
      </Section>

      <div className="faint" style={{ fontSize: 11.5, lineHeight: 1.5 }}>Referência: {card.referencia}</div>
    </div>
  );
}
