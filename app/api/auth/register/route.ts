import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb } from "@/lib/db";
import { hashPassword, signSession, setSessionCookie, errorResponse } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { normalizeCpf, validateCpf } from "@/lib/cpf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const db = getDb();
    const body = await req.json();

    const docType = body.docType === "cpf" ? "cpf" : "crm";
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");

    if (name.length < 2 || phone.length < 8 || password.length < 6) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }
    if (email && !isEmail(email)) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const id = newId("u");
    const now = Date.now();
    const password_hash = await hashPassword(password);

    if (docType === "cpf") {
      // Acadêmico/estudante: CPF validado → entra ATIVO como REQUESTER. NUNCA responder.
      const cpf = normalizeCpf(String(body.cpf ?? ""));
      if (!validateCpf(cpf)) return NextResponse.json({ error: "invalid_cpf" }, { status: 400 });
      const specialty = String(body.faculdade ?? "").trim() || "Estudante de Medicina";
      const existing = await db.execute({ sql: "SELECT id FROM users WHERE cpf = ? AND doc_type = 'cpf' LIMIT 1", args: [cpf] });
      if (existing.rows.length > 0) return NextResponse.json({ error: "cpf_taken" }, { status: 409 });
      try {
        await db.execute({
          sql: `INSERT INTO users (id, name, crm, cpf, doc_type, specialty, phone, email, role, status, password_hash, created_at, updated_at)
                VALUES (?, ?, '', ?, 'cpf', ?, ?, ?, 'requester', 'approved', ?, ?, ?)`,
          args: [id, name, cpf, specialty, phone, email || null, password_hash, now, now],
        });
      } catch (e) {
        if (/unique|constraint/i.test(String((e as Error)?.message || ""))) return NextResponse.json({ error: "cpf_taken" }, { status: 409 });
        throw e;
      }
      const token = await signSession({ sub: id, role: "requester", name });
      const res = NextResponse.json({ id, role: "requester", status: "approved" });
      setSessionCookie(res, token);
      return res;
    }

    // Médico: CRM → responder aprovado na hora (fluxo atual).
    const crm = String(body.crm ?? "").trim();
    const specialty = String(body.specialty ?? "").trim();
    if (crm.length < 2 || specialty.length < 2) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    const existing = await db.execute({ sql: "SELECT id FROM users WHERE crm = ? AND doc_type = 'crm' LIMIT 1", args: [crm] });
    if (existing.rows.length > 0) return NextResponse.json({ error: "crm_taken" }, { status: 409 });
    try {
      await db.execute({
        sql: `INSERT INTO users (id, name, crm, doc_type, specialty, phone, email, role, status, password_hash, created_at, updated_at)
              VALUES (?, ?, ?, 'crm', ?, ?, ?, 'responder', 'approved', ?, ?, ?)`,
        args: [id, name, crm, specialty, phone, email || null, password_hash, now, now],
      });
    } catch (e) {
      if (/unique|constraint/i.test(String((e as Error)?.message || ""))) return NextResponse.json({ error: "crm_taken" }, { status: 409 });
      throw e;
    }
    const token = await signSession({ sub: id, role: "responder", name });
    const res = NextResponse.json({ id, role: "responder", status: "approved" });
    setSessionCookie(res, token);
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}
