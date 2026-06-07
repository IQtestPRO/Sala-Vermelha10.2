"use client";

import { useState } from "react";
import { ChevronDown, FlaskConical, Droplet, Activity, Syringe, AlertTriangle } from "lucide-react";

// Calculadoras de fórmula (Medicações avançadas). Fórmulas canônicas — conferir protocolo local.
function num(v: string): number | undefined {
  const x = Number(String(v).replace(",", "."));
  return Number.isFinite(x) && x > 0 ? x : undefined;
}
function f(x: number, d = 1): string {
  const r = Math.round(x * 10 ** d) / 10 ** d;
  return String(r).replace(".", ",");
}

function Campo({ label, value, onChange, suffix, placeholder }: { label: string; value: string; onChange: (v: string) => void; suffix?: string; placeholder?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label className="label" style={{ marginBottom: 4 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input className="field" inputMode="decimal" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={{ minHeight: 46, paddingRight: suffix ? 42 : 14 }} />
        {suffix && <span className="faint" style={{ position: "absolute", right: 12, top: 14, fontSize: 12 }}>{suffix}</span>}
      </div>
    </div>
  );
}
function SexoToggle({ sexo, set }: { sexo: "M" | "F"; set: (s: "M" | "F") => void }) {
  return (
    <div>
      <label className="label" style={{ marginBottom: 4 }}>Sexo</label>
      <div className="scroll-x">
        {(["M", "F"] as const).map((s) => (
          <button key={s} className={`chip ${sexo === s ? "chip-on" : ""}`} onClick={() => set(s)} style={{ flex: "0 0 auto", minHeight: 46 }}>{s === "M" ? "Masculino" : "Feminino"}</button>
        ))}
      </div>
    </div>
  );
}
function Res({ titulo, valor, nota }: { titulo: string; valor: string; nota?: string }) {
  return (
    <div className="z-sunken" style={{ padding: "11px 13px" }}>
      <div className="faint" style={{ fontSize: 12, fontWeight: 700 }}>{titulo}</div>
      <div className="data" style={{ fontSize: 16.5, fontWeight: 700, color: "var(--primary-press)", marginTop: 3 }}>{valor}</div>
      {nota && <div className="faint" style={{ fontSize: 11.5, marginTop: 3, lineHeight: 1.4 }}>{nota}</div>}
    </div>
  );
}
function Alerta({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 7, alignItems: "flex-start", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.45, padding: "9px 11px", borderRadius: 10, background: "color-mix(in srgb, var(--amber) 10%, var(--surface))", border: "1px solid color-mix(in srgb, var(--amber) 30%, var(--border))" }}>
      <AlertTriangle size={14} color="var(--amber)" style={{ flex: "0 0 auto", marginTop: 1 }} />
      <span>{children}</span>
    </div>
  );
}

function Item({ titulo, icon, children }: { titulo: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <button onClick={() => setOpen((o) => !o)} className="list-row" style={{ borderBottom: open ? "1px solid var(--border)" : "none", width: "100%", padding: "13px 14px" }}>
        <span style={{ flex: "0 0 34px", height: 34, borderRadius: 10, background: "var(--navy-tint)", color: "var(--navy)", display: "grid", placeItems: "center" }}>{icon}</span>
        <span style={{ flex: 1, textAlign: "left", fontWeight: 800, fontSize: 15 }}>{titulo}</span>
        <ChevronDown size={18} className="faint" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>
      {open && <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 11 }}>{children}</div>}
    </div>
  );
}

// ---------- Sódio ----------
function Hiponatremia() {
  const [na, setNa] = useState(""), [peso, setPeso] = useState(""), [sexo, setSexo] = useState<"M" | "F">("M");
  const naN = num(na), p = num(peso);
  const act = p ? p * (sexo === "M" ? 0.6 : 0.5) : undefined;
  const dPerL = (naInf: number) => (naN != null && act != null ? (naInf - naN) / (act + 1) : undefined);
  return (
    <>
      <div style={{ display: "flex", gap: 10 }}>
        <Campo label="Na atual" value={na} onChange={setNa} suffix="mEq/L" placeholder="ex.: 118" />
        <Campo label="Peso" value={peso} onChange={setPeso} suffix="kg" placeholder="ex.: 70" />
      </div>
      <SexoToggle sexo={sexo} set={setSexo} />
      {act != null && naN != null ? (
        <>
          <Res titulo="Água corporal total (ACT)" valor={`${f(act)} L`} nota={`peso × ${sexo === "M" ? "0,6" : "0,5"}`} />
          <Res titulo="↑ Na por 1 L de SF 0,9% (Na 154)" valor={`${f(dPerL(154) as number, 1)} mEq/L`} nota="Adrogué-Madias: (Na_infusato − Na) / (ACT + 1)" />
          <Res titulo="↑ Na por 1 L de NaCl 3% (Na 513)" valor={`${f(dPerL(513) as number, 1)} mEq/L`} />
          <Alerta>Correção ≤ <b>8 mEq/L/24 h</b> em alto risco (alcoolismo, desnutrição, hipoK⁺, Na &lt; 105, hiponatremia crônica), teto <b>10 mEq/L/24 h</b> e <b>≤ 18 em 48 h</b> — risco de síndrome de desmielinização osmótica (SDO). Sintomático grave: NaCl 3% 100–150 mL em bolus. A fórmula só ESTIMA (perdas urinárias aceleram a subida) — dose o Na a cada 2–4 h; se exceder a meta, considere DDAVP/água livre.</Alerta>
        </>
      ) : (
        <div className="faint" style={{ fontSize: 12.5 }}>Informe Na atual e peso.</div>
      )}
    </>
  );
}
function Hipernatremia() {
  const [na, setNa] = useState(""), [peso, setPeso] = useState(""), [sexo, setSexo] = useState<"M" | "F">("M");
  const naN = num(na), p = num(peso);
  const act = p ? p * (sexo === "M" ? 0.6 : 0.5) : undefined;
  const deficit = naN != null && act != null ? act * (naN / 140 - 1) : undefined;
  return (
    <>
      <div style={{ display: "flex", gap: 10 }}>
        <Campo label="Na atual" value={na} onChange={setNa} suffix="mEq/L" placeholder="ex.: 160" />
        <Campo label="Peso" value={peso} onChange={setPeso} suffix="kg" placeholder="ex.: 70" />
      </div>
      <SexoToggle sexo={sexo} set={setSexo} />
      {deficit != null ? (
        <>
          <Res titulo="Déficit de água livre" valor={`${f(deficit)} L`} nota="ACT × (Na/140 − 1)" />
          <Alerta>Repor em <b>48–72 h</b>, queda do Na ≤ <b>10 mEq/L em 24 h</b>. Some as perdas insensíveis/contínuas. Prefira via enteral (água) quando possível.</Alerta>
        </>
      ) : (
        <div className="faint" style={{ fontSize: 12.5 }}>Informe Na atual e peso.</div>
      )}
    </>
  );
}

// ---------- Heparina ----------
function Heparina() {
  const [peso, setPeso] = useState("");
  const p = num(peso);
  return (
    <>
      <Campo label="Peso" value={peso} onChange={setPeso} suffix="kg" placeholder="ex.: 70" />
      {p ? (
        <>
          <Res titulo="Bólus inicial (80 U/kg)" valor={`${f(80 * p, 0)} UI IV`} nota="dose para TEV · teto institucional ~10.000 UI" />
          <Res titulo="Infusão inicial (18 U/kg/h)" valor={`${f(18 * p, 0)} UI/h`} />
        </>
      ) : (
        <div className="faint" style={{ fontSize: 12.5 }}>Informe o peso para o bólus e a infusão inicial.</div>
      )}
      <div className="label" style={{ margin: "2px 0 0" }}>Ajuste pela RAZÃO do TTPa (nomograma de Raschke)</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5 }}>
        {[
          ["< 1,2× o controle", "Bólus 80 U/kg + ↑ 4 U/kg/h"],
          ["1,2–1,5×", "Bólus 40 U/kg + ↑ 2 U/kg/h"],
          ["1,5–2,3× (alvo)", "Manter"],
          ["2,3–3,0×", "↓ 2 U/kg/h (não suspende)"],
          ["> 3,0×", "Suspender 1 h, depois ↓ 3 U/kg/h"],
        ].map(([t, a], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "7px 10px", borderRadius: 9, background: "var(--surface-sunken)" }}>
            <span style={{ fontWeight: 600 }}>{t}</span>
            <span className="faint" style={{ textAlign: "right" }}>{a}</span>
          </div>
        ))}
      </div>
      <Alerta>O nomograma usa a RAZÃO TTPa/controle (não segundos fixos) — calibre ao reagente do seu laboratório (idealmente anti-Xa 0,3–0,7 UI/mL). TTPa 6 h após início e após cada ajuste. Coeficientes 80/18 são para <b>TEV</b>; na <b>SCA</b> são menores (60 U/kg, máx 4.000 + 12 U/kg/h).</Alerta>
    </>
  );
}

// ---------- Hidantalização ----------
function Hidantalizacao() {
  const [peso, setPeso] = useState("");
  const p = num(peso);
  return (
    <>
      <Campo label="Peso" value={peso} onChange={setPeso} suffix="kg" placeholder="ex.: 70" />
      {p ? (
        <>
          <Res titulo="Dose de ataque (15–20 mg/kg)" valor={`${f(15 * p, 0)}–${f(20 * p, 0)} mg IV`} nota="dose pelo peso real · limite de segurança ~30 mg/kg total" />
          <Res titulo="Velocidade" valor="≤ 50 mg/min (≤ 20 no idoso/cardiopata)" nota={`tempo mín. ≈ ${f((15 * p) / 50, 0)}–${f((20 * p) / 50, 0)} min`} />
        </>
      ) : (
        <div className="faint" style={{ fontSize: 12.5 }}>Informe o peso.</div>
      )}
      <Alerta>Diluir em SF 0,9% (precipita em SG); monitorize ECG e PA. <b>Contraindicada</b> em bradicardia sinusal e BAV de 2º/3º grau. Risco de hipotensão e de extravasamento (purple glove syndrome). Fosfenitoína é alternativa mais segura (dose em EF — equivalente de fenitoína).</Alerta>
    </>
  );
}

// ---------- Controle glicêmico ----------
function Glicemico() {
  return (
    <>
      <Res titulo="Alvo (paciente crítico)" valor="140–180 mg/dL" nota="evitar < 110 e > 180; nunca correção agressiva" />
      <div style={{ fontSize: 13.5, lineHeight: 1.5, display: "flex", flexDirection: "column", gap: 6 }}>
        <div>• Iniciar insulina IV se glicemia persistente <b>&gt; 180 mg/dL</b>.</div>
        <div>• Início comum: bólus e infusão guiados por protocolo (ex.: Yale) — glicemia capilar de <b>1/1 h</b> até estável, depois 2/2 h.</div>
        <div>• Ajuste pela tendência (não só o valor): se caindo rápido, reduza antes do alvo.</div>
        <div>• Reponha potássio (insulina baixa o K⁺). Tenha glicose 50% à mão p/ hipoglicemia.</div>
      </div>
      <Alerta>Insulina IV é altamente protocolo-dependente: <b>siga o protocolo da sua unidade</b>. Este é um resumo de apoio, não um gerador de dose.</Alerta>
    </>
  );
}

export default function CalcFormulas() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Item titulo="Hiponatremia (correção de Na)" icon={<Droplet size={18} />}><Hiponatremia /></Item>
      <Item titulo="Hipernatremia (déficit de água livre)" icon={<Droplet size={18} />}><Hipernatremia /></Item>
      <Item titulo="Heparinização venosa (+ nomograma TTPa)" icon={<Syringe size={18} />}><Heparina /></Item>
      <Item titulo="Hidantalização (ataque de fenitoína)" icon={<FlaskConical size={18} />}><Hidantalizacao /></Item>
      <Item titulo="Controle glicêmico (insulina IV)" icon={<Activity size={18} />}><Glicemico /></Item>
    </div>
  );
}
