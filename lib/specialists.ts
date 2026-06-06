import { condutaById, CondutaCard } from "@/lib/condutas";

// Base de conhecimento por condicao: um "agente especialista" fundamentado em
// evidencia (diretrizes), pesquisado/curado no build e embutido no prompt do /api/analyze.

export type SpecialistEvidence = {
  fato: string; // 1 linha decisiva (limiar/criterio/dose/energia)
  fonte: string; // nome da diretriz/fonte (ex.: "AHA/ACLS 2020")
};

export type SpecialistConfig = {
  condutaId: string;
  papel: string; // injetado verbatim ("cardiologista emergencista, especialista em ...")
  evidencias: SpecialistEvidence[];
  oQueLer: string[]; // o que olhar NA IMAGEM para esta condicao
  redFlags: string[];
  acaoPrioritaria: string; // a acao imediata mais decisiva (semeia condutaImediata)
  fontes: string[]; // nomes das diretrizes (dedup) — semeia o campo "fontes" da resposta
};

// Preenchido pela pesquisa (workflow). Enquanto vazio, todas as condicoes usam o
// fallback abaixo (a partir do proprio card em lib/condutas.ts) — o app ja funciona.
export const SPECIALISTS: Record<string, SpecialistConfig> = {};

export function specialistByCondutaId(id: string): SpecialistConfig | undefined {
  return SPECIALISTS[id];
}

// Fallback: sintetiza um especialista a partir do proprio card (acaoRapida/doses/alertas/referencia).
export function fallbackSpecialist(card: CondutaCard): SpecialistConfig {
  const evid: SpecialistEvidence[] = [];
  if (card.acaoRapida) {
    card.acaoRapida.passos.forEach((p) =>
      evid.push({
        fato: `${p.acao}${p.ampola ? " — " + p.ampola : ""}${p.repetir ? " (" + p.repetir + ")" : ""}`,
        fonte: card.referencia,
      })
    );
    if (card.acaoRapida.seRefratario) {
      evid.push({ fato: `Refratário: ${card.acaoRapida.seRefratario}`, fonte: card.referencia });
    }
  }
  card.doses.slice(0, 6).forEach((d) =>
    evid.push({
      fato: `${d.farmaco}: ${d.dose}${d.via ? " " + d.via : ""}${d.obs ? " — " + d.obs : ""}`,
      fonte: card.referencia,
    })
  );
  (card.energia ?? []).forEach((e) => evid.push({ fato: `Energia: ${e}`, fonte: card.referencia }));

  return {
    condutaId: card.id,
    papel: `médico emergencista sênior, especialista em ${card.titulo}`,
    evidencias: evid,
    oQueLer: ["FC", "ritmo/traçado", "SpO2", "PA/PNI", "FR", "Tax", "glicemia", "alarmes visíveis"],
    redFlags: card.alertas.slice(0, 5),
    acaoPrioritaria: card.acaoRapida?.gatilho
      ? `${card.acaoRapida.gatilho} → ${card.acaoRapida.passos[0]?.acao ?? "agir conforme conduta"}`
      : card.resumo ?? `Conduzir conforme o protocolo de ${card.titulo}`,
    fontes: [card.referencia],
  };
}

// Sempre devolve um especialista usavel (curado > fallback do card). null = id desconhecido.
export function resolveSpecialist(condutaId: string): SpecialistConfig | null {
  const curated = specialistByCondutaId(condutaId);
  if (curated) return curated;
  const card = condutaById(condutaId);
  if (card) return fallbackSpecialist(card);
  return null;
}
