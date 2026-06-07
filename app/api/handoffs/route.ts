import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb, HandoffRow } from "@/lib/db";
import { requireUser, errorResponse } from "@/lib/auth";
import { newId } from "@/lib/ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const s = (v: unknown, max = 4000) => String(v ?? "").trim().slice(0, max);

// Lista as passagens da equipe (ativas por padrão; ?all=1 inclui encerradas).
export async function GET(req: NextRequest) {
  try {
    await requireUser(req);
    await ensureTables();
    const db = getDb();
    const all = new URL(req.url).searchParams.get("all") === "1";
    const sql = all
      ? "SELECT * FROM handoffs ORDER BY updated_at DESC LIMIT 200"
      : "SELECT * FROM handoffs WHERE status = 'ativo' ORDER BY updated_at DESC LIMIT 200";
    const r = await db.execute(sql);
    const handoffs = (r.rows as unknown as HandoffRow[]).map((h) => ({
      token: h.token,
      paciente: h.paciente,
      idade: h.idade,
      leito: h.leito,
      situacao: h.situacao,
      status: h.status,
      author_name: h.author_name,
      created_at: h.created_at,
      updated_at: h.updated_at,
    }));
    return NextResponse.json({ handoffs });
  } catch (err) {
    return errorResponse(err);
  }
}

// Cria uma passagem + a 1ª entrada do log.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();
    const body = await req.json();

    const paciente = s(body.paciente, 200);
    if (!paciente) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    const idade = s(body.idade, 40) || null;
    const leito = s(body.leito, 60) || null;
    const situacao = s(body.situacao, 6000) || null;

    const id = newId();
    const token = (globalThis.crypto?.randomUUID?.() || newId() + newId()).replace(/-/g, "").slice(0, 24);
    const now = Date.now();

    await db.execute({
      sql: `INSERT INTO handoffs (id, token, paciente, idade, leito, situacao, status, created_by, author_name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'ativo', ?, ?, ?, ?)`,
      args: [id, token, paciente, idade, leito, situacao, user.id, user.name, now, now],
    });
    if (situacao) {
      await db.execute({
        sql: `INSERT INTO handoff_entries (id, handoff_id, author_id, author_name, texto, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [newId(), id, user.id, user.name, situacao, now],
      });
    }
    return NextResponse.json({ token });
  } catch (err) {
    return errorResponse(err);
  }
}
