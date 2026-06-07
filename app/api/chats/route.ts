import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb } from "@/lib/db";
import { requireUser, errorResponse } from "@/lib/auth";
import { newId } from "@/lib/ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SaveMsg = { role?: unknown; text?: unknown; imageUrl?: unknown };

// Salva (persistencia leve: SEM base64; so texto + url da imagem no Blob).
function sanitize(messages: unknown): { role: "user" | "assistant"; text: string; imageUrl?: string }[] {
  if (!Array.isArray(messages)) return [];
  return messages.slice(0, 80).map((m: SaveMsg) => {
    const role = m?.role === "assistant" ? "assistant" : "user";
    const text = String(m?.text || "").slice(0, 8000);
    const url = typeof m?.imageUrl === "string" && /^https?:\/\//.test(m.imageUrl) ? m.imageUrl.slice(0, 600) : undefined;
    return url ? { role, text, imageUrl: url } : { role, text };
  });
}

// Lista os chats do usuario (titulo + data), mais recentes primeiro.
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();
    const r = await db.execute({
      sql: "SELECT id, title, updated_at FROM chats WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100",
      args: [user.id],
    });
    const chats = r.rows.map((row) => ({ id: String(row.id), title: String(row.title), updated_at: Number(row.updated_at) }));
    return NextResponse.json({ chats });
  } catch (err) {
    return errorResponse(err);
  }
}

// Cria/atualiza um chat (upsert por id, sempre amarrado ao usuario).
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();
    const body = await req.json();

    const messages = sanitize(body.messages);
    if (!messages.length) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

    const id = body.id && typeof body.id === "string" ? body.id.slice(0, 40) : newId();
    const firstUser = messages.find((m) => m.role === "user" && m.text);
    const title = String(body.title || firstUser?.text || "Conversa").trim().slice(0, 80) || "Conversa";
    const now = Date.now();
    const payload = JSON.stringify(messages);

    await db.execute({
      sql: `INSERT INTO chats (id, user_id, title, messages, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET title = excluded.title, messages = excluded.messages, updated_at = excluded.updated_at
            WHERE chats.user_id = excluded.user_id`,
      args: [id, user.id, title, payload, now, now],
    });

    return NextResponse.json({ id, title });
  } catch (err) {
    return errorResponse(err);
  }
}
