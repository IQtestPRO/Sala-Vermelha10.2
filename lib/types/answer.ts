// ===== Resposta estruturada do especialista =====

export type Destino =
  | "MANTER_SALA_VERMELHA"
  | "UTI"
  | "HEMODINAMICA"
  | "CENTRO_CIRURGICO"
  | "ENFERMARIA"
  | "TRANSFERENCIA"
  | "OBSERVACAO";

export const DESTINOS: { key: Destino; label: string }[] = [
  { key: "MANTER_SALA_VERMELHA", label: "Manter sala vermelha" },
  { key: "UTI", label: "UTI" },
  { key: "HEMODINAMICA", label: "Hemodinamica" },
  { key: "CENTRO_CIRURGICO", label: "Centro cirurgico" },
  { key: "ENFERMARIA", label: "Enfermaria" },
  { key: "TRANSFERENCIA", label: "Transferencia" },
  { key: "OBSERVACAO", label: "Observacao" },
];

export type Confianca = "ALTA" | "MEDIA" | "PRECISA_MAIS_DADOS";

export type StructuredConduct = {
  conduta?: string[]; // passos recomendados
  drogas?: { farmaco: string; dose: string; via?: string; obs?: string }[];
  energia?: string; // cardioversao/desfibrilacao
  exames?: string[];
  destino?: Destino;
  condutasReferenciadas?: string[]; // ids de lib/condutas.ts
  redFlags?: string[];
  confianca?: Confianca;
  pedidoDeDados?: string;
};

export type NewResponseInput = {
  body: string;
  structured_conduct?: StructuredConduct;
};
