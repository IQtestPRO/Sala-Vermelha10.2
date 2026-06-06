import { Client } from "@libsql/client";
import { CaseRow, CaseImageRow, ResponseRow, MessageRow } from "./db";
import { newId } from "./ids";
import { Vitais } from "./types/case";
import { StructuredConduct } from "./types/answer";

export function jstr(value: unknown): string | null {
  if (value == null) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export function jparse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

// Insere uma linha de auditoria (case_events).
export async function insertEvent(
  db: Client,
  caseId: string,
  actorId: string | null,
  eventType: string,
  payload?: unknown
) {
  await db.execute({
    sql: `INSERT INTO case_events (id, case_id, actor_id, event_type, payload, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [newId("ev"), caseId, actorId, eventType, jstr(payload), Date.now()],
  });
}

// ===== Shapes publicos (para o cliente) =====
export type PublicCase = Omit<CaseRow, "vitals" | "ai_analysis"> & {
  vitals: Vitais | null;
  ai_analysis: Record<string, unknown> | null;
};
export type PublicResponse = Omit<ResponseRow, "structured_conduct"> & {
  structured_conduct: StructuredConduct | null;
};

export function toPublicCase(row: CaseRow): PublicCase {
  return {
    ...row,
    vitals: jparse<Vitais>(row.vitals),
    ai_analysis: jparse<Record<string, unknown>>(row.ai_analysis),
  };
}
export function toPublicResponse(row: ResponseRow): PublicResponse {
  return { ...row, structured_conduct: jparse<StructuredConduct>(row.structured_conduct) };
}

export type CaseDetail = {
  case: PublicCase;
  images: CaseImageRow[];
  responses: PublicResponse[];
  messages: MessageRow[];
  serverNow: number;
};

// Varredura preguicosa: marca como 'expired' os casos 'open' vencidos.
// Roda em cada leitura da fila para garantir o SLA mesmo sem cron de 1 min.
// Retorna as linhas que acabaram de expirar (para escalonar push).
export async function expireOverdueOpenCases(db: Client): Promise<CaseRow[]> {
  const now = Date.now();
  const overdue = await db.execute({
    sql: `SELECT * FROM cases WHERE status = 'open' AND sla_expires_at <= ? LIMIT 200`,
    args: [now],
  });
  const rows = overdue.rows as unknown as CaseRow[];
  const expired: CaseRow[] = [];
  for (const c of rows) {
    const res = await db.execute({
      sql: `UPDATE cases SET status = 'expired', closed_at = ? WHERE id = ? AND status = 'open'`,
      args: [now, c.id],
    });
    if (res.rowsAffected === 1) {
      await insertEvent(db, c.id, null, "expired", { at: now });
      await insertEvent(db, c.id, null, "escalated", { reason: "sla_breach" });
      expired.push(c);
    }
  }
  return expired;
}
