import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lista todo o feedback (admin). Filtros opcionais ?tipo= e ?status=.
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    await ensureTables();
    const db = getDb();
    const url = new URL(req.url);
    const tipo = url.searchParams.get("tipo");
    const status = url.searchParams.get("status");
    const where: string[] = [];
    const args: string[] = [];
    if (tipo) { where.push("tipo = ?"); args.push(tipo); }
    if (status) { where.push("status = ?"); args.push(status); }
    const sql = `SELECT id, user_id, user_name, tipo, texto, app_ref, status, created_at FROM feedback ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC LIMIT 500`;
    const r = await db.execute({ sql, args });
    return NextResponse.json({ feedback: r.rows });
  } catch (err) {
    return errorResponse(err);
  }
}

// Atualiza o status de um item (novo | visto | feito).
export async function PATCH(req: NextRequest) {
  try {
    requireAdmin(req);
    await ensureTables();
    const db = getDb();
    const b = await req.json();
    const id = String(b.id ?? "");
    const status = ["novo", "visto", "feito"].includes(String(b.status)) ? String(b.status) : "novo";
    if (!id) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    await db.execute({ sql: "UPDATE feedback SET status = ? WHERE id = ?", args: [status, id] });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
