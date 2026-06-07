import type { Infusao } from "./condutas";

// Drogas em infusão contínua (bomba) p/ a Calculadora. Reusa o tipo Infusao
// e o cálculo calcInfusao (mL/h por peso). Diluições padrão — conferir protocolo local.
export type DrogaInfusao = { nome: string; classe: string; infusao: Infusao };

export const DROGAS_INFUSAO: DrogaInfusao[] = [
  {
    nome: "Noradrenalina",
    classe: "Vasopressor",
    infusao: { diluicao: "16 mg (4 amp 4 mg/4 mL) + 234 mL SG 5% = 250 mL", concentracao: "64 mcg/mL", concMcgMl: 64, unidade: "mcg/kg/min", faixa: { min: 0.05, max: 0.5 }, inicio: "0,05–0,1 mcg/kg/min", titulacao: "titular até PAM ≥ 65", gatilho: "choque (1ª linha)" },
  },
  {
    nome: "Adrenalina",
    classe: "Vasopressor / inotrópico",
    infusao: { diluicao: "4 mg (4 amp 1 mg/mL) + 246 mL SG 5% = 250 mL", concentracao: "16 mcg/mL", concMcgMl: 16, unidade: "mcg/kg/min", faixa: { min: 0.02, max: 0.5 }, inicio: "0,02–0,05 mcg/kg/min", titulacao: "titular ao efeito" },
  },
  {
    nome: "Dopamina",
    classe: "Vasopressor / cronotrópico",
    infusao: { diluicao: "250 mg (5 amp 50 mg/10 mL) + 200 mL SG 5% = 250 mL", concentracao: "1.000 mcg/mL", concMcgMl: 1000, unidade: "mcg/kg/min", faixa: { min: 5, max: 20 }, inicio: "5 mcg/kg/min", titulacao: "FC/PA (máx ~20)" },
  },
  {
    nome: "Dobutamina",
    classe: "Inotrópico",
    infusao: { diluicao: "250 mg (1 amp 250 mg/20 mL) + 230 mL SG 5% = 250 mL", concentracao: "1.000 mcg/mL", concMcgMl: 1000, unidade: "mcg/kg/min", faixa: { min: 2.5, max: 20 }, inicio: "2,5–5 mcg/kg/min", titulacao: "débito/perfusão" },
  },
  {
    nome: "Vasopressina",
    classe: "Vasopressor (2ª linha)",
    infusao: { diluicao: "20 UI (1 amp) + 100 mL SF 0,9% = 0,2 UI/mL", concentracao: "0,2 UI/mL", concUiMl: 0.2, unidade: "UI/min", faixa: { min: 0.03 }, inicio: "0,03 UI/min", titulacao: "dose FIXA (não titula)", gatilho: "NA ~0,25–0,5 mcg/kg/min" },
  },
  {
    nome: "Nitroglicerina",
    classe: "Vasodilatador (venoso)",
    infusao: { diluicao: "50 mg + 240 mL SG 5% = 200 mcg/mL", concentracao: "200 mcg/mL", concMcgMl: 200, unidade: "mcg/min", faixa: { min: 5, max: 200 }, inicio: "5–10 mcg/min", titulacao: "subir 5–10 a cada 5 min (dor/PA)", gatilho: "SCA, EAP, emergência hipertensiva" },
  },
  {
    nome: "Nitroprussiato de sódio",
    classe: "Vasodilatador (arterial)",
    infusao: { diluicao: "50 mg + 248 mL SG 5% = 200 mcg/mL (fotoproteção)", concentracao: "200 mcg/mL", concMcgMl: 200, unidade: "mcg/kg/min", faixa: { min: 0.3, max: 10 }, inicio: "0,3–0,5 mcg/kg/min", titulacao: "titular PA (máx 10; risco de cianeto)", gatilho: "emergência hipertensiva" },
  },
  {
    nome: "Amiodarona (manutenção)",
    classe: "Antiarrítmico",
    infusao: { diluicao: "900 mg (6 amp 150 mg/3 mL) + 500 mL SG 5% = 1,8 mg/mL", concentracao: "1,8 mg/mL", concMgMl: 1.8, unidade: "mg/min", faixa: { min: 0.5, max: 1 }, inicio: "1 mg/min × 6 h, depois 0,5 mg/min × 18 h", titulacao: "fases fixas (máx 2,2 g/24 h)" },
  },
  {
    nome: "Diltiazem (manutenção)",
    classe: "Controle de FC (FA)",
    infusao: { diluicao: "100 mg + 100 mL SF 0,9% = 1 mg/mL", concentracao: "1 mg/mL", concMgMl: 1, unidade: "mg/h", faixa: { min: 5, max: 15 }, inicio: "5 mg/h", titulacao: "titular FC (5–15 mg/h)" },
  },
  {
    nome: "Fentanil (sedoanalgesia)",
    classe: "Opioide (BIC)",
    infusao: { diluicao: "puro 50 mcg/mL (ou 1.000 mcg + 80 mL SF = 10 mcg/mL)", concentracao: "50 mcg/mL", concMcgMl: 50, unidade: "mcg/kg/h", faixa: { min: 0.5, max: 2 }, inicio: "0,5–1 mcg/kg/h", titulacao: "RASS / dor" },
  },
  {
    nome: "Midazolam (sedação)",
    classe: "Benzodiazepínico (BIC)",
    infusao: { diluicao: "50 mg + 50 mL SF 0,9% = 1 mg/mL", concentracao: "1 mg/mL", concMgMl: 1, unidade: "mg/kg/h", faixa: { min: 0.02, max: 0.2 }, inicio: "0,02–0,06 mg/kg/h", titulacao: "RASS-alvo" },
  },
  {
    nome: "Propofol (sedação)",
    classe: "Hipnótico (BIC)",
    infusao: { diluicao: "puro 1% = 10 mg/mL", concentracao: "10 mg/mL", concMgMl: 10, unidade: "mg/kg/h", faixa: { min: 1, max: 4 }, inicio: "1 mg/kg/h", titulacao: "RASS (máx ~4; risco de PRIS/hipotensão)" },
  },
];
