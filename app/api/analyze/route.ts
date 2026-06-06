import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser, errorResponse } from "@/lib/auth";
import { resolveSpecialist } from "@/lib/specialists";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Sonnet 4.6: otimo em visao, rapido e ~45% mais barato que Opus (bom p/ alto volume clinico).
const MODEL = process.env.ANALYZE_MODEL || "claude-sonnet-4-6";

type AnalyzeCtx = {
  resumo?: string;
  vitais?: Record<string, unknown>;
  idade?: number;
  peso?: number;
  sexo?: string;
  respostas?: { pergunta: string; resposta: string }[];
  comFunil?: boolean;
};

function contextoClinico(ctx: AnalyzeCtx): string {
  const linhas: string[] = [];
  if (ctx.idade != null) linhas.push(`Idade: ${ctx.idade} anos`);
  if (ctx.sexo) linhas.push(`Sexo: ${ctx.sexo}`);
  if (ctx.peso != null) linhas.push(`Peso: ${ctx.peso} kg`);
  if (ctx.resumo) linhas.push(`Resumo clínico do médico: ${ctx.resumo}`);
  if (ctx.vitais && Object.keys(ctx.vitais).length) linhas.push(`Vitais informados: ${JSON.stringify(ctx.vitais)}`);
  if (ctx.respostas?.length) {
    linhas.push("Respostas do médico ao funil de perguntas:");
    ctx.respostas.forEach((r) => linhas.push(`- ${r.pergunta} → ${r.resposta}`));
  }
  return linhas.length ? linhas.join("\n") : "(sem dados clínicos adicionais — baseie-se só na imagem)";
}

// Monta o prompt do AGENTE ESPECIALISTA da condicao (evidencia curada embutida + contexto do paciente).
function buildSystem(condutaId: string, area: string, ctx: AnalyzeCtx): string {
  const spec = resolveSpecialist(condutaId);
  const papel = spec?.papel ?? `médico emergencista sênior${area ? `, especialista em: ${area}` : " de sala vermelha"}`;
  const evid = (spec?.evidencias ?? []).map((e) => `- ${e.fato} [${e.fonte}]`).join("\n");
  const ler = (spec?.oQueLer ?? ["FC", "ritmo/traçado", "SpO2", "PA/PNI", "FR", "Tax", "glicemia", "alarmes"]).map((s) => `- ${s}`).join("\n");
  const red = (spec?.redFlags ?? []).map((s) => `- ${s}`).join("\n");
  const acao = spec?.acaoPrioritaria ?? "";
  const fontes = (spec?.fontes ?? []).join("; ");
  const funilInstr = ctx.comFunil
    ? `\n- perguntas: 2 a 4 perguntas CURTAS de esclarecimento que tornariam o diagnóstico/conduta mais precisos, CADA uma com 3-4 "opcoes" objetivas pro médico clicar (ex.: nível de consciência, PA atual, tempo de evolução, resposta a medida já tomada). Pergunte SÓ o que muda a conduta. Se a imagem já bastar, devolva [].`
    : "";

  return `Você é um ${papel}, analisando à beira-leito uma FOTO de ECG e/ou monitor multiparamétrico de um paciente GRAVE em sala vermelha. O tempo é crítico — seja rápido e direto.

EVIDÊNCIA DE REFERÊNCIA (fundamente a leitura nestes dados; fonte entre colchetes):
${evid || "- (use seu conhecimento das diretrizes atuais)"}

O QUE LER NESTA IMAGEM (foco para ${area || "esta condição"}):
${ler}

RED FLAGS / ESCALONAMENTO:
${red || "- (use julgamento clínico para sinais de gravidade)"}
${acao ? `\nAÇÃO PRIORITÁRIA: ${acao}` : ""}

DADOS CLÍNICOS DESTE PACIENTE (use junto com a imagem):
${contextoClinico(ctx)}

REGRAS:
- Leia APENAS o que está visível na imagem (não invente dados; aponte sensor solto/artefato/PA não aferida). Use os dados clínicos acima como contexto.
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
- fontes: nomes das diretrizes/evidências em que a leitura se baseou.
- mensagemPlantonista: UMA mensagem clínica curta e profissional PARA UM MÉDICO PLANTONISTA (pedido de segunda opinião), escrita em PRIMEIRA PESSOA como o médico que conduz o caso. Apresente o paciente, a principal hipótese e a conduta pretendida e PEÇA confirmação/ajuste. NUNCA mencione "IA"/"inteligência artificial"/"modelo". Ex.: "Paciente ${ctx.idade ? ctx.idade + "a" : ""}, quadro de ..., penso em ... e pretendo ... Confirma a conduta?"${funilInstr}`;
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
    mensagemPlantonista: { type: "string" },
    perguntas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          pergunta: { type: "string" },
          opcoes: { type: "array", items: { type: "string" } },
        },
        required: ["pergunta", "opcoes"],
        additionalProperties: false,
      },
    },
  },
  required: ["condutaImediata", "resumo", "achados", "hipoteses", "conduta", "alertas", "gravidade", "fontes", "mensagemPlantonista"],
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

    const ctx: AnalyzeCtx = {
      resumo: String(body.resumo || "").trim().slice(0, 1200) || undefined,
      vitais: body.vitais && typeof body.vitais === "object" ? (body.vitais as Record<string, unknown>) : undefined,
      idade: Number.isFinite(Number(body.idade)) ? Number(body.idade) : undefined,
      peso: Number.isFinite(Number(body.peso)) ? Number(body.peso) : undefined,
      sexo: body.sexo ? String(body.sexo).slice(0, 12) : undefined,
      respostas: Array.isArray(body.respostas)
        ? body.respostas.slice(0, 8).map((r: { pergunta?: unknown; resposta?: unknown }) => ({
            pergunta: String(r?.pergunta || "").slice(0, 300),
            resposta: String(r?.resposta || "").slice(0, 300),
          }))
        : undefined,
      comFunil: !!body.comFunil,
    };

    const client = new Anthropic();
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      // Sem thinking + effort baixo => resposta rapida (paciente na sala vermelha).
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      system: buildSystem(condutaId, area, ctx),
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
