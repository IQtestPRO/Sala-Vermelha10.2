import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb } from "@/lib/db";
import { requireUser, errorResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = ["caso_criado", "caso_respondido", "pcr_conduzida", "conduta_consultada_aplicada"];

// Logbook do PRÓPRIO médico (ownership por user_id; nada de paciente identificável).
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();
    const kind = new URL(req.url).searchParams.get("kind");
    const r = KINDS.includes(String(kind))
      ? await db.execute({
          sql: "SELECT id, kind, case_id, titulo, meta, created_at FROM logbook_entries WHERE user_id = ? AND kind = ? ORDER BY created_at DESC LIMIT 500",
          args: [user.id, String(kind)],
        })
      : await db.execute({
          sql: "SELECT id, kind, case_id, titulo, meta, created_at FROM logbook_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 500",
          args: [user.id],
        });
    return NextResponse.json({ entries: r.rows });
  } catch (err) {
    return errorResponse(err);
  }
}
