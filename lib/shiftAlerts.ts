import type { Client } from "@libsql/client";
import { newId } from "./ids";
import { pushConfigured, sendToUser } from "./push";

/* AUTOMAÇÕES DE PLANTÃO — varredura PREGUIÇOSA (mesmo padrão do SLA; sem cron).
   Disparada nas rotas quentes (/api/shifts GET e /api/auth/me) com gate de 15 min
   por usuário. Idempotente: 1 registro por (shift, tipo) em shift_alerts; o tipo
   'pagamento' reenvia no máximo 1x por semana (UPDATE de sent_at). */

const GATE_MS = 15 * 60_000;
const SEMANA_MS = 7 * 24 * 3600_000;

type ShiftRow = { id: string; data: string; inicio: string | null; local: string | null; valor: number | null; pago: number; confirmado: number };

// Data/hora locais do plantão brasileiro (America/Sao_Paulo), sem dependência nova.
function agoraBRT(): { dataISO: string; minutos: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    dataISO: `${get("year")}-${get("month")}-${get("day")}`,
    minutos: Number(get("hour")) * 60 + Number(get("minute")),
  };
}
function diaSeguinte(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return dt.toISOString().slice(0, 10);
}
const hhmmParaMin = (s: string | null): number | null => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(s ?? ""));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

async function jaEnviado(db: Client, shiftId: string, type: string): Promise<{ sent_at: number } | null> {
  const r = await db.execute({ sql: "SELECT sent_at FROM shift_alerts WHERE shift_id=? AND type=?", args: [shiftId, type] });
  return r.rows.length ? { sent_at: Number(r.rows[0].sent_at) } : null;
}
async function marcar(db: Client, shiftId: string, userId: string, type: string): Promise<void> {
  await db.execute({
    sql: `INSERT INTO shift_alerts (id, shift_id, user_id, type, sent_at) VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(shift_id, type) DO UPDATE SET sent_at = excluded.sent_at`,
    args: [newId("sa"), shiftId, userId, type, Date.now()],
  });
}

export async function sweepShiftAlerts(db: Client, userId: string): Promise<void> {
  try {
    if (!pushConfigured()) return;

    // Gate de 15 min por usuário (registro sintético type='sweep').
    const gate = await jaEnviado(db, `sweep:${userId}`, "sweep");
    if (gate && Date.now() - gate.sent_at < GATE_MS) return;
    await marcar(db, `sweep:${userId}`, userId, "sweep");

    const { dataISO: hoje, minutos } = agoraBRT();
    const amanha = diaSeguinte(hoje);

    const r = await db.execute({
      sql: "SELECT id, data, inicio, local, valor, pago, confirmado FROM shifts WHERE user_id = ? AND data <= ? AND data >= date(?, '-60 day')",
      args: [userId, amanha, hoje],
    });
    const shifts = r.rows as unknown as ShiftRow[];

    for (const s of shifts) {
      const onde = s.local ? ` em ${s.local}` : "";
      const horario = s.inicio ? ` às ${s.inicio}` : "";

      // 1) Véspera (20h): lembrete com ação "Confirmar presença".
      if (s.data === amanha && minutos >= 20 * 60 && !(await jaEnviado(db, s.id, "vespera"))) {
        await sendToUser(db, userId, {
          title: "Plantão amanhã",
          body: `Você tem plantão amanhã${horario}${onde}. Confirma presença?`,
          url: "/plantao",
          tag: `shift-${s.id}`,
          shiftId: s.id,
          actions: [{ action: "confirmar", title: "Confirmar presença" }],
        });
        await marcar(db, s.id, userId, "vespera");
      }

      // 2) 2 horas antes do início.
      const ini = hhmmParaMin(s.inicio);
      if (s.data === hoje && ini != null && minutos >= ini - 120 && minutos < ini && !(await jaEnviado(db, s.id, "2h"))) {
        await sendToUser(db, userId, {
          title: "Plantão em breve",
          body: `Seu plantão começa às ${s.inicio}${onde}.`,
          url: "/plantao",
          tag: `shift-${s.id}`,
        });
        await marcar(db, s.id, userId, "2h");
      }

      // 3) Pagamento vencido (data passada + a receber): no máximo 1 push/semana.
      if (s.data < hoje && !s.pago && (s.valor ?? 0) > 0) {
        const prev = await jaEnviado(db, s.id, "pagamento");
        if (!prev || Date.now() - prev.sent_at > SEMANA_MS) {
          await sendToUser(db, userId, {
            title: "Pagamento pendente",
            body: `Plantão de ${s.data.slice(8, 10)}/${s.data.slice(5, 7)}${onde} segue a receber (R$ ${s.valor}).`,
            url: "/plantao",
            tag: `pgto-${s.id}`,
          });
          await marcar(db, s.id, userId, "pagamento");
        }
      }
    }
  } catch (e) {
    console.error("[shiftAlerts] sweep falhou (ignorado)", e);
  }
}
