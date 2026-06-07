"use client";

import { useEffect, useRef, useState } from "react";
import { Send, ImagePlus, Loader2, X, Sparkles, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { resizeToJpegBase64 } from "@/lib/image";
import { LGPD_NOTA } from "@/lib/legal/disclaimer";

type Msg = { role: "user" | "assistant"; text: string; image?: string };

const GREETING =
  "Sou o STAT. Mande a foto do ECG/monitor/exame + uma descrição breve do caso. Eu faço a leitura, te pergunto o que falta e devolvo conduta padrão-ouro e a alternativa para UPA/SUS.";

// Render leve de markdown: títulos (#), negrito (**), bullets e quebras de linha.
function inline(s: string, key: string) {
  return s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? <b key={key + i}>{p.slice(2, -2)}</b> : <span key={key + i}>{p}</span>
  );
}
function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {lines.map((line, i) => {
        const h = line.match(/^\s*(#{1,6})\s+(.*)/);
        if (h) return <div key={i} style={{ fontWeight: 800, fontSize: 14, margin: i ? "8px 0 2px" : "0 0 2px" }}>{inline(h[2], "h" + i)}</div>;
        if (!line.trim()) return <div key={i} style={{ height: 5 }} />;
        return <div key={i} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.5 }}>{inline(line, "l" + i)}</div>;
      })}
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function pickImage(files: FileList | null) {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const b = await resizeToJpegBase64(file);
      setPendingImage(b);
    } catch {
      toast.error("Não consegui ler a imagem.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function send() {
    const text = input.trim();
    if ((!text && !pendingImage) || busy) return;
    const userMsg: Msg = { role: "user", text, image: pendingImage ?? undefined };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setPendingImage(null);
    setBusy(true);
    setMessages((m) => [...m, { role: "assistant", text: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, text: m.text, image: m.image })) }),
      });
      if (res.status === 503) {
        toast.error("IA ainda não configurada (ANTHROPIC_API_KEY).");
        setMessages((m) => m.slice(0, -1));
        return;
      }
      if (!res.ok || !res.body) {
        toast.error("A IA não respondeu agora. Tente de novo.");
        setMessages((m) => m.slice(0, -1));
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((m) => {
          const c = [...m];
          c[c.length - 1] = { role: "assistant", text: acc };
          return c;
        });
      }
    } catch {
      toast.error("Falha de conexão.");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="chat-root">
      {/* Cabeçalho */}
      <div className="chat-top">
        <span className="chat-top-badge"><Sparkles size={15} /></span>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>STAT IA</span>
          <span className="faint" style={{ fontSize: 11.5 }}>Discuta o caso — análise, perguntas e conduta</span>
        </div>
      </div>

      {/* Mensagens */}
      <div className="chat-scroll">
        {messages.length === 0 && (
          <div className="chat-bubble chat-bot">
            <div className="chat-bot-head"><Stethoscope size={14} /> STAT</div>
            <RichText text={GREETING} />
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role === "user" ? "chat-me" : "chat-bot"}`}>
            {m.role === "assistant" && <div className="chat-bot-head"><Stethoscope size={14} /> STAT</div>}
            {m.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`data:image/jpeg;base64,${m.image}`} alt="anexo" className="chat-img" />
            )}
            {m.text ? <RichText text={m.text} /> : busy && i === messages.length - 1 ? (
              <span className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <Loader2 size={15} className="spin" /> Analisando…
              </span>
            ) : null}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Barra de envio */}
      <div className="chat-input-bar">
        {pendingImage && (
          <div className="chat-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`data:image/jpeg;base64,${pendingImage}`} alt="prévia" />
            <button onClick={() => setPendingImage(null)} aria-label="Remover imagem"><X size={14} /></button>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <button className="chat-attach" onClick={() => fileRef.current?.click()} aria-label="Anexar imagem" disabled={busy}>
            <ImagePlus size={20} />
          </button>
          <textarea
            className="field chat-textarea"
            placeholder="Descreva o caso ou responda…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
          />
          <button className="chat-send" onClick={send} disabled={busy || (!input.trim() && !pendingImage)} aria-label="Enviar">
            {busy ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
          </button>
        </div>
        <div className="faint" style={{ fontSize: 10.5, lineHeight: 1.35, marginTop: 6 }}>{LGPD_NOTA}</div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickImage(e.target.files)} />
    </div>
  );
}
