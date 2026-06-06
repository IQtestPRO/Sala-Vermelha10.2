import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb, CaseRow } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { toPublicCase, expireOverdueOpenCases } from "@/lib/cases";
import { escalateExpiredCases } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    await ensureTables();
    const db = getDb();
    const expired = await expireOverdueOpenCases(db);
    await escalateExpiredCases(db, expired);
    const r = await db.execute(`SELECT * FROM cases ORDER BY created_at DESC LIMIT 200`);
    return NextResponse.json({
      cases: (r.rows as unknown as CaseRow[]).map(toPublicCase),
      serverNow: Date.now(),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
