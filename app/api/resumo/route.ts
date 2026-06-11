import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb } from "@/lib/db";
import { requireUser, errorResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADER_PESO: Record<string, number> = { alta: 1, parcial: 0.6, baixa: 0.2 };

function limitesDoMes(month: string): { ini: number; fim: number } {
  const [y, m] = month.split("-").map(Number);
  return { ini: Date.UTC(y, m - 1, 1) - 3 * 3600_000, fim: Date.UTC(y, m, 1) - 3 * 3600_000 }; // BRT ≈ UTC-3
}
function mesAnterior(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function agregados(db: ReturnType<typeof getDb>, userId: string, month: string) {
  const { ini, fim } = limitesDoMes(month);

  const casos = await db.execute({
    sql: "SELECT question_type, COUNT(*) AS n FROM cases WHERE requester_id = ? AND created_at >= ? AND created_at < ? GROUP BY question_type",
    args: [userId, ini, fim],
  });
  const porTipo = casos.rows.map((r) => ({ tipo: String(r.question_type), n: Number(r.n) }));
  const totalCasos = porTipo.reduce((a, x) => a + x.n, 0);

  const resp = await db.execute({
    sql: "SELECT COUNT(*) AS n, AVG(answered_at - claimed_at) AS media FROM cases WHERE claimed_by = ? AND answered_at IS NOT NULL AND claimed_at IS NOT NULL AND answered_at >= ? AND answered_at < ?",
    args: [userId, ini, fim],
  });
  const respostas = Number(resp.rows[0]?.n ?? 0);
  const tempoMedioSeg = resp.rows[0]?.media != null && respostas > 0 ? Math.round(Number(resp.rows[0].media) / 1000) : null;

  const pcr = await db.execute({
    sql: "SELECT COUNT(*) AS n FROM pcr_reports WHERE user_id = ? AND created_at >= ? AND created_at < ?",
    args: [userId, ini, fim],
  });
  const pcrs = Number(pcr.rows[0]?.n ?? 0);

  const deb = await db.execute({
    sql: "SELECT aderencia FROM case_debriefs WHERE user_id = ? AND created_at >= ? AND created_at < ?",
    args: [userId, ini, fim],
  });
  const pesos = deb.rows.map((r) => ADER_PESO[String(r.aderencia)] ?? 0.6);
  const aderenciaPct = pesos.length ? Math.round((pesos.reduce((a, b) => a + b, 0) / pesos.length) * 100) : null;

  const fin = await db.execute({
    sql: "SELECT COALESCE(SUM(CASE WHEN pago=1 THEN valor ELSE 0 END),0) AS recebido, COALESCE(SUM(CASE WHEN pago=0 THEN valor ELSE 0 END),0) AS a_receber FROM shifts WHERE user_id = ? AND data LIKE ?",
    args: [userId, month + "%"],
  });
  const recebido = Number(fin.rows[0]?.recebido ?? 0);
  const aReceber = Number(fin.rows[0]?.a_receber ?? 0);

  return { totalCasos, porTipo, respostas, tempoMedioSeg, pcrs, aderenciaPct, recebido, aReceber };
}

// Resumo do mês do PRÓPRIO médico (ownership por user_id; sem dados de paciente).
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();
    const q = new URL(req.url).searchParams.get("month");
    const month = q && /^\d{4}-\d{2}$/.test(q) ? q : new Date().toISOString().slice(0, 7);
    const anterior = mesAnterior(month);
    const [atual, prev] = await Promise.all([agregados(db, user.id, month), agregados(db, user.id, anterior)]);
    return NextResponse.json({ month, anterior, atual, prev, nome: user.name });
  } catch (err) {
    return errorResponse(err);
  }
}
