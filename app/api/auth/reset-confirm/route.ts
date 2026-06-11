import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb } from "@/lib/db";
import { hashPassword, errorResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Confirma a redefinição: token de uso único e dentro da validade.
export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const db = getDb();
    const body = await req.json();
    const token = String(body.token ?? "");
    const password = String(body.password ?? "");
    if (!token || password.length < 8) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const r = await db.execute({
      sql: "SELECT id, user_id FROM password_resets WHERE token = ? AND used = 0 AND expires_at > ? LIMIT 1",
      args: [token, Date.now()],
    });
    if (r.rows.length === 0) {
      return NextResponse.json({ error: "reset_invalid" }, { status: 400 });
    }
    const row = r.rows[0] as unknown as { id: string; user_id: string };

    const hash = await hashPassword(password);
    await db.execute({ sql: "UPDATE users SET password_hash = ? WHERE id = ?", args: [hash, row.user_id] });
    await db.execute({ sql: "UPDATE password_resets SET used = 1 WHERE id = ?", args: [row.id] });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
