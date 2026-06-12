import type { Client } from "@libsql/client";

/* MEMÓRIA CLÍNICA — a IA aprende com os casos ANTIGOS do próprio médico.
   Recuperação lexical (sem dependência de embeddings): tokeniza o caso novo,
   pontua casos/debriefs/conversas anteriores DO MESMO usuário por sobreposição
   de termos clínicos e injeta os top-3 no system prompt.
   LGPD: só dados do próprio médico, já pseudonimizados, nunca saem do servidor. */

const STOP = new Set([
  "para", "como", "com", "sem", "uma", "umas", "uns", "qual", "quais", "esta", "este", "isso", "essa", "esse",
  "anos", "ano", "dias", "dia", "horas", "hora", "min", "paciente", "caso", "quero", "saber", "aqui", "agora",
  "sobre", "pelo", "pela", "mais", "menos", "muito", "apos", "após", "ainda", "tem", "tinha", "estava", "esta",
  "fazer", "feito", "deu", "entrada", "quadro", "histórico", "historico", "refere", "relata", "apresenta",
]);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4 && !STOP.has(t));
}

function score(queryTerms: Set<string>, texto: string): number {
  const t = tokens(texto);
  if (!t.length) return 0;
  const present = new Set<string>();
  let occ = 0;
  for (const w of t) {
    if (queryTerms.has(w)) {
      present.add(w);
      occ++;
    }
  }
  return present.size + Math.min(occ, 10) * 0.05;
}

export type CasoSemelhante = { tipo: string; quando: string; texto: string; pontuacao: number };

const fmtData = (ts: number) => new Date(Number(ts)).toLocaleDateString("pt-BR");

export async function buscarCasosSemelhantes(db: Client, userId: string, consulta: string, limite = 3): Promise<CasoSemelhante[]> {
  try {
    const q = new Set(tokens(consulta));
    if (q.size < 2) return [];

    const candidatos: CasoSemelhante[] = [];

    // 1) Casos anteriores (com desfecho/análise quando houver).
    const cases = await db.execute({
      sql: `SELECT id, clinical_summary, question_text, status, ai_analysis, created_at
            FROM cases WHERE requester_id = ? OR claimed_by = ? ORDER BY created_at DESC LIMIT 200`,
      args: [userId, userId],
    });
    for (const r of cases.rows) {
      const resumo = String(r.clinical_summary || r.question_text || "");
      const s = score(q, resumo);
      if (s >= 2) {
        let extra = "";
        try {
          const a = r.ai_analysis ? JSON.parse(String(r.ai_analysis)) : null;
          if (a?.condutaImediata) extra = ` Conduta na época: ${String(a.condutaImediata).slice(0, 180)}.`;
        } catch {
          /* noop */
        }
        candidatos.push({
          tipo: "caso",
          quando: fmtData(Number(r.created_at)),
          texto: `${resumo.slice(0, 240)}${extra} (status: ${r.status})`,
          pontuacao: s,
        });
      }
    }

    // 2) Debriefs (a lição aprendida é o material mais valioso).
    const debs = await db.execute({
      sql: `SELECT d.resumo, d.conduta_executada, d.aderencia, d.pontos_melhoria, d.created_at
            FROM case_debriefs d WHERE d.user_id = ? ORDER BY d.created_at DESC LIMIT 100`,
      args: [userId],
    });
    for (const r of debs.rows) {
      const base = `${r.resumo ?? ""} ${r.conduta_executada ?? ""}`;
      const s = score(q, base);
      if (s >= 2) {
        let melhoria = "";
        try {
          const pm = r.pontos_melhoria ? JSON.parse(String(r.pontos_melhoria)) : [];
          if (Array.isArray(pm) && pm.length) melhoria = ` Oportunidade apontada no debrief: ${String(pm[0]).slice(0, 180)}.`;
        } catch {
          /* noop */
        }
        candidatos.push({
          tipo: "debrief",
          quando: fmtData(Number(r.created_at)),
          texto: `${String(r.resumo ?? "").slice(0, 220)} (aderência ${r.aderencia}).${melhoria}`,
          pontuacao: s + 0.5, // lição > registro bruto
        });
      }
    }

    // 3) Conversas anteriores com a STAT IA (pelo título).
    const chats = await db.execute({
      sql: "SELECT title, updated_at FROM chats WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100",
      args: [userId],
    });
    for (const r of chats.rows) {
      const s = score(q, String(r.title ?? ""));
      if (s >= 2) {
        candidatos.push({
          tipo: "conversa",
          quando: fmtData(Number(r.updated_at)),
          texto: `Discussão anterior: "${String(r.title).slice(0, 160)}"`,
          pontuacao: s - 0.5, // título só, menos contexto
        });
      }
    }

    return candidatos.sort((a, b) => b.pontuacao - a.pontuacao).slice(0, limite);
  } catch (e) {
    console.error("[memoriaClinica] busca falhou (ignorado)", e);
    return [];
  }
}

// Bloco pronto p/ injetar no system prompt da IA.
export function blocoMemoria(itens: CasoSemelhante[]): string {
  if (!itens.length) return "";
  const linhas = itens.map((c) => `- [${c.tipo} · ${c.quando}] ${c.texto}`).join("\n");
  return `\n\nMEMÓRIA CLÍNICA DO MÉDICO (casos/discussões ANTERIORES dele, semelhantes a este — pseudonimizados):\n${linhas}\nUse como CONTEXTO da experiência dele: quando for genuinamente relevante, mencione com naturalidade ("você conduziu um caso parecido em ..."), aproveite lições de debrief e mantenha coerência com o que funcionou. São pacientes DIFERENTES — nunca presuma que é o mesmo paciente nem copie condutas sem reavaliar o caso atual.`;
}
