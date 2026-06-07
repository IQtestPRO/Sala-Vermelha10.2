import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb } from "@/lib/db";
import { requireUser, errorResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Abre um chat (mensagens completas) — só do próprio usuário.
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    await ensureTables();
    const db = getDb();
    const r = await db.execute({
      sql: "SELECT id, title, messages, updated_at FROM chats WHERE id = ? AND user_id = ?",
      args: [id, user.id],
    });
    const row = r.rows[0];
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    let messages = [];
    try {
      messages = JSON.parse(String(row.messages));
    } catch {
      messages = [];
    }
    return NextResponse.json({ id: String(row.id), title: String(row.title), messages, updated_at: Number(row.updated_at) });
  } catch (err) {
    return errorResponse(err);
  }
}

// Apaga um chat do histórico.
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    await ensureTables();
    const db = getDb();
    await db.execute({ sql: "DELETE FROM chats WHERE id = ? AND user_id = ?", args: [id, user.id] });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
