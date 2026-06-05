import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb, UserRow } from "@/lib/db";
import { verifyPassword, signSession, setSessionCookie, errorResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const db = getDb();
    const body = await req.json();
    const crm = String(body.crm ?? "").trim();
    const password = String(body.password ?? "");

    if (!crm || !password) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const r = await db.execute({
      sql: "SELECT * FROM users WHERE crm = ? LIMIT 1",
      args: [crm],
    });
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
