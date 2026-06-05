import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb, CaseRow } from "@/lib/db";
import { requireUser, requireApprovedResponder, errorResponse } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { computeSlaExpiry } from "@/lib/sla";
import { insertEvent, jstr, toPublicCase, expireOverdueOpenCases } from "@/lib/cases";
import { sendToApprovedResponders } from "@/lib/push";
import { NewCaseInput, questionMeta } from "@/lib/types/case";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Criar caso (solicitante).
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const db = getDb();
    const body = (await req.json()) as NewCaseInput;

    const question_type = String(body.question_type || "OUTRO");
    const question_text = String(body.question_text || "").trim();
    const clinical_summary = String(body.clinical_summary || "").trim();

    if (!question_text && !clinical_summary && !(body.image_urls && body.image_urls.length)) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const id = newId("c");
    const now = Date.now();
    const sla = computeSlaExpiry(now);

    await db.execute({
      sql: `INSERT INTO cases
        (id, requester_id, status, priority, clinical_summary, question_type, question_text,
         patient_ref, patient_age, patient_sex, patient_weight_kg, vitals, created_at, sla_expires_at)
        VALUES (?, ?, 'open', 'critical', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        user.id,
        clinical_summary || question_text,
        question_type,
        question_text || clinical_summary,
        body.patient_ref ?? null,
        body.patient_age ?? null,
        body.patient_sex ?? null,
        body.patient_weight_kg ?? null,
        jstr(body.vitals),
        now,
        sla,
      ],
    });

    // Imagens (ECG etc.)
    if (Array.isArray(body.image_urls)) {
      for (const img of body.image_urls) {
        if (!img?.url) continue;
        await db.execute({
          sql: `INSERT INTO case_images (id, case_id, blob_url, kind, created_at) VALUES (?, ?, ?, ?, ?)`,
          args: [newId("img"), id, img.url, img.kind === "other" ? "other" : "ecg", now],
        });
      }
    }

    await insertEvent(db, id, user.id, "created", { question_type });

    // Fan-out push para plantonistas aprovados (best-effort).
    try {
      const meta = questionMeta(question_type);
      await sendToApprovedResponders(db, {
        title: `Novo caso — ${meta.label}`,
        body: `${clinical_summary || question_text || "Caso de emergência"} • responda em até 10 min`,
        caseId: id,
        url: `/case/${id}`,
      });
    } catch (e) {
      console.error("[push novo caso]", e);
    }

    return NextResponse.json({ id });
  } catch (err) {
    return errorResponse(err);
  }
}

// Fila do plantonista: casos abertos + os que ele assumiu e ainda estao ativos.
export async function GET(req: NextRequest) {
  try {
    const me = await requireApprovedResponder(req);
    await ensureTables();
    const db = getDb();

    // Varredura preguicosa do SLA (garante expiracao mesmo sem cron de 1 min).
    await expireOverdueOpenCases(db);

    const open = await db.execute(
      `SELECT * FROM cases WHERE status = 'open' ORDER BY created_at ASC LIMIT 100`
    );
    const mine = await db.execute({
      sql: `SELECT * FROM cases WHERE claimed_by = ? AND status IN ('claimed','answered') ORDER BY created_at DESC LIMIT 50`,
      args: [me.id],
    });

    return NextResponse.json({
      open: (open.rows as unknown as CaseRow[]).map(toPublicCase),
      mine: (mine.rows as unknown as CaseRow[]).map(toPublicCase),
      serverNow: Date.now(),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
