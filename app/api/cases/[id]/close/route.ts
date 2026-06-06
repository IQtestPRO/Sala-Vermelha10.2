import { NextRequest, NextResponse } from "next/server";
import { getDb, CaseRow } from "@/lib/db";
import { requireUser, AuthError, errorResponse } from "@/lib/auth";
import { insertEvent } from "@/lib/cases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    const db = getDb();

    const cr = await db.execute({ sql: `SELECT * FROM cases WHERE id=?`, args: [id] });
    if (cr.rows.length === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const caseRow = cr.rows[0] as unknown as CaseRow;

    if (caseRow.requester_id !== user.id && user.role !== "admin") {
      throw new AuthError(403, "forbidden");
    }

    const now = Date.now();
    // Idempotente: nao re-fecha um caso ja 'closed' (evita evento duplicado / no-op silencioso).
    const res = await db.execute({
      sql: `UPDATE cases SET status='closed', closed_at=? WHERE id=? AND status != 'closed'`,
      args: [now, id],
    });
    if (res.rowsAffected === 1) {
      await insertEvent(db, id, user.id, "closed");
    }

    return NextResponse.json({ ok: true, alreadyClosed: res.rowsAffected === 0 });
  } catch (err) {
    return errorResponse(err);
  }
}
