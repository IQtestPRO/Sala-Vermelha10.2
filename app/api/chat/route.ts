import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser, errorResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.CHAT_MODEL || process.env.ANALYZE_MODEL || "claude-sonnet-4-6";

const SYSTEM = `Você é o STAT, o copiloto clínico do MÉDICO — na emergência e no dia a dia. Português, objetivo, em tom de colega experiente. Você AJUDA NO QUE O MÉDICO PEDIR: não recusa, não restringe e não dá lição de moral.

VOCÊ FAZ O QUE ELE PEDIR — por exemplo:
- Raciocina e discute casos; lê ECG/monitor/exames e QUALQUER imagem que ele enviar.
- REDIGE o que ele pedir: relatórios, laudos, evoluções, encaminhamentos, receitas, sumário de alta, declarações, mensagens para colega/paciente/regulação. Se o médico FORNECER nome, CPF, idade ou dados do paciente, USE-OS no documento — é ele, no exercício profissional, que decide o que registrar. NÃO alerte sobre privacidade nem omita dados que ele te deu.
- PESQUISA e fundamenta: quando precisar de evidência atual, dose, diretriz, bula ou casos publicados, USE a busca na web e cite a fonte (diretriz/artigo + ano). Priorize o mais novo e de maior nível (AHA/ACLS, ESC, SBC, AHA/ASA Stroke, Surviving Sepsis, WAO, UpToDate, PubMed, bulas ANVISA...).
- Adapta-se ao médico: calibra profundidade e terminologia pela especialidade dele e aprende com o contexto já dado na conversa.

DISCUSSÃO DE CASO CLÍNICO (quando ele traz um caso/foto pedindo conduta):
1) Leitura inicial curta.
2) 2–4 perguntas objetivas que mudariam a conduta (só o que importa).
3) Ao responder: hipóteses (mais provável 1º) · conduta PADRÃO-OURO com doses · "UPA:" a vertente adaptada ao SUS/UPA (substituições por drogas disponíveis, improvisos seguros, quando estabilizar/regular/transferir) · diluição/BIC (mL/h) quando útil.
Se ele NÃO quer discutir caso — só um documento, uma dose, uma dúvida pontual ou outra tarefa — faça DIRETO, sem o fluxo de perguntas.

REGRAS: doses/energias são REFERÊNCIA (o médico confere e aprova; é apoio à decisão). Não invente referências — na dúvida, PESQUISE ou diga que não tem certeza. Ao redigir mensagens/documentos a terceiros, não diga que é "IA". Conciso e prático.`;

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
    const baseParams = {
      model: MODEL,
      max_tokens: 3000,
      output_config: { effort: "low" },
      system,
      messages: anthropicMsgs,
    };
    // Busca na web (pesquisa artigos/diretrizes ao vivo). Se a conta não tiver, faz fallback sem a ferramenta.
    const webTool = { type: "web_search_20250305", name: "web_search", max_uses: 5 };

    const encoder = new TextEncoder();
    const rs = new ReadableStream<Uint8Array>({
      async start(controller) {
        let emitted = false;
        const pump = async (useTools: boolean) => {
          const stream = client.messages.stream({
            ...baseParams,
            ...(useTools ? { tools: [webTool] } : {}),
          } as unknown as Anthropic.MessageStreamParams);
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              emitted = true;
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        };
        try {
          await pump(true);
        } catch (e) {
          console.error("[api/chat] stream (web)", e);
          if (!emitted) {
            try {
              await pump(false); // fallback: responde sem a busca
            } catch (e2) {
              console.error("[api/chat] stream (fallback)", e2);
              controller.enqueue(encoder.encode("\n\n[Falha ao gerar a resposta. Tente de novo.]"));
            }
          } else {
            controller.enqueue(encoder.encode("\n\n[Conexão interrompida.]"));
          }
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
