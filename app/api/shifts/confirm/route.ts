import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb } from "@/lib/db";
import { requireUser, errorResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Confirmar presença no plantão (ação do push da véspera OU botão na agenda).
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();
    const body = await req.json().catch(() => ({}));
    const id = String(body.id ?? new URL(req.url).searchParams.get("id") ?? "");
    if (!id) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    await db.execute({ sql: "UPDATE shifts SET confirmado = 1 WHERE id = ? AND user_id = ?", args: [id, user.id] });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
