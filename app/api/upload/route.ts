import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth";
import { blobConfigured } from "@/lib/blob";
import { newId } from "@/lib/ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Recebe a imagem ja redimensionada no cliente (base64 JPEG) e armazena.
// Producao: Vercel Blob. Dev local: arquivo em /public/uploads.
export async function POST(req: NextRequest) {
  try {
    await requireUser(req);
    const body = await req.json();
    const base64 = String(body.base64 || "");
    if (!base64) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

    const buffer = Buffer.from(base64, "base64");
    if (buffer.byteLength > 12_000_000) {
      return NextResponse.json({ error: "too_large" }, { status: 413 });
    }

    const name = `ecg/${newId("img")}.jpg`;

    if (blobConfigured()) {
      const { put } = await import("@vercel/blob");
      const result = await put(name, buffer, {
        access: "public",
        contentType: "image/jpeg",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: true,
      });
      return NextResponse.json({ url: result.url });
    }

    // Fallback local (apenas dev — em producao o FS da Vercel e somente leitura).
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const file = `${newId("img")}.jpg`;
    await writeFile(path.join(dir, file), buffer);
    return NextResponse.json({ url: `/uploads/${file}` });
  } catch (err) {
    return errorResponse(err);
  }
}
