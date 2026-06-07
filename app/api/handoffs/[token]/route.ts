import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb, HandoffRow, HandoffEntryRow } from "@/lib/db";
import { requireUser, errorResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Abre a passagem + TODO o histórico (entradas em ordem).
export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  try {
    await requireUser(req);
    const { token } = await ctx.params;
    await ensureTables();
    const db = getDb();
    const r = await db.execute({ sql: "SELECT * FROM handoffs WHERE token = ? LIMIT 1", args: [token] });
    const h = r.rows[0] as unknown as HandoffRow | undefined;
    if (!h) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const e = await db.execute({ sql: "SELECT * FROM handoff_entries WHERE handoff_id = ? ORDER BY created_at ASC", args: [h.id] });
    const entries = (e.rows as unknown as HandoffEntryRow[]).map((x) => ({
      author_name: x.author_name,
      texto: x.texto,
      created_at: x.created_at,
    }));
    return NextResponse.json({
      handoff: {
        token: h.token,
        paciente: h.paciente,
        idade: h.idade,
        leito: h.leito,
        status: h.status,
        author_name: h.author_name,
        created_at: h.created_at,
        updated_at: h.updated_at,
      },
      entries,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

// Encerra (ou reabre) a passagem.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  try {
    await requireUser(req);
    const { token } = await ctx.params;
    await ensureTables();
    const db = getDb();
    const body = await req.json().catch(() => ({}));
    const status = body.status === "encerrado" ? "encerrado" : "ativo";
    await db.execute({ sql: "UPDATE handoffs SET status = ?, updated_at = ? WHERE token = ?", args: [status, Date.now(), token] });
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    return errorResponse(err);
  }
}
