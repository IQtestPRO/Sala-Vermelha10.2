import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser, errorResponse } from "@/lib/auth";
import { RITMOS } from "@/lib/types/case";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MODEL = process.env.ANALYZE_MODEL || "claude-sonnet-4-6";

const RITMO_KEYS = RITMOS.map((r) => r.key);

// Extrator ESTRITO: estrutura o ditado do médico nos campos do caso.
// Campo não mencionado fica AUSENTE — NUNCA inventar valor de vital.
const SYSTEM = `Você estrutura o DITADO de um médico de emergência brasileiro nos campos de um caso clínico. Regras INEGOCIÁVEIS:
- Preencha SOMENTE o que o médico FALOU. Campo não mencionado fica AUSENTE (omita a chave). NUNCA invente, estime ou complete valor de sinal vital, idade ou peso.
- "resumo_clinico": o caso reescrito como texto clínico limpo e enxuto (remove vícios de fala tipo "ééé", repetições), em PT-BR, mantendo TODOS os dados clínicos ditos. PSEUDONIMIZADO: se o médico ditar nome/sobrenome do paciente, OMITA (use "paciente"); nunca inclua nome, CPF ou prontuário.
- PA ditada como "12 por 8" = 120x80 mmHg; "noventa por sessenta" = 90x60. Saturação "91" = satO2 91. Temperatura "trinta e oito e meio" = 38.5.
- "ritmo" só se o médico citar o ritmo do monitor, restrito a: ${RITMO_KEYS.join(", ")}.
- Números sempre como number (não string). Glasgow 3–15; satO2 0–100.
Responda APENAS o JSON.`;

const SCHEMA = {
  type: "object",
  properties: {
    resumo_clinico: { type: "string" },
    idade: { type: "number" },
    sexo: { type: "string", enum: ["M", "F", "O"] },
    peso: { type: "number" },
    vitais: {
      type: "object",
      properties: {
        paSys: { type: "number" },
        paDia: { type: "number" },
        fc: { type: "number" },
        fr: { type: "number" },
        satO2: { type: "number" },
        tax: { type: "number" },
        glicemia: { type: "number" },
        glasgow: { type: "number" },
        ritmo: { type: "string", enum: RITMO_KEYS },
      },
      additionalProperties: false,
    },
  },
  required: ["resumo_clinico"],
  additionalProperties: false,
} as const;

const num = (v: unknown, min: number, max: number): number | undefined => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
};

export async function POST(req: NextRequest) {
  try {
    await requireUser(req);
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
    }
    const body = await req.json();
    const transcript = String(body.transcript ?? "").trim().slice(0, 4000);
    if (transcript.length < 8) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

    const client = new Anthropic();
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 1200,
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: "user", content: [{ type: "text", text: `DITADO DO MÉDICO:\n${transcript}` }] }],
    } as Anthropic.MessageCreateParamsNonStreaming);

    const textBlock = resp.content.find((b) => b.type === "text");
    const text = textBlock && "text" in textBlock ? textBlock.text : "";
    if (!text.trim()) return NextResponse.json({ error: "ai_no_output" }, { status: 502 });
    let raw;
    try {
      raw = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "parse_error" }, { status: 502 });
    }

    // Validação defensiva (clamps clínicos grosseiros) — o que cair fora vira ausente.
    const v = raw.vitais && typeof raw.vitais === "object" ? raw.vitais : {};
    const vitais = {
      paSys: num(v.paSys, 30, 320),
      paDia: num(v.paDia, 10, 220),
      fc: num(v.fc, 10, 320),
      fr: num(v.fr, 4, 90),
      satO2: num(v.satO2, 0, 100),
      tax: num(v.tax, 25, 45),
      glicemia: num(v.glicemia, 5, 1500),
      glasgow: num(v.glasgow, 3, 15),
      ritmo: RITMO_KEYS.includes(String(v.ritmo)) ? String(v.ritmo) : undefined,
    };
    const campos = {
      resumo_clinico: String(raw.resumo_clinico ?? "").trim().slice(0, 1200),
      idade: num(raw.idade, 0, 120),
      sexo: ["M", "F", "O"].includes(String(raw.sexo)) ? String(raw.sexo) : undefined,
      peso: num(raw.peso, 0.4, 400),
      vitais: Object.fromEntries(Object.entries(vitais).filter(([, x]) => x !== undefined)),
    };
    if (!campos.resumo_clinico) return NextResponse.json({ error: "ai_no_output" }, { status: 502 });

    return NextResponse.json({ campos });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error("[api/voice-case] anthropic", err.status, err.message);
      return NextResponse.json({ error: "ai_error" }, { status: 502 });
    }
    return errorResponse(err);
  }
}
