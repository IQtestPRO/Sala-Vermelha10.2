import { NextRequest, NextResponse } from "next/server";
import { requireUser, errorResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        crm: user.crm,
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
