import { Dose } from "./condutas";

export type DoseResult = { label: string };

function fmt(n: number): string {
  // Ate 1 casa decimal, sem zeros desnecessarios.
  const r = Math.round(n * 10) / 10;
  return String(r).replace(".", ",");
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
