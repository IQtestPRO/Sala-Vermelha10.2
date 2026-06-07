import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb } from "@/lib/db";
import { requireUser, errorResponse } from "@/lib/auth";
import { newId } from "@/lib/ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const numPos = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

// Lista as diluições customizadas do usuário.
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();
    const r = await db.execute({
      sql: "SELECT id, droga_nome, label, qty, qty_unit, volume_final_ml, conc, conc_unit, is_active FROM user_dilutions WHERE user_id = ? ORDER BY droga_nome, created_at",
      args: [user.id],
    });
    const dilutions = r.rows.map((x) => ({
      id: String(x.id),
      droga_nome: String(x.droga_nome),
      label: String(x.label),
      qty: Number(x.qty),
      qty_unit: String(x.qty_unit),
      volume_final_ml: Number(x.volume_final_ml),
      conc: Number(x.conc),
      conc_unit: String(x.conc_unit),
      is_active: !!x.is_active,
    }));
    return NextResponse.json({ dilutions });
  } catch (err) {
    return errorResponse(err);
  }
}

// Cria uma diluição (e a deixa ATIVA para a droga).
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();
    const b = await req.json();

    const droga_nome = String(b.droga_nome ?? "").trim().slice(0, 120);
    const label = String(b.label ?? "").trim().slice(0, 80) || "Minha diluição";
    const qty = numPos(b.qty);
    const volume_final_ml = numPos(b.volume_final_ml);
    const conc = numPos(b.conc);
    const qty_unit = String(b.qty_unit ?? "mg").slice(0, 12);
    const conc_unit = String(b.conc_unit ?? "mcg/mL").slice(0, 12);
    if (!droga_nome || !qty || !volume_final_ml || !conc) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const now = Date.now();
    // Nova diluição entra ativa: desativa as irmãs da mesma droga.
    await db.execute({ sql: "UPDATE user_dilutions SET is_active = 0 WHERE user_id = ? AND droga_nome = ?", args: [user.id, droga_nome] });
    const id = newId("dil");
    await db.execute({
      sql: `INSERT INTO user_dilutions (id, user_id, droga_nome, label, qty, qty_unit, volume_final_ml, conc, conc_unit, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      args: [id, user.id, droga_nome, label, qty, qty_unit, volume_final_ml, conc, conc_unit, now],
    });
    return NextResponse.json({ id });
  } catch (err) {
    return errorResponse(err);
  }
}

// Troca a diluição ATIVA da droga (id real) ou volta p/ a padrão STAT (id = "padrao").
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();
    const b = await req.json();
    const droga_nome = String(b.droga_nome ?? "").trim();
    const id = String(b.id ?? "");
    if (!droga_nome) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    await db.execute({ sql: "UPDATE user_dilutions SET is_active = 0 WHERE user_id = ? AND droga_nome = ?", args: [user.id, droga_nome] });
    if (id && id !== "padrao") {
      await db.execute({ sql: "UPDATE user_dilutions SET is_active = 1 WHERE id = ? AND user_id = ?", args: [id, user.id] });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}

// Apaga uma diluição.
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();
    const id = new URL(req.url).searchParams.get("id") || "";
    if (!id) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    await db.execute({ sql: "DELETE FROM user_dilutions WHERE id = ? AND user_id = ?", args: [id, user.id] });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
