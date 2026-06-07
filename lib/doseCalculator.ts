import { Dose, Infusao } from "./condutas";

export type DoseResult = { label: string };

function fmt(n: number): string {
  // Ate 1 casa decimal, sem zeros desnecessarios.
  const r = Math.round(n * 10) / 10;
  return String(r).replace(".", ",");
}

// Doses de infusao podem ser <1 (ex.: 0,05 mcg/kg/min) — preservar ate 2 casas.
function fmtDose(n: number): string {
  const r = Math.round(n * 100) / 100;
  return String(r).replace(".", ",");
}

export type InfusaoResult = { mlh: string; faixaLabel: string };

// Converte a faixa de dose de uma infusão em mL/h na bomba (BIC), pela diluição.
// mcg/kg/min usa concMcgMl + peso; mcg/min e UI/min e mg/min nao dependem do peso.
export function calcInfusao(inf: Infusao, pesoKg?: number): InfusaoResult | null {
  if (!inf.faixa) return null;
  const conc = inf.unidade.startsWith("mcg")
    ? inf.concMcgMl
    : inf.unidade.startsWith("UI")
    ? inf.concUiMl
    : inf.concMgMl;
  if (!conc) return null;
  const perKg = inf.unidade.includes("/kg");
  if (perKg && !(pesoKg && pesoKg > 0)) return null;
  const perHour = inf.unidade.endsWith("/h");

  const mlh = (dose: number): number => {
    const porMin = perKg ? dose * (pesoKg as number) : dose;
    const porHora = perHour ? porMin : porMin * 60; // se /h, ja e por hora
    return porHora / conc;
  };

  const lo = mlh(inf.faixa.min);
  const hi = inf.faixa.max != null ? mlh(inf.faixa.max) : undefined;
  const mlhStr = hi != null ? `${fmt(lo)}–${fmt(hi)} mL/h` : `${fmt(lo)} mL/h`;
  const faixaStr = inf.faixa.max != null ? `${fmtDose(inf.faixa.min)}–${fmtDose(inf.faixa.max)}` : `${fmtDose(inf.faixa.min)}`;
  return { mlh: mlhStr, faixaLabel: `${faixaStr} ${inf.unidade}` };
}

// Calcula a dose por peso como FAIXA (nunca um numero unico — postura medico-legal).
export function calcDose(d: Dose, pesoKg: number): DoseResult | null {
  if (!d.mgPorKg || !(pesoKg > 0)) return null;
  const unidade = d.unidade ?? "mg/kg";
  // Teto absoluto (ex.: alteplase 90 mg, tenecteplase 25 mg, fenitoina ~1500 mg) — evita sobredose por peso.
  const cap = d.maxAbs ?? Infinity;
  const vMin = Math.min(d.mgPorKg.min * pesoKg, cap);
  const vMax = d.mgPorKg.max != null ? Math.min(d.mgPorKg.max * pesoKg, cap) : undefined;
  const atingiuTeto = d.maxAbs != null && d.mgPorKg.min * pesoKg >= d.maxAbs;

  if (unidade === "mg/kg") {
    const mg = vMax != null ? `${fmt(vMin)}–${fmt(vMax)} mg` : `${fmt(vMin)} mg`;
    const tetoTxt = atingiuTeto ? ` (teto ${fmt(d.maxAbs as number)} mg)` : "";
    const conc = d.concentracaoPadraoMgMl;
    if (conc) {
      const mlMin = vMin / conc;
      const mlMax = vMax != null ? vMax / conc : undefined;
      const ml = mlMax != null ? `${fmt(mlMin)}–${fmt(mlMax)} mL` : `${fmt(mlMin)} mL`;
      return { label: `${mg} ≈ ${ml}${tetoTxt}` };
    }
    return { label: `${mg}${tetoTxt}` };
  }

  const unit = unidade === "mL/kg" ? "mL" : unidade === "mEq/kg" ? "mEq" : unidade === "mcg/kg" ? "mcg" : "mcg/min";
  const label = vMax != null ? `${fmt(vMin)}–${fmt(vMax)} ${unit}` : `${fmt(vMin)} ${unit}`;
  return { label };
}
