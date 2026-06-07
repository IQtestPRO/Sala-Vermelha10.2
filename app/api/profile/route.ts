import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb, UserRow } from "@/lib/db";
import { requireUser, hashPassword, verifyPassword, errorResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Atualiza o perfil do próprio usuário (dados + memória do médico + senha opcional).
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();
    const body = await req.json();

    const sets: string[] = [];
    const args: (string | number | null)[] = [];
    const push = (col: string, val: string | number | null) => {
      sets.push(`${col} = ?`);
      args.push(val);
    };

    if (typeof body.name === "string") {
      const v = body.name.trim().slice(0, 120);
      if (v) push("name", v);
    }
    if (body.phone !== undefined) push("phone", body.phone ? String(body.phone).trim().slice(0, 40) : null);
    if (body.email !== undefined) push("email", body.email ? String(body.email).trim().slice(0, 160) : null);
    if (typeof body.specialty === "string") {
      const v = body.specialty.trim().slice(0, 120);
      if (v) push("specialty", v);
    }
    if (body.avatar_url !== undefined) push("avatar_url", body.avatar_url ? String(body.avatar_url).slice(0, 600) : null);
    if (body.perfil_medico !== undefined) push("perfil_medico", body.perfil_medico ? String(body.perfil_medico).slice(0, 3000) : null);

    // Troca de senha (opcional) — exige a senha atual.
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    if (newPassword) {
      if (newPassword.length < 6) return NextResponse.json({ error: "weak_password" }, { status: 400 });
      const ok = await verifyPassword(String(body.currentPassword || ""), user.password_hash);
      if (!ok) return NextResponse.json({ error: "wrong_password" }, { status: 400 });
      push("password_hash", await hashPassword(newPassword));
    }

    if (!sets.length) return NextResponse.json({ error: "nothing_to_update" }, { status: 400 });

    push("updated_at", Date.now());
    args.push(user.id);
    await db.execute({ sql: `UPDATE users SET ${sets.join(", ")} WHERE id = ?`, args });

    const r = await db.execute({ sql: "SELECT * FROM users WHERE id = ? LIMIT 1", args: [user.id] });
    const u = r.rows[0] as unknown as UserRow;
    return NextResponse.json({
      user: {
        id: u.id,
        name: u.name,
        crm: u.crm,
        specialty: u.specialty,
        phone: u.phone,
        email: u.email,
        avatar_url: u.avatar_url,
        perfil_medico: u.perfil_medico,
        role: u.role,
        status: u.status,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
