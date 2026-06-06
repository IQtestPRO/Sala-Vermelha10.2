import webpush from "web-push";
import { Client } from "@libsql/client";
import type { CaseRow } from "./db";

export type PushPayload = {
  title: string;
  body: string;
  caseId?: string;
  url?: string;
};

type SubRow = { id: string; endpoint: string; p256dh: string; auth: string };

let configured: boolean | null = null;

function ensureConfigured(): boolean {
  if (configured !== null) return configured;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:contato@emergenciaem10.app";
  if (pub && priv) {
    try {
      webpush.setVapidDetails(subject, pub, priv);
      configured = true;
    } catch {
      configured = false;
    }
  } else {
    configured = false;
  }
  return configured;
}

export function pushConfigured(): boolean {
  return ensureConfigured();
}

async function sendToRows(db: Client, rows: SubRow[], payload: PushPayload) {
  if (!ensureConfigured() || rows.length === 0) return;
  const data = JSON.stringify(payload);
  await Promise.allSettled(
    rows.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data,
          { urgency: "high", TTL: 600 }
        );
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          // Subscription morta -> remove para nao acumular.
          await db.execute({
            sql: "DELETE FROM push_subscriptions WHERE endpoint = ?",
            args: [s.endpoint],
          });
        }
      }
    })
  );
}

// Notifica todos os respondedores aprovados (fan-out de caso novo / escalonamento).
export async function sendToApprovedResponders(db: Client, payload: PushPayload) {
  if (!ensureConfigured()) return;
  const r = await db.execute(`
    SELECT ps.id, ps.endpoint, ps.p256dh, ps.auth
    FROM push_subscriptions ps
    JOIN users u ON u.id = ps.user_id
    WHERE u.role = 'responder' AND u.status = 'approved'
  `);
  await sendToRows(db, r.rows as unknown as SubRow[], payload);
}

// Notifica um usuario especifico (ex.: solicitante quando o caso e respondido).
export async function sendToUser(db: Client, userId: string, payload: PushPayload) {
  if (!ensureConfigured()) return;
  const r = await db.execute({
    sql: "SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?",
    args: [userId],
  });
  await sendToRows(db, r.rows as unknown as SubRow[], payload);
}

// Escalonamento de SLA: para casos que acabaram de expirar (10 min sem resposta),
// avisa todos os plantonistas aprovados + o solicitante. Chamado pela varredura
// preguicosa (expireOverdueOpenCases retorna apenas os casos recem-expirados, entao
// cada caso e escalonado uma unica vez).
export async function escalateExpiredCases(db: Client, expired: CaseRow[]) {
  if (!ensureConfigured() || expired.length === 0) return;
  for (const c of expired) {
    try {
      await sendToApprovedResponders(db, {
        title: "SLA EXPIRADO — caso sem resposta",
        body: "Um caso está sem resposta. Abra a fila agora.",
        caseId: c.id,
        url: `/case/${c.id}`,
      });
      await sendToUser(db, c.requester_id, {
        title: "Caso escalonado",
        body: "Seu caso foi escalonado para todos os plantonistas.",
        caseId: c.id,
        url: `/case/${c.id}`,
      });
    } catch (e) {
      console.error("[escalate]", e);
    }
  }
}
