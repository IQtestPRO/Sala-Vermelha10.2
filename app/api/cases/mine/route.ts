import { NextRequest, NextResponse } from "next/server";
import { getDb, CaseRow } from "@/lib/db";
import { requireUser, errorResponse } from "@/lib/auth";
import { toPublicCase, expireOverdueOpenCases } from "@/lib/cases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Feed do solicitante: seus proprios casos.
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const db = getDb();
    await expireOverdueOpenCases(db);

    const r = await db.execute({
      sql: `SELECT * FROM cases WHERE requester_id = ? ORDER BY created_at DESC LIMIT 100`,
      args: [user.id],
    });
    return NextResponse.json({
      cases: (r.rows as unknown as CaseRow[]).map(toPublicCase),
      serverNow: Date.now(),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
