import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pedidos de redefinição PENDENTES (p/ a equipe enviar o link pelo WhatsApp cadastrado).
export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    await ensureTables();
    const db = getDb();
    const r = await db.execute({
      sql: `SELECT pr.id, pr.token, pr.expires_at, pr.created_at, u.name, u.crm, u.cpf, u.doc_type, u.phone
            FROM password_resets pr JOIN users u ON u.id = pr.user_id
            WHERE pr.used = 0 AND pr.expires_at > ?
            ORDER BY pr.created_at DESC LIMIT 100`,
      args: [Date.now()],
    });
    return NextResponse.json({ resets: r.rows });
  } catch (err) {
    return errorResponse(err);
  }
}

// Concluir/descartar um pedido (depois de enviar o link).
export async function DELETE(req: NextRequest) {
  try {
    requireAdmin(req);
    await ensureTables();
    const db = getDb();
    const id = new URL(req.url).searchParams.get("id") || "";
    if (!id) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    await db.execute({ sql: "UPDATE password_resets SET used = 1 WHERE id = ?", args: [id] });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
