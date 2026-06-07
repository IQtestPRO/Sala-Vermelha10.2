import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser, errorResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.CHAT_MODEL || process.env.ANALYZE_MODEL || "claude-sonnet-4-6";

const SYSTEM = `Você é o STAT, assistente de emergência (sala vermelha) para MÉDICOS — APOIO À DECISÃO. Fale português, objetivo e clínico, em tom de colega experiente.

FLUXO da conversa (siga sempre):
1) O médico te manda uma FOTO (ECG/monitor/exame) e uma descrição breve. Faça uma LEITURA INICIAL curta do caso.
2) FAÇA 2 a 4 PERGUNTAS específicas e objetivas que MUDARIAM a conduta (nível de consciência, PA atual, tempo de evolução, comorbidades, resposta a medidas já tomadas, glicemia, etc.). Pergunte só o que importa.
3) Quando o médico responder, REFINE e entregue:
   • Hipóteses (mais provável primeiro)
   • Conduta imediata (PADRÃO-OURO), com doses de referência
   • "UPA:" — a SEGUNDA VERTENTE adaptada à realidade do SUS/UPA: o que fazer quando falta o recurso/droga ideal (substituições por drogas REALMENTE disponíveis na UPA, improvisos seguros, e quando estabilizar + acionar a regulação/transferir).
   • Quando útil, a diluição/BIC (mL/h) das drogas em infusão.

REGRAS:
- Fundamente nas DIRETRIZES mais atuais da especialidade (AHA/ACLS, ESC, SBC, AHA/ASA Stroke, Surviving Sepsis, WAO...). Cite a diretriz quando relevante; não invente referências nem URLs.
- Doses/energias são REFERÊNCIA — o médico confere e aprova. Isto é apoio à decisão.
- Pode continuar discutindo o caso quantas vezes o médico quiser; mantenha o raciocínio clínico.
- Seja conciso e prático (sala vermelha). Não diga que é "IA" ao redigir mensagens a terceiros.`;

type InMsg = { role: "user" | "assistant"; text?: string; image?: string };

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
    }
    // Especialidade + memória do médico: adapta profundidade, terminologia e contexto.
    const ctxMed = [
      user.specialty ? `Especialidade: ${user.specialty}` : "",
      user.perfil_medico ? `Como trabalha: ${String(user.perfil_medico).slice(0, 2000)}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    const system = ctxMed
      ? `${SYSTEM}\n\nADAPTE A ESTE MÉDICO — calibre a PROFUNDIDADE e a TERMINOLOGIA pela especialidade dele e fundamente em artigos/diretrizes DA ÁREA; respeite o contexto de trabalho: ${ctxMed}`
      : SYSTEM;
    const body = await req.json();
    const msgs: InMsg[] = Array.isArray(body.messages) ? body.messages.slice(-24) : [];
    if (!msgs.length) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

    const anthropicMsgs: Anthropic.MessageParam[] = msgs
      .map((m) => {
        const content: Anthropic.ContentBlockParam[] = [];
        if (m.image && m.role === "user") {
          const data = m.image.length > 9_000_000 ? "" : m.image;
          if (data) content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data } });
        }
        const text = String(m.text || "").slice(0, 6000);
        if (text) content.push({ type: "text", text });
        if (!content.length) return null;
        return { role: m.role, content };
      })
      .filter(Boolean) as Anthropic.MessageParam[];

    if (!anthropicMsgs.length) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

    const client = new Anthropic();
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 2200,
      output_config: { effort: "low" },
      system,
      messages: anthropicMsgs,
    } as Anthropic.MessageStreamParams);

    const encoder = new TextEncoder();
    const rs = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch (e) {
          console.error("[api/chat] stream", e);
          controller.enqueue(encoder.encode("\n\n[Falha ao gerar a resposta. Tente de novo.]"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(rs, {
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" },
    });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error("[api/chat] anthropic", err.status, err.message);
      return NextResponse.json({ error: "ai_error" }, { status: 502 });
    }
    return errorResponse(err);
  }
}
