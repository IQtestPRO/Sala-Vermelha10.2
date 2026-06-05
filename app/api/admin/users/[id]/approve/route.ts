import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/auth";
import { sendToUser } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req);
    const { id } = await ctx.params;
    const db = getDb();
    await db.execute({
      sql: `UPDATE users SET status = 'approved', updated_at = ? WHERE id = ?`,
      args: [Date.now(), id],
    });
    try {
      await sendToUser(db, id, {
        title: "Cadastro aprovado!",
        body: "Você já pode responder casos na fila.",
        url: "/queue",
      });
    } catch (e) {
      console.error("[push approve]", e);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
