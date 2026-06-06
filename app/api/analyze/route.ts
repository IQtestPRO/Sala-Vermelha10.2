import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser, errorResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.ANALYZE_MODEL || "claude-opus-4-8";

// Prompt de sistema ESPECIALIZADO na area/situacao clinica selecionada.
function buildSystem(area: string): string {
  const foco = area ? `, especialista em: ${area}` : " de sala vermelha";
  return `Você é um médico emergencista sênior${foco}, analisando à beira-leito uma FOTO de ECG e/ou monitor multiparamétrico de um paciente GRAVE em sala vermelha. O tempo é crítico — seja rápido e direto.

Leia APENAS o que está visível na imagem (FC, ritmo/traçado, SpO2, PA/PNI, FR, Tax, glicemia, alarmes). NUNCA invente dados ausentes. Quando um dado for não confiável (sensor desconectado, artefato, PA não aferida), diga isso explicitamente.

Avalie ESTE paciente especificamente, no contexto de "${area || "emergência"}". Doses/energias em valores de referência (o médico confere). Responda em português, em JSON, com:
- resumo: um parágrafo claro, objetivo e BEM ESCRITO, como um laudo médico curto — simples de entender, porém aprofundado. 3 a 5 frases.
- achados: leituras objetivas da imagem (inclua alarmes e dados não confiáveis).
- hipoteses: diagnósticos diferenciais priorizados (mais provável primeiro).
- conduta: próximos passos imediatos e específicos (droga/dose/energia quando aplicável).
- alertas: limitações, dados a confirmar, red flags, o que NÃO fazer.
- gravidade.

Isto é apoio à decisão; o médico assistente lê, confirma e aprova.`;
}

const SCHEMA = {
  type: "object",
  properties: {
    resumo: { type: "string" },
    achados: { type: "array", items: { type: "string" } },
    hipoteses: { type: "array", items: { type: "string" } },
    conduta: { type: "array", items: { type: "string" } },
    alertas: { type: "array", items: { type: "string" } },
    gravidade: { type: "string", enum: ["critico", "alto", "moderado", "baixo", "indeterminado"] },
  },
  required: ["resumo", "achados", "hipoteses", "conduta", "alertas", "gravidade"],
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
    const area = String(body.area || body.context || "").trim().slice(0, 200);
    if (!base64) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    if (base64.length > 9_000_000) return NextResponse.json({ error: "too_large" }, { status: 413 });

    const client = new Anthropic();
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      // Sem adaptive thinking + effort baixo => resposta rapida (paciente na sala vermelha).
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      system: buildSystem(area),
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
            { type: "text", text: `Área/situação: ${area || "emergência geral"}. Analise a imagem deste paciente e responda no JSON pedido, o mais rápido possível.` },
          ],
        },
      ],
    } as Anthropic.MessageCreateParamsNonStreaming);

    const textBlock = resp.content.find((b) => b.type === "text");
    const text = textBlock && "text" in textBlock ? textBlock.text : "";
    if (!text.trim()) return NextResponse.json({ error: "ai_no_output" }, { status: 502 });
    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "parse_error" }, { status: 502 });
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
