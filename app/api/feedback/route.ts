import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb } from "@/lib/db";
import { requireUser, errorResponse } from "@/lib/auth";
import { newId } from "@/lib/ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIPOS = ["ideia", "problema", "melhoria"];

// Envia uma ideia / problema / melhoria.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();
    const b = await req.json();
    const tipo = TIPOS.includes(String(b.tipo)) ? String(b.tipo) : "ideia";
    const texto = String(b.texto ?? "").trim().slice(0, 4000);
    const app_ref = String(b.app_ref ?? "").trim().slice(0, 200) || null;
    if (texto.length < 3) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

    await db.execute({
      sql: `INSERT INTO feedback (id, user_id, user_name, tipo, texto, app_ref, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'novo', ?)`,
      args: [newId("fb"), user.id, user.name, tipo, texto, app_ref, Date.now()],
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

// Lista os envios do próprio usuário (histórico).
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();
    const r = await db.execute({
      sql: "SELECT id, tipo, texto, app_ref, status, created_at FROM feedback WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      args: [user.id],
    });
    return NextResponse.json({ feedback: r.rows });
  } catch (err) {
    return errorResponse(err);
  }
}
