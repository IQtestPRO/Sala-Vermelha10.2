// Motor de escores clínicos (data-driven). Cada escore é só DADOS; o componente
// ScoreCalculator renderiza e soma. Conteúdo autorado + verificado por workflow.

export type ScoreOpcao = { label: string; pontos: number };
export type ScoreItem = {
  label: string;
  tipo: "opcoes" | "numero";
  opcoes?: ScoreOpcao[]; // tipo "opcoes"
  min?: number; // tipo "numero"
  max?: number;
  coef?: number; // pontos por unidade (tipo "numero")
  ajuda?: string;
};
export type ScoreFaixa = { min: number; max?: number; rotulo: string; cor: "green" | "amber" | "red" };
export type ScoreDef = {
  id: string;
  nome: string;
  categoria: string;
  descricao?: string;
  itens: ScoreItem[];
  faixas: ScoreFaixa[];
  fonte?: string;
};

// Populado pelo workflow de verificação (lib/scores.data.ts gerado).
export { SCORES } from "./scores.data";

export function scoreById(id: string, scores: ScoreDef[]): ScoreDef | undefined {
  return scores.find((s) => s.id === id);
}

export function faixaDoTotal(def: ScoreDef, total: number): ScoreFaixa | undefined {
  return def.faixas.find((f) => total >= f.min && (f.max == null || total <= f.max));
}
