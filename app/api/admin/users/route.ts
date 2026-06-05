import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb, UserRow } from "@/lib/db";
import { requireAdmin, errorResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    await ensureTables();
    const db = getDb();
    const status = new URL(req.url).searchParams.get("status");

    const r = status
      ? await db.execute({ sql: `SELECT * FROM users WHERE status = ? ORDER BY created_at DESC LIMIT 500`, args: [status] })
      : await db.execute(`SELECT * FROM users ORDER BY created_at DESC LIMIT 500`);

    const users = (r.rows as unknown as UserRow[]).map((u) => ({
      id: u.id,
      name: u.name,
      crm: u.crm,
      specialty: u.specialty,
      role: u.role,
      status: u.status,
      created_at: u.created_at,
    }));
    return NextResponse.json({ users });
  } catch (err) {
    return errorResponse(err);
  }
}
