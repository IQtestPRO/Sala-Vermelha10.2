import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser, errorResponse } from "@/lib/auth";
import { resolveSpecialist } from "@/lib/specialists";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Sonnet 4.6: otimo em visao, rapido e ~45% mais barato que Opus (bom p/ alto volume clinico).
const MODEL = process.env.ANALYZE_MODEL || "claude-sonnet-4-6";

// Monta o prompt do AGENTE ESPECIALISTA da condicao (evidencia curada embutida).
function buildSystem(condutaId: string, area: string): string {
  const spec = resolveSpecialist(condutaId);
  const papel = spec?.papel ?? `médico emergencista sênior${area ? `, especialista em: ${area}` : " de sala vermelha"}`;
  const evid = (spec?.evidencias ?? []).map((e) => `- ${e.fato} [${e.fonte}]`).join("\n");
  const ler = (spec?.oQueLer ?? ["FC", "ritmo/traçado", "SpO2", "PA/PNI", "FR", "Tax", "glicemia", "alarmes"]).map((s) => `- ${s}`).join("\n");
  const red = (spec?.redFlags ?? []).map((s) => `- ${s}`).join("\n");
  const acao = spec?.acaoPrioritaria ?? "";
  const fontes = (spec?.fontes ?? []).join("; ");

  return `Você é um ${papel}, analisando à beira-leito uma FOTO de ECG e/ou monitor multiparamétrico de um paciente GRAVE em sala vermelha. O tempo é crítico — seja rápido e direto.

EVIDÊNCIA DE REFERÊNCIA (fundamente a leitura nestes dados; fonte entre colchetes):
${evid || "- (use seu conhecimento das diretrizes atuais)"}

O QUE LER NESTA IMAGEM (foco para ${area || "esta condição"}):
${ler}

RED FLAGS / ESCALONAMENTO:
${red || "- (use julgamento clínico para sinais de gravidade)"}
${acao ? `\nAÇÃO PRIORITÁRIA: ${acao}` : ""}

REGRAS:
- Leia APENAS o que está visível (não invente dados; aponte sensor solto/artefato/PA não aferida).
- Doses/energias são valores de REFERÊNCIA — o médico confere e aprova.
- Fundamente as recomendações na EVIDÊNCIA acima e em LITERATURA/ESTUDOS DE REFERÊNCIA RENOMADOS e em padrões de CASOS REAIS consolidados (ex.: critérios de Sgarbossa/Smith, de Winter, Wellens, Brugada; grandes ensaios e diretrizes de sociedades). NÃO cite URLs nem invente referências; em "fontes" liste só nomes de diretrizes/estudos usados (ex.: ${fontes || "AHA/ACLS 2020, SBC"}).
- Isto é APOIO À DECISÃO; o médico assistente lê, confirma e aprova.

Responda em português, em JSON:
- condutaImediata: UMA linha decisiva — o que fazer AGORA (droga/dose/energia/marca-passo). A ação mais urgente, direto ao ponto.
- resumo: parágrafo de laudo curto e bem escrito (3 a 5 frases), simples porém aprofundado.
- achados: leituras objetivas da imagem (inclua alarmes e dados não confiáveis).
- hipoteses: diferenciais priorizados (mais provável primeiro).
- conduta: próximos passos imediatos e específicos.
- alertas: limitações, o que confirmar, red flags, o que NÃO fazer.
- gravidade.
- fontes: nomes das diretrizes/evidências em que a leitura se baseou.`;
}

const SCHEMA = {
  type: "object",
  properties: {
    condutaImediata: { type: "string" },
    resumo: { type: "string" },
    achados: { type: "array", items: { type: "string" } },
    hipoteses: { type: "array", items: { type: "string" } },
    conduta: { type: "array", items: { type: "string" } },
    alertas: { type: "array", items: { type: "string" } },
    gravidade: { type: "string", enum: ["critico", "alto", "moderado", "baixo", "indeterminado"] },
    fontes: { type: "array", items: { type: "string" } },
  },
  required: ["condutaImediata", "resumo", "achados", "hipoteses", "conduta", "alertas", "gravidade", "fontes"],
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
    const condutaId = String(body.conduta_id || "").trim().slice(0, 64);
    const area = String(body.area || body.context || "").trim().slice(0, 200);
    if (!base64) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
    if (base64.length > 9_000_000) return NextResponse.json({ error: "too_large" }, { status: 413 });

    const client = new Anthropic();
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      // Sem thinking + effort baixo => resposta rapida (paciente na sala vermelha).
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      system: buildSystem(condutaId, area),
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
