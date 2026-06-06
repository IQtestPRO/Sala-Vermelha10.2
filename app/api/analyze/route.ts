import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser, errorResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.ANALYZE_MODEL || "claude-opus-4-8";

const SYSTEM = `Você é um médico emergencista sênior na sala vermelha. Recebe a FOTO de um monitor multiparamétrico e/ou de um ECG, com um contexto curto. Leia APENAS o que está visível na imagem (FC, ritmo/traçado, SpO2, PA/PNI, FR, Tax, glicemia, alarmes). NUNCA invente dados que não estão na imagem. Quando um dado for não confiável (ex.: "sensor desconectado", artefato, PA não aferida), diga isso explicitamente.

Avalie ESTE paciente específico — nada de respostas genéricas. Doses e energias quando aplicável, em valores de referência (o médico confere). Seja direto, conciso e prático para uso imediato.

Responda exclusivamente no formato JSON solicitado, em português, com:
- achados: leituras objetivas da imagem (inclua alarmes e dados não confiáveis)
- hipoteses: diagnósticos diferenciais priorizados (mais provável primeiro)
- conduta: próximos passos imediatos e específicos (avaliar estabilidade, medir o que falta, droga/dose/energia)
- alertas: limitações, dados a confirmar, red flags, o que NÃO fazer
- gravidade: classificação geral

Lembre: isto é apoio à decisão; a responsabilidade é do médico assistente.`;

const SCHEMA = {
  type: "object",
  properties: {
    achados: { type: "array", items: { type: "string" } },
    hipoteses: { type: "array", items: { type: "string" } },
    conduta: { type: "array", items: { type: "string" } },
    alertas: { type: "array", items: { type: "string" } },
    gravidade: { type: "string", enum: ["critico", "alto", "moderado", "baixo", "indeterminado"] },
  },
  required: ["achados", "hipoteses", "conduta", "alertas", "gravidade"],
  additionalProperties: false,
} as const;

export async function POST(req: NextRequest) {
  try {
    await requireUser(req);

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
    }

    const body = await req.json();
    const base64 = String(body.image_base64 || "");
    const context = String(body.context || "").trim();
    if (!base64) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

    const client = new Anthropic();
    const userText =
      `Contexto do caso: ${context || "(não informado)"}.\n` +
      `Analise a imagem e responda no JSON pedido.`;

    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 12000,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: SCHEMA },
      },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
            { type: "text", text: userText },
          ],
        },
      ],
    } as Anthropic.MessageCreateParamsNonStreaming);

    const textBlock = resp.content.find((b) => b.type === "text");
    const text = textBlock && "text" in textBlock ? textBlock.text : "";
    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "parse_error", raw: text }, { status: 502 });
    }

    return NextResponse.json({ analysis, model: MODEL });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error("[api/analyze] anthropic", err.status, err.message);
      return NextResponse.json({ error: "ai_error" }, { status: 502 });
    }
    return errorResponse(err);
  }
}
