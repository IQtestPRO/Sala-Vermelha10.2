// Interpretador de gasometria arterial (motor data-driven). Fórmulas canônicas.
// Saída: conclusão (1 frase) + passo a passo + causas + bandeiras críticas.

export type GasoInput = {
  pH?: number;
  pCO2?: number;
  HCO3?: number;
  Na?: number;
  Cl?: number;
  K?: number;
  albumina?: number;
  lactato?: number;
  pO2?: number;
  FiO2?: number; // fração (0,21–1) ou % (21–100)
};
export type GasoResult = {
  ok: boolean;
  erro?: string;
  conclusao: string;
  passos: string[];
  causas: string[];
  bandeiras: string[]; // críticas (vermelho)
  fonte: string;
};

const f = (x: number, d = 1) => {
  const r = Math.round(x * 10 ** d) / 10 ** d;
  return String(r).replace(".", ",");
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function interpretarGaso(i: GasoInput): GasoResult {
  const passos: string[] = [];
  const causas: string[] = [];
  const bandeiras: string[] = [];
  const fonte = "Fórmula de Winter; compensações de Boston/Cohen; ânion gap (Emmett-Narins); ARDS-Berlin 2012.";

  const pH = i.pH, pCO2 = i.pCO2, HCO3 = i.HCO3;
  if (pH == null || pCO2 == null || HCO3 == null) {
    return { ok: false, erro: "Informe pH, pCO₂ e HCO₃.", conclusao: "", passos: [], causas: [], bandeiras: [], fonte };
  }
  if (pH < 6.5 || pH > 8) return { ok: false, erro: "pH fora da faixa plausível (6,5–8).", conclusao: "", passos: [], causas: [], bandeiras: [], fonte };
  if (pCO2 < 10 || pCO2 > 130) return { ok: false, erro: "pCO₂ fora da faixa plausível (10–130).", conclusao: "", passos: [], causas: [], bandeiras: [], fonte };
  if (HCO3 < 2 || HCO3 > 60) return { ok: false, erro: "HCO₃ fora da faixa plausível (2–60).", conclusao: "", passos: [], causas: [], bandeiras: [], fonte };

  // 1. Status do pH
  const acidemia = pH < 7.35, alcalemia = pH > 7.45;
  passos.push(`pH ${f(pH, 2)} → ${acidemia ? "acidemia (< 7,35)" : alcalemia ? "alcalemia (> 7,45)" : "pH normal (pode ser distúrbio misto compensado)"}.`);

  // 2. Distúrbio primário
  const hco3Baixo = HCO3 < 22, hco3Alto = HCO3 > 26, pco2Alto = pCO2 > 45, pco2Baixo = pCO2 < 35;
  let primario = "";
  if (acidemia) primario = hco3Baixo ? "acidose metabólica" : pco2Alto ? "acidose respiratória" : "acidose metabólica";
  else if (alcalemia) primario = hco3Alto ? "alcalose metabólica" : pco2Baixo ? "alcalose respiratória" : "alcalose metabólica";
  else {
    if (hco3Baixo && pco2Baixo) primario = "acidose metabólica";
    else if (hco3Alto && pco2Alto) primario = "alcalose metabólica";
    else if (hco3Baixo && pco2Alto) primario = "acidose respiratória";
    else if (hco3Alto && pco2Baixo) primario = "alcalose respiratória";
  }
  if (!primario) {
    passos.push(`pCO₂ ${f(pCO2)} mmHg e HCO₃ ${f(HCO3)} mEq/L dentro do normal → sem distúrbio ácido-base evidente.`);
    return { ok: true, conclusao: "Gasometria sem distúrbio ácido-base evidente.", passos, causas, bandeiras, fonte };
  }
  passos.push(`Distúrbio primário: ${primario} (${primario.includes("metabólica") ? `HCO₃ ${f(HCO3)} mEq/L` : `pCO₂ ${f(pCO2)} mmHg`}).`);

  // 3. Compensação esperada
  let compFrase = "";
  let cronicidade = "";
  let associadoResp = "";
  if (primario === "acidose metabólica") {
    const esp = 1.5 * HCO3 + 8;
    passos.push(`Compensação (Winter): pCO₂ esperado = 1,5×${f(HCO3)} + 8 = ${f(esp)} ± 2 mmHg.`);
    if (pCO2 > esp + 2) { compFrase = "acidose respiratória associada"; associadoResp = compFrase; passos.push(`pCO₂ real ${f(pCO2)} > esperado → acidose respiratória associada (hipoventilação).`); }
    else if (pCO2 < esp - 2) { compFrase = "alcalose respiratória associada"; associadoResp = compFrase; passos.push(`pCO₂ real ${f(pCO2)} < esperado → alcalose respiratória associada (hiperventilação).`); }
    else { compFrase = "compensação respiratória adequada"; passos.push(`pCO₂ real ${f(pCO2)} dentro do esperado → compensação respiratória adequada.`); }
  } else if (primario === "alcalose metabólica") {
    const esp = 0.7 * HCO3 + 20;
    passos.push(`Compensação: pCO₂ esperado = 0,7×${f(HCO3)} + 20 = ${f(esp)} ± 5 mmHg.`);
    if (pCO2 > esp + 5) { compFrase = "acidose respiratória associada"; associadoResp = compFrase; }
    else if (pCO2 < esp - 5) { compFrase = "alcalose respiratória associada"; associadoResp = compFrase; }
    else { compFrase = "compensação respiratória adequada"; }
    passos.push(`pCO₂ real ${f(pCO2)} → ${compFrase}.`);
  } else if (primario === "acidose respiratória") {
    const d = (pCO2 - 40) / 10;
    const espAgudo = 24 + 1 * d, espCronico = 24 + 3.5 * d;
    passos.push(`HCO₃ esperado — agudo: 24 + 1×${f(d)} = ${f(espAgudo)}; crônico: 24 + 3,5×${f(d)} = ${f(espCronico)} mEq/L.`);
    if (HCO3 <= espAgudo + 1.5) cronicidade = "aguda";
    else if (HCO3 >= espCronico - 1.5) cronicidade = "crônica";
    else cronicidade = "aguda sobre crônica";
    passos.push(`HCO₃ real ${f(HCO3)} → ${cronicidade}.`);
    compFrase = "compensação metabólica " + (cronicidade === "aguda" ? "ainda incipiente" : "adequada");
  } else if (primario === "alcalose respiratória") {
    const d = (40 - pCO2) / 10;
    const espAgudo = 24 - 2 * d, espCronico = 24 - 4.5 * d;
    passos.push(`HCO₃ esperado — agudo: 24 − 2×${f(d)} = ${f(espAgudo)}; crônico: 24 − 4,5×${f(d)} = ${f(espCronico)} mEq/L.`);
    if (HCO3 >= espAgudo - 1.5) cronicidade = "aguda";
    else if (HCO3 <= espCronico + 1.5) cronicidade = "crônica";
    else cronicidade = "aguda sobre crônica";
    passos.push(`HCO₃ real ${f(HCO3)} → ${cronicidade}.`);
    compFrase = "compensação metabólica " + (cronicidade === "aguda" ? "ainda incipiente" : "adequada");
  }

  // 4. Ânion gap (com Na e Cl)
  let agAumentado = false;
  let associadoDD = "";
  if (i.Na != null && i.Cl != null) {
    const ag = i.Na - (i.Cl + HCO3);
    let agUsado = ag;
    if (i.albumina != null) {
      const agc = ag + 2.5 * (4 - i.albumina);
      passos.push(`Ânion gap = ${f(i.Na)} − (${f(i.Cl)} + ${f(HCO3)}) = ${f(ag)} mEq/L. Corrigido p/ albumina ${f(i.albumina)}: ${f(ag)} + 2,5×(4−${f(i.albumina)}) = ${f(agc)} mEq/L (normal 8–12).`);
      agUsado = agc;
    } else {
      passos.push(`Ânion gap = ${f(i.Na)} − (${f(i.Cl)} + ${f(HCO3)}) = ${f(ag)} mEq/L (normal 8–12).`);
    }
    agAumentado = agUsado > 12;
    if (agAumentado && primario.includes("metabólica")) {
      const dd = (agUsado - 12) / (24 - HCO3);
      passos.push(`AG aumentado → delta-delta = (${f(agUsado)}−12)/(24−${f(HCO3)}) = ${f(dd, 2)}.`);
      if (dd < 0.4) { associadoDD = "acidose hiperclorêmica (AG normal) associada"; passos.push("Delta-delta < 0,4 → acidose hiperclorêmica associada."); }
      else if (dd > 2) { associadoDD = "alcalose metabólica associada"; passos.push("Delta-delta > 2 → alcalose metabólica associada (ou HCO₃ basal alto)."); }
      else passos.push("Delta-delta 0,4–2 → acidose por AG pura.");
    }
  }

  // 5. P/F (com pO2 e FiO2)
  if (i.pO2 != null && i.FiO2 != null && i.FiO2 > 0) {
    const fio2 = i.FiO2 > 1 ? i.FiO2 / 100 : i.FiO2;
    const pf = i.pO2 / fio2;
    let grav = "normal";
    if (pf <= 100) grav = "SDRA grave";
    else if (pf <= 200) grav = "SDRA moderada";
    else if (pf <= 300) grav = "SDRA leve";
    passos.push(`Relação P/F = ${f(i.pO2)} / ${f(fio2, 2)} = ${f(pf, 0)} → ${grav} (Berlin: ≤300 leve, ≤200 moderada, ≤100 grave).`);
    if (pf <= 300) causas.push(`Hipoxemia com P/F ${f(pf, 0)} (${grav}).`);
  }

  // 6. Lactato
  if (i.lactato != null && i.lactato > 2) {
    passos.push(`Lactato ${f(i.lactato)} mmol/L (> 2) → hipoperfusão / acidose lática.`);
    causas.push("Lactato elevado: sinal de hipoperfusão tecidual (choque, isquemia).");
  }

  // ----- Conclusão -----
  let conclusao = cap(primario);
  if (primario === "acidose metabólica" && (i.Na != null && i.Cl != null)) conclusao += agAumentado ? " de ânion gap aumentado" : " de ânion gap normal (hiperclorêmica)";
  if (cronicidade) conclusao += ` ${cronicidade}`;
  if (compFrase) conclusao += ` com ${compFrase}`;
  if (associadoDD) conclusao += ` e ${associadoDD}`;
  conclusao += ".";

  // ----- Causas prováveis -----
  if (primario === "acidose metabólica") {
    if (agAumentado) causas.push("AG aumentado: lactato, cetoacidose (diabética/alcoólica/jejum), uremia (DRC), intoxicações — metanol, etilenoglicol, salicilatos, paracetamol (MUDPILES).");
    if (!agAumentado || associadoDD.includes("hiperclor")) causas.push("AG normal (hiperclorêmica): diarreia, acidose tubular renal (ATR), excesso de SF 0,9%, fístula digestiva, inibidores da anidrase carbônica.");
  } else if (primario === "alcalose metabólica") {
    causas.push("Alcalose metabólica: vômitos/SNG, diuréticos, hipovolemia (cloro-responsiva), hiperaldosteronismo, reposição excessiva de bicarbonato.");
  } else if (primario === "acidose respiratória") {
    causas.push("Hipoventilação: DPOC, depressão do SNC (opioides/sedativos), fraqueza neuromuscular, obstrução de via aérea, fadiga ventilatória.");
  } else if (primario === "alcalose respiratória") {
    causas.push("Hiperventilação: dor/ansiedade, sepse, TEP, hipóxia, febre, gravidez, salicilato (fase inicial), doença do SNC.");
  }
  if (associadoResp.includes("acidose respiratória")) causas.push("Componente respiratório (hipoventilação) somado — atenção à ventilação.");

  // ----- Bandeiras críticas (vermelho) -----
  if (pH < 7.1) bandeiras.push(`pH ${f(pH, 2)} < 7,1 — acidemia grave (considerar suporte/bicarbonato conforme a causa).`);
  if (pH > 7.6) bandeiras.push(`pH ${f(pH, 2)} > 7,6 — alcalemia grave.`);
  if (i.K != null && (i.K < 3 || i.K > 6)) bandeiras.push(`K⁺ ${f(i.K)} fora de 3–6 mEq/L — risco de arritmia.`);
  if (i.lactato != null && i.lactato > 4) bandeiras.push(`Lactato ${f(i.lactato)} > 4 mmol/L — hipoperfusão grave.`);

  return { ok: true, conclusao, passos, causas, bandeiras, fonte };
}
