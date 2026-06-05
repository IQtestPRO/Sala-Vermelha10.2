import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    services: {
      turso: !!process.env.TURSO_DATABASE_URL,
      jwt: !!process.env.JWT_SECRET,
      admin: !!process.env.ADMIN_PASSWORD,
      cron: !!process.env.CRON_SECRET,
      blob: !!process.env.BLOB_READ_WRITE_TOKEN,
      push: !!process.env.VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY,
    },
    now: Date.now(),
  });
}
