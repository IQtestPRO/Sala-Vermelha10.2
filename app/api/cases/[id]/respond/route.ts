import { NextRequest, NextResponse } from "next/server";
import { getDb, CaseRow } from "@/lib/db";
import { requireApprovedResponder, AuthError, errorResponse } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { insertEvent, jstr } from "@/lib/cases";
import { sendToUser } from "@/lib/push";
import { NewResponseInput } from "@/lib/types/answer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireApprovedResponder(req);
    const { id } = await ctx.params;
    const db = getDb();
    const body = (await req.json()) as NewResponseInput;
    const text = String(body.body || "").trim();
    if (!text) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

    const cr = await db.execute({ sql: `SELECT * FROM cases WHERE id=?`, args: [id] });
    if (cr.rows.length === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const caseRow = cr.rows[0] as unknown as CaseRow;

    // So o plantonista que assumiu responde.
    if (caseRow.claimed_by !== me.id) throw new AuthError(403, "forbidden");

    const now = Date.now();
    const respId = newId("r");
    await db.execute({
      sql: `INSERT INTO responses (id, case_id, responder_id, body, structured_conduct, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [respId, id, me.id, text, jstr(body.structured_conduct), now],
    });

    // Primeira resposta marca 'answered'.
    const setAnsweredAt = caseRow.answered_at ? caseRow.answered_at : now;
    await db.execute({
      sql: `UPDATE cases SET status='answered', answered_at=? WHERE id=? AND status IN ('claimed','answered')`,
      args: [setAnsweredAt, id],
    });

    await insertEvent(db, id, me.id, "responded", { response_id: respId });

    try {
      await sendToUser(db, caseRow.requester_id, {
        title: "Resposta recebida",
        body: `${me.name} respondeu seu caso.`,
        caseId: id,
        url: `/case/${id}`,
      });
    } catch (e) {
      console.error("[push respond]", e);
    }

    return NextResponse.json({ response_id: respId });
  } catch (err) {
    return errorResponse(err);
  }
}
