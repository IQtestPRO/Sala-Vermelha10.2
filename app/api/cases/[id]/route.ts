import { NextRequest, NextResponse } from "next/server";
import { getDb, CaseRow, CaseImageRow, ResponseRow, MessageRow } from "@/lib/db";
import { requireUser, AuthError, errorResponse } from "@/lib/auth";
import { toPublicCase, toPublicResponse } from "@/lib/cases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    const db = getDb();

    const cr = await db.execute({ sql: `SELECT * FROM cases WHERE id = ? LIMIT 1`, args: [id] });
    if (cr.rows.length === 0) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const caseRow = cr.rows[0] as unknown as CaseRow;

    // Acesso: dono do caso, plantonista aprovado, ou admin.
    const isOwner = caseRow.requester_id === user.id;
    const isApprovedResponder = user.role === "responder" && user.status === "approved";
    if (!isOwner && !isApprovedResponder && user.role !== "admin") {
      throw new AuthError(403, "forbidden");
    }

    const [images, responses, messages] = await Promise.all([
      db.execute({ sql: `SELECT * FROM case_images WHERE case_id = ? ORDER BY created_at ASC`, args: [id] }),
      db.execute({ sql: `SELECT * FROM responses WHERE case_id = ? ORDER BY created_at ASC`, args: [id] }),
      db.execute({ sql: `SELECT * FROM messages WHERE case_id = ? ORDER BY created_at ASC`, args: [id] }),
    ]);

    return NextResponse.json({
      case: toPublicCase(caseRow),
      images: images.rows as unknown as CaseImageRow[],
      responses: (responses.rows as unknown as ResponseRow[]).map(toPublicResponse),
      messages: messages.rows as unknown as MessageRow[],
      viewerId: user.id,
      viewerRole: user.role,
      serverNow: Date.now(),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
