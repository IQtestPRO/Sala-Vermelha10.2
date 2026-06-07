import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb, UserRow } from "@/lib/db";
import { verifyPassword, signSession, setSessionCookie, errorResponse } from "@/lib/auth";
import { normalizeCpf, validateCpf } from "@/lib/cpf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const db = getDb();
    const body = await req.json();
    // Campo único "CRM ou CPF": 11 dígitos com CPF válido → busca por cpf; senão por crm.
    const identifier = String(body.identifier ?? body.crm ?? "").trim();
    const password = String(body.password ?? "");

    if (!identifier || !password) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const digits = normalizeCpf(identifier);
    const r =
      digits.length === 11 && validateCpf(digits)
        ? await db.execute({ sql: "SELECT * FROM users WHERE cpf = ? AND doc_type = 'cpf' LIMIT 1", args: [digits] })
        : await db.execute({ sql: "SELECT * FROM users WHERE crm = ? AND doc_type = 'crm' LIMIT 1", args: [identifier] });
    if (r.rows.length === 0) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }
    const user = r.rows[0] as unknown as UserRow;
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
    }
    if (user.status === "disabled") {
      return NextResponse.json({ error: "disabled" }, { status: 403 });
    }

    const token = await signSession({ sub: user.id, role: user.role, name: user.name });
    const res = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        crm: user.crm,
        specialty: user.specialty,
        role: user.role,
        status: user.status,
      },
    });
    setSessionCookie(res, token);
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}
