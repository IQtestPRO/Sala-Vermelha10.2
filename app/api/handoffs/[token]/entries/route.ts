import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb, HandoffRow } from "@/lib/db";
import { requireUser, errorResponse } from "@/lib/auth";
import { newId } from "@/lib/ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "Continuar" a passagem: adiciona uma entrada ao log (sempre salvo).
export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  try {
    const user = await requireUser(req);
    const { token } = await ctx.params;
    await ensureTables();
    const db = getDb();
    const body = await req.json();
    const texto = String(body.texto ?? "").trim().slice(0, 6000);
    if (!texto) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

    const r = await db.execute({ sql: "SELECT id FROM handoffs WHERE token = ? LIMIT 1", args: [token] });
    const h = r.rows[0] as unknown as Pick<HandoffRow, "id"> | undefined;
    if (!h) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const now = Date.now();
    await db.execute({
      sql: `INSERT INTO handoff_entries (id, handoff_id, author_id, author_name, texto, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [newId(), h.id, user.id, user.name, texto, now],
    });
    await db.execute({ sql: "UPDATE handoffs SET updated_at = ? WHERE id = ?", args: [now, h.id] });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
