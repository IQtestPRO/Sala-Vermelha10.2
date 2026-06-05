import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireUser, errorResponse } from "@/lib/auth";
import { newId } from "@/lib/ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const db = getDb();
    const sub = await req.json();
    const endpoint = sub?.endpoint as string | undefined;
    const p256dh = sub?.keys?.p256dh as string | undefined;
    const auth = sub?.keys?.auth as string | undefined;
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const ex = await db.execute({ sql: "SELECT id FROM push_subscriptions WHERE endpoint = ?", args: [endpoint] });
    if (ex.rows.length > 0) {
      await db.execute({
        sql: "UPDATE push_subscriptions SET user_id = ?, p256dh = ?, auth = ? WHERE endpoint = ?",
        args: [user.id, p256dh, auth, endpoint],
      });
    } else {
      await db.execute({
        sql: "INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        args: [newId("ps"), user.id, endpoint, p256dh, auth, Date.now()],
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
