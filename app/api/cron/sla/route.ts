import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb } from "@/lib/db";
import { requireCron } from "@/lib/auth";
import { expireOverdueOpenCases } from "@/lib/cases";
import { sendToApprovedResponders, sendToUser } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vercel cron (a cada minuto). Fail-closed: sem CRON_SECRET -> 401.
export async function GET(req: NextRequest) {
  if (!requireCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    await ensureTables();
    const db = getDb();
    const expired = await expireOverdueOpenCases(db);

    for (const c of expired) {
      try {
        await sendToApprovedResponders(db, {
          title: "SLA EXPIRADO — caso sem resposta",
          body: "Caso de emergência sem resposta há 10 min. Avalie agora.",
          caseId: c.id,
          url: `/case/${c.id}`,
        });
        await sendToUser(db, c.requester_id, {
          title: "Caso escalonado",
          body: "Sem resposta em 10 min — todos os plantonistas foram avisados.",
          caseId: c.id,
          url: `/case/${c.id}`,
        });
      } catch (e) {
        console.error("[cron push]", e);
      }
    }

    return NextResponse.json({ ok: true, expired: expired.length });
  } catch (err) {
    console.error("[api/cron/sla]", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
