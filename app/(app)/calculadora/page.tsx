"use client";

import { useMemo, useState } from "react";
import { Baby, UserRound, AlertTriangle } from "lucide-react";
import TopBar, { LogoutButton } from "@/components/TopBar";
import { DISCLAIMER_CURTO } from "@/lib/legal/disclaimer";

function num(v: string): number | undefined {
  const x = Number(String(v).replace(",", "."));
  return Number.isFinite(x) && x > 0 ? x : undefined;
}
function f(x: number, d = 1): string {
  const r = Math.round(x * 10 ** d) / 10 ** d;
  return String(r).replace(".", ",");
}
function faixa(a: number, b: number, unidade: string, d = 0): string {
  return `${f(a, d)}–${f(b, d)} ${unidade}`;
}

function Campo({
  label,
  value,
  onChange,
  suffix,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  placeholder?: string;
}) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label className="label" style={{ marginBottom: 4 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          className="field"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{ minHeight: 48, paddingRight: suffix ? 40 : 14 }}
        />
        {suffix && <span className="faint" style={{ position: "absolute", right: 12, top: 14, fontSize: 13 }}>{suffix}</span>}
      </div>
    </div>
  );
}

// Cartão de resultado: rótulo + valor em mono.
function Res({ titulo, valor, nota }: { titulo: string; valor: string; nota?: string }) {
  return (
    <div className="z-sunken" style={{ padding: "11px 13px" }}>
      <div className="faint" style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.02em" }}>{titulo}</div>
      <div className="data" style={{ fontSize: 16.5, fontWeight: 700, color: "var(--primary-press)", marginTop: 3 }}>{valor}</div>
      {nota && <div className="faint" style={{ fontSize: 11.5, marginTop: 3, lineHeight: 1.4 }}>{nota}</div>}
    </div>
  );
}

export default function CalculadoraPage() {
  const [mode, setMode] = useState<"ped" | "idoso">("ped");

  // Pediátrico
  const [unidadeIdade, setUnidadeIdade] = useState<"anos" | "meses">("anos");
  const [idade, setIdade] = useState("");
  const [peso, setPeso] = useState("");

  // Idoso / renal
  const [idadeI, setIdadeI] = useState("");
  const [pesoI, setPesoI] = useState("");
  const [creat, setCreat] = useState("");
  const [sexo, setSexo] = useState<"M" | "F">("M");

  const ped = useMemo(() => {
    const raw = num(idade);
    const anos = raw == null ? undefined : unidadeIdade === "meses" ? raw / 12 : raw;
    let p = num(peso);
    let estimado = false;
    if (!p && anos != null) {
      if (anos < 1) p = (anos * 12) / 2 + 4;
      else if (anos <= 5) p = anos * 2 + 8;
      else p = anos * 3 + 7;
      estimado = true;
    }
    if (!p) return null;
    const manut = p <= 10 ? 4 * p : p <= 20 ? 40 + 2 * (p - 10) : 60 + 1 * (p - 20);
    return { p, estimado, anos, manut };
  }, [idade, peso, unidadeIdade]);

  const crcl = useMemo(() => {
    const a = num(idadeI), p = num(pesoI), c = num(creat);
    if (a == null || p == null || c == null) return null;
    let v = ((140 - a) * p) / (72 * c);
    if (sexo === "F") v *= 0.85;
    return v;
  }, [idadeI, pesoI, creat, sexo]);

  function bandaRenal(v: number) {
    if (v >= 90) return { txt: "Função normal", cor: "var(--green)" };
    if (v >= 60) return { txt: "Redução leve", cor: "var(--green)" };
    if (v >= 30) return { txt: "Moderada — ajuste doses renais", cor: "var(--amber)" };
    if (v >= 15) return { txt: "Grave — ajuste/evite nefrotóxicos", cor: "var(--red)" };
    return { txt: "Falência renal — reavaliar tudo", cor: "var(--red)" };
  }

  return (
    <>
      <TopBar brand title="Calculadora" subtitle="Doses por idade/peso — pediatria e idoso" right={<LogoutButton />} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, paddingBottom: 28 }}>
        {/* Segmento */}
        <div style={{ display: "flex", gap: 8 }}>
          <button className={`btn ${mode === "ped" ? "btn-primary" : "btn-ghost"}`} onClick={() => setMode("ped")} style={{ flex: 1, minHeight: 46 }}>
            <Baby size={18} /> Pediátrico / Bebê
          </button>
          <button className={`btn ${mode === "idoso" ? "btn-primary" : "btn-ghost"}`} onClick={() => setMode("idoso")} style={{ flex: 1, minHeight: 46 }}>
            <UserRound size={18} /> Idoso (renal)
          </button>
        </div>

        <div className="card-2" style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11.5, color: "var(--text-dim)", padding: "10px 12px", boxShadow: "none" }}>
          <AlertTriangle size={15} color="var(--amber)" style={{ flex: "0 0 auto", marginTop: 1 }} />
          <span>{DISCLAIMER_CURTO}</span>
        </div>

        {mode === "ped" ? (
          <>
            <div>
              <label className="label">Idade</label>
              <div className="scroll-x" style={{ marginBottom: 8 }}>
                {(["anos", "meses"] as const).map((u) => (
                  <button key={u} className={`chip ${unidadeIdade === u ? "chip-on" : ""}`} onClick={() => setUnidadeIdade(u)} style={{ flex: "0 0 auto" }}>
                    {u}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Campo label="" value={idade} onChange={setIdade} suffix={unidadeIdade} placeholder={unidadeIdade === "anos" ? "ex.: 4" : "ex.: 8"} />
                <Campo label="" value={peso} onChange={setPeso} suffix="kg" placeholder="peso (opcional)" />
              </div>
              <div className="faint" style={{ fontSize: 11.5, marginTop: 6, lineHeight: 1.4 }}>
                Se não souber o peso, estimamos pela idade (APLS). Informe o peso real sempre que possível.
              </div>
            </div>

            {!ped ? (
              <div className="muted" style={{ textAlign: "center", padding: 20 }}>Informe a idade (e o peso, se tiver).</div>
            ) : (
              <>
                <div className="z-sunken" style={{ padding: "11px 13px", borderColor: "var(--primary)" }}>
                  <div className="faint" style={{ fontSize: 12, fontWeight: 700 }}>Peso usado nos cálculos</div>
                  <div className="data" style={{ fontSize: 19, fontWeight: 800, color: "var(--primary-press)", marginTop: 2 }}>
                    {f(ped.p)} kg {ped.estimado && <span className="faint" style={{ fontSize: 12, fontWeight: 600 }}>(estimado)</span>}
                  </div>
                </div>

                <div className="label" style={{ marginTop: 2 }}>Parada / via aérea</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Res titulo="Adrenalina (PCR) IV/IO" valor={`${f(0.01 * ped.p, 2)} mg = ${f(0.1 * ped.p, 1)} mL (1:10.000)`} nota="0,01 mg/kg · repetir 3–5 min · máx 1 mg" />
                  <Res titulo="Desfibrilação" valor={faixa(2 * ped.p, 4 * ped.p, "J")} nota="2 J/kg (1º) → 4 J/kg (próximos)" />
                  <Res titulo="Cardioversão sincronizada" valor={faixa(0.5 * ped.p, 1 * ped.p, "J")} nota="0,5–1 J/kg; subir a 2 J/kg se falhar" />
                  {ped.anos != null && (
                    ped.anos < 1 ? (
                      <Res titulo="Tubo (TOT) sem cuff" valor="3,0–3,5 (RN) · 3,5–4,0 (lactente)" nota="Profundidade ≈ TOT × 3 cm" />
                    ) : (
                      <Res
                        titulo="Tubo (TOT)"
                        valor={`sem cuff ${f(ped.anos / 4 + 4, 1)} · com cuff ${f(ped.anos / 4 + 3.5, 1)}`}
                        nota={`Profundidade ≈ ${f(ped.anos / 2 + 12, 0)} cm (idade/2 + 12)`}
                      />
                    )
                  )}
                </div>

                <div className="label" style={{ marginTop: 2 }}>Circulação / metabólico</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Res titulo="Expansão volêmica (cristaloide)" valor={faixa(10 * ped.p, 20 * ped.p, "mL")} nota="10–20 mL/kg em bolus; reavaliar (10 se cardio/RN)" />
                  <Res titulo="Glicose (hipoglicemia)" valor={`${faixa(2 * ped.p, 5 * ped.p, "mL")} de SG 10%`} nota="2–5 mL/kg de D10 (0,2–0,5 g/kg)" />
                  <Res titulo="Manutenção (Holliday-Segar)" valor={`${f(ped.manut, 0)} mL/h`} nota="Regra 4-2-1" />
                </div>

                <div className="label" style={{ marginTop: 2 }}>Convulsão / sedação</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Res titulo="Midazolam (crise)" valor={`${faixa(0.1 * ped.p, 0.2 * ped.p, "mg", 1)}`} nota="0,1–0,2 mg/kg IV/IM/IN · máx 10 mg" />
                  <Res titulo="Diazepam (crise)" valor={`${faixa(0.2 * ped.p, 0.3 * ped.p, "mg", 1)}`} nota="0,2–0,3 mg/kg IV · máx 10 mg" />
                  <Res titulo="Adrenalina IM (anafilaxia)" valor={`${f(Math.min(0.01 * ped.p, 0.5), 2)} mg (1:1.000)`} nota="0,01 mg/kg · máx 0,5 mg · repetir 5–15 min" />
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: 10 }}>
              <Campo label="Idade" value={idadeI} onChange={setIdadeI} suffix="anos" placeholder="ex.: 78" />
              <Campo label="Peso" value={pesoI} onChange={setPesoI} suffix="kg" placeholder="ex.: 64" />
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <Campo label="Creatinina" value={creat} onChange={setCreat} suffix="mg/dL" placeholder="ex.: 1,3" />
              <div style={{ flex: 1 }}>
                <label className="label">Sexo</label>
                <div className="scroll-x">
                  {(["M", "F"] as const).map((s) => (
                    <button key={s} className={`chip ${sexo === s ? "chip-on" : ""}`} onClick={() => setSexo(s)} style={{ flex: "0 0 auto" }}>
                      {s === "M" ? "Masculino" : "Feminino"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {!crcl ? (
              <div className="muted" style={{ textAlign: "center", padding: 20 }}>Informe idade, peso e creatinina.</div>
            ) : (
              <>
                <div className="z-sunken" style={{ padding: "13px 14px", borderColor: "var(--primary)" }}>
                  <div className="faint" style={{ fontSize: 12, fontWeight: 700 }}>Clearance de creatinina (Cockcroft-Gault)</div>
                  <div className="data" style={{ fontSize: 24, fontWeight: 800, color: "var(--primary-press)", marginTop: 2 }}>{f(crcl, 0)} mL/min</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: bandaRenal(crcl).cor }}>{bandaRenal(crcl).txt}</div>
                </div>
                <div className="card" style={{ borderColor: "color-mix(in srgb, var(--amber) 35%, var(--border))", display: "flex", flexDirection: "column", gap: 7 }}>
                  <div className="label" style={{ margin: 0 }}>Cuidados no idoso</div>
                  {[
                    "Comece pela MENOR dose eficaz de sedativos, opioides e benzodiazepínicos (maior sensibilidade, risco de delirium e queda).",
                    "Ajuste pela função renal acima: reduza/espace doses renais (ex.: enoxaparina, alguns ATB, gabapentina) e evite nefrotóxicos (AINEs, contraste sem hidratação).",
                    "Polifarmácia: cheque interações e a lista de Beers (anticolinérgicos, benzodiazepínicos de longa ação).",
                    "Apresentação atípica é comum (IAM/sepse sem dor/febre); tenha limiar baixo para investigar.",
                  ].map((t, i) => (
                    <div key={i} style={{ fontSize: 13.5, lineHeight: 1.45, display: "flex", gap: 7 }}>
                      <span style={{ color: "var(--amber)", fontWeight: 800 }}>•</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
