// Cálculos por idade/peso (pediatria) e função renal (idoso) — usados DENTRO
// da calculadora de dose de cada conduta (contextual, não numa página solta).

function f(x: number, d = 1): string {
  const r = Math.round(x * 10 ** d) / 10 ** d;
  return String(r).replace(".", ",");
}
function faixa(a: number, b: number, u: string, d = 0): string {
  return `${f(a, d)}–${f(b, d)} ${u}`;
}

// Peso estimado pela idade (APLS) quando não se tem a balança.
export function estimarPeso(anos: number): number {
  if (anos < 1) return (anos * 12) / 2 + 4; // lactente: (meses/2)+4
  if (anos <= 5) return anos * 2 + 8;
  return anos * 3 + 7;
}

export type PedValor = { titulo: string; valor: string; nota?: string };

// Valores pediátricos universais de emergência, calculados pelo peso.
export function valoresPediatricos(p: number, anos?: number): PedValor[] {
  const v: PedValor[] = [
    { titulo: "Adrenalina PCR (IV/IO)", valor: `${f(0.01 * p, 2)} mg = ${f(0.1 * p, 1)} mL (1:10.000)`, nota: "0,01 mg/kg · repetir 3–5 min · máx 1 mg" },
    { titulo: "Desfibrilação", valor: faixa(2 * p, 4 * p, "J"), nota: "2 J/kg (1º) → 4 J/kg" },
    { titulo: "Cardioversão sincronizada", valor: faixa(0.5 * p, 1 * p, "J"), nota: "0,5–1 J/kg" },
    { titulo: "Expansão volêmica", valor: faixa(10 * p, 20 * p, "mL"), nota: "10–20 mL/kg (10 se cardio/RN)" },
    { titulo: "Glicose (hipoglicemia)", valor: `${faixa(2 * p, 5 * p, "mL")} de SG 10%`, nota: "2–5 mL/kg de D10" },
    { titulo: "Manutenção (4-2-1)", valor: `${f(p <= 10 ? 4 * p : p <= 20 ? 40 + 2 * (p - 10) : 60 + 1 * (p - 20), 0)} mL/h` },
    { titulo: "Midazolam (crise)", valor: faixa(0.1 * p, 0.2 * p, "mg", 1), nota: "0,1–0,2 mg/kg · máx 10 mg" },
    { titulo: "Adrenalina IM (anafilaxia)", valor: `${f(Math.min(0.01 * p, 0.5), 2)} mg (1:1.000)`, nota: "0,01 mg/kg · máx 0,5 mg" },
  ];
  if (anos != null && anos >= 1) {
    v.splice(3, 0, {
      titulo: "Tubo (TOT)",
      valor: `s/ cuff ${f(anos / 4 + 4, 1)} · c/ cuff ${f(anos / 4 + 3.5, 1)}`,
      nota: `profundidade ≈ ${f(anos / 2 + 12, 0)} cm`,
    });
  } else if (anos != null && anos < 1) {
    v.splice(3, 0, { titulo: "Tubo (TOT)", valor: "3,0–3,5 (RN) · 3,5–4,0 (lactente)", nota: "profundidade ≈ TOT × 3 cm" });
  }
  return v;
}

// Clearance de creatinina (Cockcroft-Gault) — ajuste de dose no idoso.
export function clearanceCreatinina(anos: number, pesoKg: number, creatinina: number, sexo: "M" | "F"): number {
  let v = ((140 - anos) * pesoKg) / (72 * creatinina);
  if (sexo === "F") v *= 0.85;
  return v;
}

export function bandaRenal(v: number): { txt: string; cor: string } {
  if (v >= 90) return { txt: "Função normal", cor: "var(--green)" };
  if (v >= 60) return { txt: "Redução leve", cor: "var(--green)" };
  if (v >= 30) return { txt: "Moderada — ajuste doses renais", cor: "var(--amber)" };
  if (v >= 15) return { txt: "Grave — evite nefrotóxicos", cor: "var(--red)" };
  return { txt: "Falência renal — reavaliar tudo", cor: "var(--red)" };
}

export { f as fmtNum };
