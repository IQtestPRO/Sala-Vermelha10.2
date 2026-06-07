import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb } from "@/lib/db";
import { requireUser, errorResponse } from "@/lib/auth";
import { newId } from "@/lib/ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const J = (v: unknown) => {
  try {
    return JSON.stringify(v ?? null).slice(0, 60000);
  } catch {
    return "null";
  }
};

// Salva o relatório de uma PCR conduzida no Modo PCR (vinculado ao usuário).
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();
    const b = await req.json();
    const now = Date.now();
    await db.execute({
      sql: `INSERT INTO pcr_reports (id, user_id, started_at, duracao_seg, ciclos, choques, desfecho, eventos, ritmos, causas, relatorio, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        newId("pcr"),
        user.id,
        Number(b.started_at) || now,
        Number(b.duracao_seg) || 0,
        Number(b.ciclos) || 0,
        Number(b.choques) || 0,
        String(b.desfecho ?? "").slice(0, 40),
        J(b.eventos),
        J(b.ritmos),
        J(b.causas),
        String(b.relatorio ?? "").slice(0, 60000),
        now,
      ],
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

// Lista os relatórios de PCR do usuário (histórico).
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();
    const r = await db.execute({
      sql: "SELECT id, started_at, duracao_seg, ciclos, choques, desfecho, created_at FROM pcr_reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 100",
      args: [user.id],
    });
    return NextResponse.json({ reports: r.rows });
  } catch (err) {
    return errorResponse(err);
  }
}
