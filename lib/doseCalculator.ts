import { Dose, Infusao } from "./condutas";

export type DoseResult = { label: string };

function fmt(n: number): string {
  // Ate 1 casa decimal, sem zeros desnecessarios.
  const r = Math.round(n * 10) / 10;
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
  const faixaStr = inf.faixa.max != null ? `${fmt(inf.faixa.min)}–${fmt(inf.faixa.max)}` : `${fmt(inf.faixa.min)}`;
  return { mlh: mlhStr, faixaLabel: `${faixaStr} ${inf.unidade}` };
}

// Calcula a dose por peso como FAIXA (nunca um numero unico — postura medico-legal).
export function calcDose(d: Dose, pesoKg: number): DoseResult | null {
  if (!d.mgPorKg || !(pesoKg > 0)) return null;
  const unidade = d.unidade ?? "mg/kg";
  const vMin = d.mgPorKg.min * pesoKg;
  const vMax = d.mgPorKg.max != null ? d.mgPorKg.max * pesoKg : undefined;

  if (unidade === "mg/kg") {
    const mg = vMax != null ? `${fmt(vMin)}–${fmt(vMax)} mg` : `${fmt(vMin)} mg`;
    const conc = d.concentracaoPadraoMgMl;
    if (conc) {
      const mlMin = vMin / conc;
      const mlMax = vMax != null ? vMax / conc : undefined;
      const ml = mlMax != null ? `${fmt(mlMin)}–${fmt(mlMax)} mL` : `${fmt(mlMin)} mL`;
      return { label: `${mg} ≈ ${ml}` };
    }
    return { label: mg };
  }

  const unit = unidade === "mL/kg" ? "mL" : unidade === "mEq/kg" ? "mEq" : "mcg/min";
  const label = vMax != null ? `${fmt(vMin)}–${fmt(vMax)} ${unit}` : `${fmt(vMin)} ${unit}`;
  return { label };
}
