import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req);
    const { id } = await ctx.params;
    const db = getDb();
    await db.execute({
      sql: `UPDATE users SET status = 'rejected', updated_at = ? WHERE id = ?`,
      args: [Date.now(), id],
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
