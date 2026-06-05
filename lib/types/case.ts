// ===== Esquema clinico do caso (intake) =====

export type QuestionType =
  | "INTERPRETAR_ECG"
  | "ARRITMIA"
  | "CARDIOVERSAO"
  | "PCR_ACLS"
  | "IOT_SRI"
  | "CHOQUE_SEPSE"
  | "NEURO_AVC"
  | "INTOXICACAO"
  | "TRAUMA"
  | "IAM_DOR_TORACICA"
  | "OUTRO";

export type QuestionMeta = {
  key: QuestionType;
  label: string;
  short: string;
  icon: string; // nome do icone lucide
  // perguntas-modelo (chips) por tipo
  presets: string[];
};

// Grade de entrada da home + defaults de pergunta por cenario.
export const QUESTION_TYPES: QuestionMeta[] = [
  {
    key: "INTERPRETAR_ECG",
    label: "Interpretar ECG",
    short: "ECG",
    icon: "Activity",
    presets: ["Qual o ritmo/diagnostico?", "Tem supra de ST?", "Conduta para esse ECG?"],
  },
  {
    key: "ARRITMIA",
    label: "Arritmia",
    short: "Arritmia",
    icon: "HeartPulse",
    presets: ["Qual a conduta?", "Droga e dose?", "Precisa cardioverter?"],
  },
  {
    key: "CARDIOVERSAO",
    label: "Cardioversao",
    short: "CVE",
    icon: "Zap",
    presets: ["Cardioverter? Qual energia?", "Sincronizar?", "Sedacao para o procedimento?"],
  },
  {
    key: "PCR_ACLS",
    label: "PCR / ACLS",
    short: "PCR",
    icon: "HeartCrack",
    presets: ["Ritmo chocavel?", "Proxima droga?", "Causas reversiveis (5H/5T)?"],
  },
  {
    key: "IOT_SRI",
    label: "Via aerea / SRI",
    short: "SRI",
    icon: "Wind",
    presets: ["Sequencia e doses (SRI)?", "Indutor no choque?", "Parametros pos-IOT?"],
  },
  {
    key: "CHOQUE_SEPSE",
    label: "Choque / Sepse",
    short: "Choque",
    icon: "Droplet",
    presets: ["Volume e vasopressor?", "Alvo de PAM?", "ATB empirico?"],
  },
  {
    key: "NEURO_AVC",
    label: "Neuro / AVC",
    short: "Neuro",
    icon: "Brain",
    presets: ["Janela de trombolise?", "Conduta no rebaixamento?", "Crise convulsiva?"],
  },
  {
    key: "INTOXICACAO",
    label: "Intoxicacao",
    short: "Intox",
    icon: "FlaskConical",
    presets: ["Tem antidoto?", "Conduta de suporte?", "Descontaminacao?"],
  },
  {
    key: "TRAUMA",
    label: "Trauma grave",
    short: "Trauma",
    icon: "Bone",
    presets: ["Controle de hemorragia?", "Transfusao macica?", "Sequencia de prioridades?"],
  },
  {
    key: "IAM_DOR_TORACICA",
    label: "IAM / Dor toracica",
    short: "IAM",
    icon: "Heart",
    presets: ["Supra de ST -> reperfusao?", "Carga de antiagregantes?", "Anticoagulacao?"],
  },
  {
    key: "OUTRO",
    label: "Outro",
    short: "Outro",
    icon: "CircleHelp",
    presets: ["Descreva o caso e a duvida."],
  },
];

export function questionMeta(key: string): QuestionMeta {
  return QUESTION_TYPES.find((q) => q.key === key) ?? QUESTION_TYPES[QUESTION_TYPES.length - 1];
}

export type Sexo = "M" | "F" | "O";

export type RitmoMonitor =
  | "SINUSAL"
  | "FA"
  | "FLUTTER"
  | "TSV"
  | "TV_MONO"
  | "TV_POLI"
  | "FV"
  | "ASSISTOLIA"
  | "AESP"
  | "BAV_2_3"
  | "BRADI_SINUSAL"
  | "INDETERMINADO";

export const RITMOS: { key: RitmoMonitor; label: string }[] = [
  { key: "SINUSAL", label: "Sinusal" },
  { key: "FA", label: "FA" },
  { key: "FLUTTER", label: "Flutter" },
  { key: "TSV", label: "TSV" },
  { key: "TV_MONO", label: "TV mono" },
  { key: "TV_POLI", label: "TV poli" },
  { key: "FV", label: "FV" },
  { key: "ASSISTOLIA", label: "Assistolia" },
  { key: "AESP", label: "AESP" },
  { key: "BAV_2_3", label: "BAV 2/3" },
  { key: "BRADI_SINUSAL", label: "Bradi sinusal" },
  { key: "INDETERMINADO", label: "Indeterminado" },
];

// Bloco de sinais vitais (todos opcionais).
export type Vitais = {
  paSys?: number;
  paDia?: number;
  fc?: number;
  fr?: number;
  satO2?: number;
  tax?: number;
  glicemia?: number;
  glasgow?: number;
  ritmo?: RitmoMonitor;
};

// Payload enviado ao criar um caso.
export type NewCaseInput = {
  question_type: QuestionType;
  question_text: string;
  clinical_summary: string;
  patient_ref?: string;
  patient_age?: number;
  patient_sex?: Sexo;
  patient_weight_kg?: number;
  vitals?: Vitais;
  image_urls?: { url: string; kind: "ecg" | "other" }[];
};
