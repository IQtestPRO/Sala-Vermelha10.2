import type { Client } from "@libsql/client";
import { newId } from "./ids";

export type LogbookKind = "caso_criado" | "caso_respondido" | "pcr_conduzida" | "conduta_consultada_aplicada";

/* Registro automático do portfólio do médico. BEST-EFFORT: nunca derruba o fluxo
   principal (criar caso/responder/finalizar PCR). Conteúdo pseudonimizado — o título
   vem do resumo clínico (sem nome/CPF/prontuário, regra do produto). */
export async function logbookAdd(
  db: Client,
  e: { userId: string; kind: LogbookKind; caseId?: string | null; titulo: string; meta?: Record<string, unknown> }
): Promise<void> {
  try {
    await db.execute({
      sql: `INSERT INTO logbook_entries (id, user_id, kind, case_id, titulo, meta, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        newId("lb"),
        e.userId,
        e.kind,
        e.caseId ?? null,
        e.titulo.slice(0, 200),
        e.meta ? JSON.stringify(e.meta) : null,
        Date.now(),
      ],
    });
  } catch (err) {
    console.error("[logbook] add falhou (ignorado)", err);
  }
}
