import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth";
import { ensureTables, getDb } from "@/lib/db";
import { sweepShiftAlerts } from "@/lib/shiftAlerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    // Varredura preguiçosa dos lembretes de plantão na abertura do app (gate interno de 15 min).
    try {
      await ensureTables();
      await sweepShiftAlerts(getDb(), user.id);
    } catch {
      /* best-effort */
    }
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        crm: user.crm,
        cpf: user.cpf,
        doc_type: user.doc_type ?? "crm",
        specialty: user.specialty,
        phone: user.phone,
        email: user.email,
        avatar_url: user.avatar_url,
        perfil_medico: user.perfil_medico,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
