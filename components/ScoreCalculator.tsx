"use client";

import { useState } from "react";
import { ScoreDef, faixaDoTotal } from "@/lib/scores";

// Renderiza qualquer escore (ScoreDef): soma ao vivo + interpretação por faixa.
// O resultado GRUDA enquanto rola os itens (stickyTop = offset do cabeçalho).
export default function ScoreCalculator({ def, stickyTop = "calc(env(safe-area-inset-top) + 58px)" }: { def: ScoreDef; stickyTop?: string }) {
  // sel[i] = índice da opção (tipo "opcoes") OU valor numérico (tipo "numero").
  const [sel, setSel] = useState<(number | undefined)[]>(() => def.itens.map(() => undefined));

  const total = def.itens.reduce((acc, it, i) => {
    const v = sel[i];
    if (v == null || Number.isNaN(v)) return acc;
    if (it.tipo === "numero") return acc + v * (it.coef ?? 1);
    const op = it.opcoes?.[v];
    return acc + (op ? op.pontos : 0);
  }, 0);

  const respondidos = sel.filter((v) => v != null && !Number.isNaN(v)).length;
  const completo = respondidos === def.itens.length;
  const faixa = faixaDoTotal(def, total);
  const cor = faixa ? `var(--${faixa.cor})` : "var(--text-dim)";

  const set = (i: number, v: number | undefined) =>
    setSel((s) => {
      const c = [...s];
      c[i] = v;
      return c;
    });

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Resultado ao vivo — GRUDA abaixo do cabeçalho enquanto rola os itens (sempre visível) */}
      <div
        style={{
          position: "sticky",
          top: stickyTop,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 14,
          background: faixa ? `color-mix(in srgb, ${cor} 11%, var(--surface))` : "var(--surface-sunken)",
          border: `1px solid ${faixa ? `color-mix(in srgb, ${cor} 35%, var(--border))` : "var(--border)"}`,
          boxShadow: "0 8px 18px -10px rgba(13, 30, 60, 0.28)",
        }}
      >
        <div>
          <div className="label" style={{ margin: 0 }}>Total</div>
          <div className="data" style={{ fontSize: 28, fontWeight: 800, color: cor, lineHeight: 1.1 }}>{total}</div>
        </div>
        <div style={{ textAlign: "right", maxWidth: "62%" }}>
          {faixa ? (
            <span style={{ fontWeight: 800, fontSize: 14, color: cor }}>{faixa.rotulo}</span>
          ) : (
            <span className="faint" style={{ fontSize: 12.5 }}>{completo ? "Sem faixa definida" : `Responda os ${def.itens.length} itens`}</span>
          )}
          {!completo && <div className="faint" style={{ fontSize: 11, marginTop: 2 }}>{respondidos}/{def.itens.length} respondidos</div>}
        </div>
      </div>

      {def.descricao && <div className="faint" style={{ fontSize: 12.5, lineHeight: 1.45 }}>{def.descricao}</div>}

      {def.itens.map((it, i) => (
        <div key={i}>
          <label className="label" style={{ marginBottom: 6 }}>{it.label}</label>
          {it.tipo === "opcoes" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {it.opcoes!.map((o, k) => {
                const ativo = sel[i] === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => set(i, ativo ? undefined : k)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      width: "100%",
                      textAlign: "left",
                      padding: "11px 14px",
                      borderRadius: 12,
                      border: `1.5px solid ${ativo ? "var(--primary)" : "var(--border)"}`,
                      background: ativo ? "var(--primary-tint)" : "var(--surface)",
                      color: "var(--text)",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.4, whiteSpace: "normal", overflowWrap: "anywhere" }}>{o.label}</span>
                    <span className="data" style={{ flex: "0 0 auto", fontWeight: 800, fontSize: 13, color: ativo ? "var(--primary-press)" : "var(--text-faint)" }}>{o.pontos >= 0 ? `+${o.pontos}` : o.pontos}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ position: "relative", maxWidth: 200 }}>
              <input
                className="field"
                inputMode="decimal"
                placeholder={it.ajuda || (it.min != null ? `${it.min}–${it.max ?? "…"}` : "valor")}
                value={sel[i] ?? ""}
                onChange={(e) => {
                  const n = e.target.value === "" ? undefined : Number(e.target.value.replace(",", "."));
                  set(i, n != null && Number.isNaN(n) ? undefined : n);
                }}
                style={{ minHeight: 44 }}
              />
            </div>
          )}
          {it.ajuda && it.tipo === "opcoes" && <div className="faint" style={{ fontSize: 11, marginTop: 4 }}>{it.ajuda}</div>}
        </div>
      ))}

      {def.fonte && <div className="faint" style={{ fontSize: 11, lineHeight: 1.4 }}>Fonte: {def.fonte}</div>}
    </div>
  );
}
