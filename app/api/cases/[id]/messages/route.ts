import { NextRequest, NextResponse } from "next/server";
import { getDb, CaseRow } from "@/lib/db";
import { requireUser, AuthError, errorResponse } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { insertEvent } from "@/lib/cases";
import { sendToUser } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    const db = getDb();
    const body = await req.json();
    const text = String(body.body || "").trim();
    if (!text) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

    const cr = await db.execute({ sql: `SELECT * FROM cases WHERE id=?`, args: [id] });
    if (cr.rows.length === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const caseRow = cr.rows[0] as unknown as CaseRow;

    const isOwner = caseRow.requester_id === user.id;
    const isApprovedResponder = user.role === "responder" && user.status === "approved";
    if (!isOwner && !isApprovedResponder) throw new AuthError(403, "forbidden");

    const now = Date.now();
    const msgId = newId("m");
    await db.execute({
      sql: `INSERT INTO messages (id, case_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [msgId, id, user.id, text, now],
    });
    await insertEvent(db, id, user.id, "message");

    // Notifica a outra parte.
    const target = isOwner ? caseRow.claimed_by : caseRow.requester_id;
    if (target) {
      try {
        await sendToUser(db, target, {
          title: "Nova mensagem no caso",
          body: text.slice(0, 80),
          caseId: id,
          url: `/case/${id}`,
        });
      } catch (e) {
        console.error("[push message]", e);
      }
    }

    return NextResponse.json({ message_id: msgId });
  } catch (err) {
    return errorResponse(err);
  }
}
