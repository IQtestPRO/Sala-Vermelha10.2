import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb, ShiftRow } from "@/lib/db";
import { requireUser, errorResponse } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { sweepShiftAlerts } from "@/lib/shiftAlerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const s = (v: unknown, max = 120) => String(v ?? "").trim().slice(0, max);
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function addMonths(iso: string, n: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

// Lista os plantões do usuário (por mês: ?month=YYYY-MM).
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();

    // Varredura preguiçosa dos lembretes/alerta financeiro (idempotente, gate 15 min).
    await sweepShiftAlerts(db, user.id);

    const month = new URL(req.url).searchParams.get("month");
    const r =
      month && /^\d{4}-\d{2}$/.test(month)
        ? await db.execute({ sql: "SELECT * FROM shifts WHERE user_id = ? AND data LIKE ? ORDER BY data ASC, inicio ASC", args: [user.id, month + "%"] })
        : await db.execute({ sql: "SELECT * FROM shifts WHERE user_id = ? ORDER BY data ASC LIMIT 400", args: [user.id] });
    const shifts = (r.rows as unknown as (ShiftRow & { confirmado?: number })[]).map((x) => ({
      id: x.id,
      data: x.data,
      inicio: x.inicio,
      fim: x.fim,
      local: x.local,
      valor: x.valor,
      pago: !!x.pago,
      cor: x.cor,
      nota: x.nota,
      confirmado: !!x.confirmado,
    }));
    return NextResponse.json({ shifts });
  } catch (err) {
    return errorResponse(err);
  }
}

// Cria plantão(ões). Recorrência única | semanal (12x) | mensal (6x).
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();
    const body = await req.json();

    const data = s(body.data, 10);
    if (!isDate(data)) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    const inicio = s(body.inicio, 5) || null;
    const fim = s(body.fim, 5) || null;
    const local = s(body.local, 120) || null;
    const valor = body.valor != null && !Number.isNaN(Number(body.valor)) ? Number(body.valor) : null;
    const cor = s(body.cor, 16) || null;
    const nota = s(body.nota, 400) || null;
    const rec = body.recorrencia === "semanal" ? "semanal" : body.recorrencia === "mensal" ? "mensal" : "unica";

    const datas: string[] = [data];
    if (rec === "semanal") for (let i = 1; i < 12; i++) datas.push(addDays(data, 7 * i));
    if (rec === "mensal") for (let i = 1; i < 6; i++) datas.push(addMonths(data, i));

    const now = Date.now();
    for (const d of datas) {
      await db.execute({
        sql: `INSERT INTO shifts (id, user_id, data, inicio, fim, local, valor, pago, cor, nota, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
        args: [newId(), user.id, d, inicio, fim, local, valor, cor, nota, now],
      });
    }
    return NextResponse.json({ ok: true, criados: datas.length });
  } catch (err) {
    return errorResponse(err);
  }
}

// Alterna pago / edita.
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();
    const body = await req.json();
    const id = s(body.id, 40);
    if (!id) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    const pago = body.pago ? 1 : 0;
    await db.execute({ sql: "UPDATE shifts SET pago = ? WHERE id = ? AND user_id = ?", args: [pago, id, user.id] });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

// Apaga um plantão.
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();
    const id = new URL(req.url).searchParams.get("id") || "";
    if (!id) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    await db.execute({ sql: "DELETE FROM shifts WHERE id = ? AND user_id = ?", args: [id, user.id] });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
