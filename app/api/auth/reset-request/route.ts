import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { ensureTables, getDb, UserRow } from "@/lib/db";
import { errorResponse } from "@/lib/auth";
import { normalizeCpf, validateCpf } from "@/lib/cpf";
import { newId } from "@/lib/ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALIDADE_MIN = 60;

// Pede a redefinição de senha. Resposta SEMPRE genérica (não revela se a conta existe).
// Entrega: e-mail automático se RESEND_API_KEY estiver configurada; senão o pedido
// aparece no /admin (aba Senhas) e a equipe envia o link pelo WhatsApp cadastrado.
export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const db = getDb();
    const body = await req.json();
    const identifier = String(body.identifier ?? "").trim();
    if (!identifier) return NextResponse.json({ ok: true });

    const digits = normalizeCpf(identifier);
    const r =
      digits.length === 11 && validateCpf(digits)
        ? await db.execute({ sql: "SELECT * FROM users WHERE cpf = ? AND doc_type = 'cpf' LIMIT 1", args: [digits] })
        : await db.execute({ sql: "SELECT * FROM users WHERE crm = ? AND doc_type = 'crm' LIMIT 1", args: [identifier] });
    if (r.rows.length === 0) return NextResponse.json({ ok: true });
    const user = r.rows[0] as unknown as UserRow;

    // Um pedido ativo por usuário: invalida os anteriores.
    await db.execute({ sql: "UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0", args: [user.id] });

    const token = randomBytes(32).toString("base64url");
    const now = Date.now();
    await db.execute({
      sql: "INSERT INTO password_resets (id, user_id, token, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)",
      args: [newId("rst"), user.id, token, now + VALIDADE_MIN * 60_000, now],
    });

    // E-mail automático (ativa sozinho quando RESEND_API_KEY existir e o usuário tiver e-mail).
    const key = process.env.RESEND_API_KEY;
    const email = (user as unknown as { email?: string }).email;
    if (key && email) {
      const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
      const link = `${origin}/reset/${token}`;
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
          body: JSON.stringify({
            from: process.env.RESEND_FROM || "STAT <onboarding@resend.dev>",
            to: [email],
            subject: "Redefinição de senha — STAT",
            html: `<p>Olá, ${user.name?.split(" ")[0] || "doutor(a)"}.</p><p>Para redefinir sua senha do STAT, acesse o link abaixo (válido por ${VALIDADE_MIN} minutos):</p><p><a href="${link}">${link}</a></p><p>Se você não pediu a redefinição, ignore este e-mail.</p>`,
          }),
        });
      } catch {
        /* fica disponível no /admin de qualquer forma */
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
