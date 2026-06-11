import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ensureTables, getDb, CaseRow } from "@/lib/db";
import { requireUser, errorResponse } from "@/lib/auth";
import { newId } from "@/lib/ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.ANALYZE_MODEL || "claude-sonnet-4-6";

// Tom OBRIGATÓRIO: educativo e respeitoso — apoio à decisão ENTRE PROFISSIONAIS.
const SYSTEM = `Você redige o DEBRIEF educativo de um caso de emergência encerrado, para o próprio médico que o conduziu. PT-BR, tom de colega experiente em sessão de discussão de caso.

REGRAS DE TOM (inegociáveis):
- Educativo e RESPEITOSO: isto é apoio à decisão entre profissionais, NUNCA fiscalização. É PROIBIDO acusar ("você errou", "falha sua", "conduta errada"). Pontos de melhoria são OPORTUNIDADES, formulados como "considerar...", "uma alternativa respaldada seria...".
- Fundamente cada ponto na DIRETRIZ pertinente (AHA/ACLS, ESC, SBC, AHA/ASA, Surviving Sepsis, WAO) e cite-a em "referencia_diretriz" (nomes, sem URLs).
- Reconheça as limitações do registro (nem tudo que foi feito está escrito) — avalie o que está documentado, sem presumir omissão.
- "aderencia" compara a conduta DOCUMENTADA com a diretriz: alta (alinhada), parcial (alinhada com lacunas) ou baixa (divergência relevante documentada). Na dúvida, seja generoso: registro incompleto ≠ baixa aderência.
- Pseudonimizado: nunca inclua nome/identificação de paciente.
Responda APENAS o JSON.`;

const SCHEMA = {
  type: "object",
  properties: {
    resumo: { type: "string" },
    conduta_executada: { type: "string" },
    referencia_diretriz: { type: "string" },
    pontos_fortes: { type: "array", items: { type: "string" } },
    pontos_de_melhoria: { type: "array", items: { type: "string" } },
    aderencia: { type: "string", enum: ["alta", "parcial", "baixa"] },
  },
  required: ["resumo", "conduta_executada", "referencia_diretriz", "pontos_fortes", "pontos_de_melhoria", "aderencia"],
  additionalProperties: false,
} as const;

type Params = { params: Promise<{ id: string }> };

async function podeVer(db: ReturnType<typeof getDb>, caseRow: CaseRow, userId: string, role: string): Promise<boolean> {
  return caseRow.requester_id === userId || caseRow.claimed_by === userId || role === "admin";
}

function rowToDebrief(r: Record<string, unknown>) {
  const j = (v: unknown) => {
    try {
      return JSON.parse(String(v ?? "[]"));
    } catch {
      return [];
    }
  };
  return {
    resumo: r.resumo,
    conduta_executada: r.conduta_executada,
    referencia_diretriz: r.referencia_diretriz,
    pontos_fortes: j(r.pontos_fortes),
    pontos_de_melhoria: j(r.pontos_melhoria),
    aderencia: r.aderencia,
    created_at: r.created_at,
  };
}

export async function GET(req: NextRequest, ctx: Params) {
  try {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    await ensureTables();
    const db = getDb();
    const cr = await db.execute({ sql: "SELECT * FROM cases WHERE id=?", args: [id] });
    if (cr.rows.length === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const caseRow = cr.rows[0] as unknown as CaseRow;
    if (!(await podeVer(db, caseRow, user.id, user.role))) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const r = await db.execute({ sql: "SELECT * FROM case_debriefs WHERE case_id=?", args: [id] });
    if (r.rows.length === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ debrief: rowToDebrief(r.rows[0] as unknown as Record<string, unknown>) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest, ctx: Params) {
  try {
    const user = await requireUser(req);
    const { id } = await ctx.params;
    await ensureTables();
    const db = getDb();
    const cr = await db.execute({ sql: "SELECT * FROM cases WHERE id=?", args: [id] });
    if (cr.rows.length === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const caseRow = cr.rows[0] as unknown as CaseRow;
    if (!(await podeVer(db, caseRow, user.id, user.role))) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    // Idempotente: já existe → devolve.
    const ex = await db.execute({ sql: "SELECT * FROM case_debriefs WHERE case_id=?", args: [id] });
    if (ex.rows.length > 0) return NextResponse.json({ debrief: rowToDebrief(ex.rows[0] as unknown as Record<string, unknown>) });

    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });

    // Contexto completo do caso (pseudonimizado por construção).
    const resps = await db.execute({ sql: "SELECT body, structured_conduct, created_at FROM responses WHERE case_id=? ORDER BY created_at", args: [id] });
    const msgs = await db.execute({ sql: "SELECT sender_id, body, created_at FROM messages WHERE case_id=? ORDER BY created_at DESC LIMIT 30", args: [id] });

    const linhas: string[] = [
      `TIPO: ${caseRow.question_type} · PRIORIDADE: ${caseRow.priority}`,
      `PERGUNTA/CASO: ${caseRow.question_text}`,
      caseRow.clinical_summary ? `RESUMO CLÍNICO: ${caseRow.clinical_summary}` : "",
      caseRow.patient_age != null ? `IDADE: ${caseRow.patient_age}` : "",
      caseRow.vitals ? `VITAIS: ${caseRow.vitals}` : "",
      caseRow.ai_analysis ? `ANÁLISE PRELIMINAR DA IA: ${String(caseRow.ai_analysis).slice(0, 2500)}` : "",
      resps.rows.length
        ? `RESPOSTA(S) DO PLANTONISTA:\n${resps.rows.map((r) => `- ${String(r.body).slice(0, 1200)}${r.structured_conduct ? ` [conduta estruturada: ${String(r.structured_conduct).slice(0, 400)}]` : ""}`).join("\n")}`
        : "SEM resposta de plantonista registrada.",
      msgs.rows.length ? `CHAT DO CASO (mais recente primeiro):\n${msgs.rows.map((m) => `- ${String(m.body).slice(0, 300)}`).join("\n")}` : "",
    ].filter(Boolean);

    const client = new Anthropic();
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1600,
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: "user", content: [{ type: "text", text: `CASO ENCERRADO PARA DEBRIEF:\n${linhas.join("\n\n")}` }] }],
    } as Anthropic.MessageCreateParamsNonStreaming);

    const textBlock = resp.content.find((b) => b.type === "text");
    const text = textBlock && "text" in textBlock ? textBlock.text : "";
    if (!text.trim()) return NextResponse.json({ error: "ai_no_output" }, { status: 502 });
    let d;
    try {
      d = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "parse_error" }, { status: 502 });
    }

    const now = Date.now();
    await db.execute({
      sql: `INSERT INTO case_debriefs (id, case_id, user_id, resumo, conduta_executada, referencia_diretriz, pontos_fortes, pontos_melhoria, aderencia, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(case_id) DO NOTHING`,
      args: [
        newId("db"),
        id,
        user.id,
        String(d.resumo ?? "").slice(0, 2000),
        String(d.conduta_executada ?? "").slice(0, 2000),
        String(d.referencia_diretriz ?? "").slice(0, 400),
        JSON.stringify(d.pontos_fortes ?? []).slice(0, 4000),
        JSON.stringify(d.pontos_de_melhoria ?? []).slice(0, 4000),
        ["alta", "parcial", "baixa"].includes(String(d.aderencia)) ? String(d.aderencia) : "parcial",
        now,
      ],
    });

    // Alimenta o logbook: merge meta.aderencia nas entradas deste caso (best-effort).
    try {
      const lb = await db.execute({ sql: "SELECT id, meta FROM logbook_entries WHERE case_id=?", args: [id] });
      for (const row of lb.rows) {
        let meta: Record<string, unknown> = {};
        try {
          meta = row.meta ? JSON.parse(String(row.meta)) : {};
        } catch {
          /* noop */
        }
        meta.aderencia = d.aderencia;
        await db.execute({ sql: "UPDATE logbook_entries SET meta=? WHERE id=?", args: [JSON.stringify(meta), String(row.id)] });
      }
    } catch (e) {
      console.error("[debrief→logbook]", e);
    }

    return NextResponse.json({ debrief: { ...d, created_at: now } });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error("[api/debrief] anthropic", err.status, err.message);
      return NextResponse.json({ error: "ai_error" }, { status: 502 });
    }
    return errorResponse(err);
  }
}
