"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Activity, AlertTriangle } from "lucide-react";
import { interpretarGaso, type GasoInput } from "@/lib/gasometria";

const num = (v: string): number | undefined => {
  if (String(v).trim() === "") return undefined; // vazio = não informado (Number("") seria 0!)
  const x = Number(String(v).replace(",", "."));
  return Number.isFinite(x) ? x : undefined;
};

function Campo({ label, value, onChange, sufixo, ph }: { label: string; value: string; onChange: (v: string) => void; sufixo?: string; ph?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 90 }}>
      <label className="label" style={{ marginBottom: 4 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input className="field" inputMode="decimal" value={value} placeholder={ph} onChange={(e) => onChange(e.target.value)} style={{ minHeight: 46, paddingRight: sufixo ? 42 : 12 }} />
        {sufixo && <span className="faint" style={{ position: "absolute", right: 10, top: 14, fontSize: 11 }}>{sufixo}</span>}
      </div>
    </div>
  );
}

export default function CalcGaso() {
  const [v, setV] = useState({ pH: "", pCO2: "", HCO3: "", Na: "", Cl: "", K: "", alb: "", lac: "", pO2: "", FiO2: "" });
  const [opc, setOpc] = useState(false);
  const [passos, setPassos] = useState(false);
  const set = (k: keyof typeof v) => (val: string) => setV((s) => ({ ...s, [k]: val }));

  const r = useMemo(() => {
    const i: GasoInput = {
      pH: num(v.pH), pCO2: num(v.pCO2), HCO3: num(v.HCO3),
      Na: num(v.Na), Cl: num(v.Cl), K: num(v.K), albumina: num(v.alb), lactato: num(v.lac), pO2: num(v.pO2), FiO2: num(v.FiO2),
    };
    return interpretarGaso(i);
  }, [v]);

  const temObrig = v.pH && v.pCO2 && v.HCO3;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <Campo label="pH" value={v.pH} onChange={set("pH")} ph="7,40" />
        <Campo label="pCO₂" value={v.pCO2} onChange={set("pCO2")} sufixo="mmHg" ph="40" />
        <Campo label="HCO₃" value={v.HCO3} onChange={set("HCO3")} sufixo="mEq/L" ph="24" />
      </div>

      <button className="btn btn-ghost btn-sm" onClick={() => setOpc((o) => !o)} style={{ alignSelf: "flex-start" }}>
        Mais dados (opcional) <ChevronDown size={15} style={{ transform: opc ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>
      {opc && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Campo label="Na⁺" value={v.Na} onChange={set("Na")} sufixo="mEq/L" ph="140" />
            <Campo label="Cl⁻" value={v.Cl} onChange={set("Cl")} sufixo="mEq/L" ph="104" />
            <Campo label="K⁺" value={v.K} onChange={set("K")} sufixo="mEq/L" ph="4,0" />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Campo label="Albumina" value={v.alb} onChange={set("alb")} sufixo="g/dL" ph="4,0" />
            <Campo label="Lactato" value={v.lac} onChange={set("lac")} sufixo="mmol/L" ph="1,5" />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Campo label="pO₂" value={v.pO2} onChange={set("pO2")} sufixo="mmHg" ph="90" />
            <Campo label="FiO₂" value={v.FiO2} onChange={set("FiO2")} sufixo="% ou fração" ph="0,21" />
          </div>
          <div className="faint" style={{ fontSize: 11, lineHeight: 1.4 }}>Na/Cl liberam o ânion gap; albumina o AG corrigido; pO₂+FiO₂ a relação P/F; lactato a hipoperfusão.</div>
        </div>
      )}

      {!temObrig ? (
        <div className="muted" style={{ textAlign: "center", padding: 18 }}>Informe pH, pCO₂ e HCO₃.</div>
      ) : !r.ok ? (
        <div className="card-2" style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--amber)", fontWeight: 600, fontSize: 13, boxShadow: "none" }}>
          <AlertTriangle size={15} /> {r.erro}
        </div>
      ) : (
        <>
          {/* Bloco 1 — Conclusão */}
          <div className="z-sunken" style={{ padding: "14px 15px", borderColor: "var(--primary)" }}>
            <div className="eyebrow" style={{ margin: "0 0 5px" }}>Conclusão</div>
            <div style={{ fontWeight: 800, fontSize: 16.5, lineHeight: 1.4, color: "var(--primary-press)" }}>{r.conclusao}</div>
          </div>

          {/* Bandeiras críticas (vermelho) */}
          {r.bandeiras.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {r.bandeiras.map((b, k) => (
                <div key={k} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 12px", borderRadius: 12, background: "color-mix(in srgb, var(--red) 10%, var(--surface))", border: "1px solid color-mix(in srgb, var(--red) 35%, var(--border))", color: "var(--red)", fontWeight: 700, fontSize: 13, lineHeight: 1.4 }}>
                  <AlertTriangle size={15} style={{ flex: "0 0 auto", marginTop: 1 }} /> {b}
                </div>
              ))}
            </div>
          )}

          {/* Bloco 2 — Passo a passo (recolhível) */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <button className="list-row" style={{ borderBottom: passos ? "1px solid var(--border)" : "none", width: "100%", padding: "12px 14px" }} onClick={() => setPassos((p) => !p)}>
              <span style={{ flex: 1, textAlign: "left", fontWeight: 800, fontSize: 14.5 }}>Passo a passo</span>
              <ChevronDown size={18} className="faint" style={{ transform: passos ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
            </button>
            {passos && (
              <ol style={{ margin: 0, padding: "12px 16px 12px 30px", display: "flex", flexDirection: "column", gap: 7 }}>
                {r.passos.map((p, k) => (
                  <li key={k} style={{ fontSize: 13.5, lineHeight: 1.5 }}>{p}</li>
                ))}
              </ol>
            )}
          </div>

          {/* Bloco 3 — Causas prováveis */}
          {r.causas.length > 0 && (
            <div>
              <div className="eyebrow" style={{ margin: "2px 0 6px" }}>Causas prováveis</div>
              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {r.causas.map((c, k) => (
                  <div key={k} style={{ display: "flex", gap: 7, fontSize: 13.5, lineHeight: 1.45 }}>
                    <span style={{ color: "var(--primary)", fontWeight: 800 }}>•</span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="faint" style={{ fontSize: 11, lineHeight: 1.4 }}>Fonte: {r.fonte} Apoio à decisão — interprete junto ao quadro clínico.</div>
        </>
      )}
    </div>
  );
}
