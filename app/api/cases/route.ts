import { NextRequest, NextResponse } from "next/server";
import { ensureTables, getDb, CaseRow } from "@/lib/db";
import { requireUser, requireApprovedResponder, errorResponse } from "@/lib/auth";
import { newId } from "@/lib/ids";
import { computeSlaExpiry } from "@/lib/sla";
import { insertEvent, jstr, toPublicCase, expireOverdueOpenCases } from "@/lib/cases";
import { sendToApprovedResponders, escalateExpiredCases } from "@/lib/push";
import { NewCaseInput, questionMeta } from "@/lib/types/case";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Criar caso (solicitante).
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const db = getDb();
    const body = (await req.json()) as NewCaseInput;

    // Validacao/saneamento server-side (limites de tamanho e faixas; nao confiar no cliente).
    const question_type = String(body.question_type || "OUTRO").slice(0, 40);
    const question_text = String(body.question_text || "").trim().slice(0, 4000);
    const clinical_summary = String(body.clinical_summary || "").trim().slice(0, 4000);
    const patient_ref = body.patient_ref ? String(body.patient_ref).trim().slice(0, 120) : null;
    const ageN = body.patient_age != null ? Number(body.patient_age) : NaN;
    const patient_age = Number.isFinite(ageN) && ageN >= 0 && ageN <= 130 ? Math.round(ageN) : null;
    const patient_sex = body.patient_sex === "M" || body.patient_sex === "F" || body.patient_sex === "O" ? body.patient_sex : null;
    const wN = body.patient_weight_kg != null ? Number(body.patient_weight_kg) : NaN;
    const patient_weight_kg = Number.isFinite(wN) && wN > 0 && wN <= 500 ? wN : null;

    if (!question_text && !clinical_summary && !(body.image_urls && body.image_urls.length)) {
      return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    }

    const id = newId("c");
    const now = Date.now();
    const sla = computeSlaExpiry(now);

    // Insercao atomica: caso + imagens + evento numa unica transacao (sem caso "orfao" de imagens).
    const stmts: { sql: string; args: (string | number | null)[] }[] = [
      {
        sql: `INSERT INTO cases
          (id, requester_id, status, priority, clinical_summary, question_type, question_text,
           patient_ref, patient_age, patient_sex, patient_weight_kg, vitals, created_at, sla_expires_at)
          VALUES (?, ?, 'open', 'critical', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id, user.id, clinical_summary || question_text, question_type, question_text || clinical_summary,
          patient_ref, patient_age, patient_sex, patient_weight_kg, jstr(body.vitals), now, sla,
        ],
      },
    ];
    if (Array.isArray(body.image_urls)) {
      for (const img of body.image_urls.slice(0, 6)) {
        if (!img?.url || typeof img.url !== "string") continue;
        stmts.push({
          sql: `INSERT INTO case_images (id, case_id, blob_url, kind, created_at) VALUES (?, ?, ?, ?, ?)`,
          args: [newId("img"), id, img.url.slice(0, 2000), img.kind === "other" ? "other" : "ecg", now],
        });
      }
    }
    stmts.push({
      sql: `INSERT INTO case_events (id, case_id, actor_id, event_type, payload, created_at) VALUES (?, ?, ?, 'created', ?, ?)`,
      args: [newId("ev"), id, user.id, jstr({ question_type }), now],
    });
    await db.batch(stmts);

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

    // Varredura preguicosa do SLA (garante expiracao mesmo sem cron). Os casos que
    // acabaram de expirar disparam o push de escalonamento (plantonistas + solicitante).
    const expired = await expireOverdueOpenCases(db);
    await escalateExpiredCases(db, expired);

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
