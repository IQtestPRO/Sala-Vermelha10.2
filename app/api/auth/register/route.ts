import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb, Role, UserStatus } from "@/lib/db";
import { hashPassword, signSession, setSessionCookie, errorResponse } from "@/lib/auth";
import { newId } from "@/lib/ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const db = getDb();
    const body = await req.json();

    const name = String(body.name ?? "").trim();
    const crm = String(body.crm ?? "").trim();
    const specialty = String(body.specialty ?? "").trim();
    const password = String(body.password ?? "");
    const role: Role = body.role === "responder" ? "responder" : "requester";

    if (name.length < 2 || crm.length < 2 || specialty.length < 2 || password.length < 6) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const existing = await db.execute({
      sql: "SELECT id FROM users WHERE crm = ? LIMIT 1",
      args: [crm],
    });
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "crm_taken" }, { status: 409 });
    }

    const id = newId("u");
    const now = Date.now();
    // Solicitante entra aprovado; respondedor fica pendente de aprovacao do admin.
    const status: UserStatus = role === "responder" ? "pending" : "approved";
    const password_hash = await hashPassword(password);

    await db.execute({
      sql: `INSERT INTO users (id, name, crm, specialty, role, status, password_hash, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, name, crm, specialty, role, status, password_hash, now, now],
    });

    const token = await signSession({ sub: id, role, name });
    const res = NextResponse.json({ id, role, status });
    setSessionCookie(res, token);
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}
