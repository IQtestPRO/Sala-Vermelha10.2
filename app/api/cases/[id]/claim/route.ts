import { NextRequest, NextResponse } from "next/server";
import { getDb, CaseRow } from "@/lib/db";
import { requireApprovedResponder, errorResponse } from "@/lib/auth";
import { insertEvent, toPublicCase } from "@/lib/cases";
import { sendToUser } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const me = await requireApprovedResponder(req);
    const { id } = await ctx.params;
    const db = getDb();
    const now = Date.now();

    // Claim atomico: so vence quem pegar enquanto ainda esta 'open'.
    const upd = await db.execute({
      sql: `UPDATE cases SET status='claimed', claimed_by=?, claimed_at=? WHERE id=? AND status='open'`,
      args: [me.id, now, id],
    });
    if (upd.rowsAffected !== 1) {
      const ex = await db.execute({ sql: `SELECT status FROM cases WHERE id=?`, args: [id] });
      if (ex.rows.length === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
      return NextResponse.json({ error: "already_claimed" }, { status: 409 });
    }

    await insertEvent(db, id, me.id, "claimed");
    const cr = await db.execute({ sql: `SELECT * FROM cases WHERE id=?`, args: [id] });
    const caseRow = cr.rows[0] as unknown as CaseRow;

    try {
      await sendToUser(db, caseRow.requester_id, {
        title: "Plantonista assumiu seu caso",
        body: `${me.name} (${me.specialty}) está avaliando.`,
        caseId: id,
        url: `/case/${id}`,
      });
    } catch (e) {
      console.error("[push claim]", e);
    }

    return NextResponse.json({ case: toPublicCase(caseRow) });
  } catch (err) {
    return errorResponse(err);
  }
}
