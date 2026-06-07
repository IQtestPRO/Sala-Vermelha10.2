"use client";

import { useEffect, useRef, useState } from "react";
import { Send, ImagePlus, Loader2, X, Stethoscope, History, SquarePen, Trash2 } from "lucide-react";
import EcgIcon from "@/components/icons/EcgIcon";
import { toast } from "sonner";
import { resizeToJpegBase64 } from "@/lib/image";
import VoiceButton from "@/components/VoiceButton";
import { apiGet, apiPost } from "@/lib/client";

type Msg = { role: "user" | "assistant"; text: string; image?: string; imageUrl?: string };
type ChatRef = { id: string; title: string; updated_at: number };

const GREETING =
  "Sou o STAT. Mande a foto do ECG/monitor/exame + uma descrição breve do caso. Eu faço a leitura, te pergunto o que falta e devolvo conduta padrão-ouro e a alternativa para UPA/SUS.";

function quando(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "agora";
  if (s < 3600) return `há ${Math.floor(s / 60)} min`;
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  return `há ${Math.floor(s / 86400)} d`;
}

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
  const [pendingImage, setPendingImage] = useState<{ base64: string; url?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [showHist, setShowHist] = useState(false);
  const [hist, setHist] = useState<ChatRef[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);
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
      setPendingImage({ base64: b });
      // Sobe ao Blob (best-effort) p/ persistir no historico sem guardar base64.
      try {
        const res = await fetch("/api/upload", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ base64: b }) });
        const d = await res.json().catch(() => ({}));
        if (res.ok && d.url) setPendingImage((p) => (p ? { ...p, url: d.url } : p));
      } catch {
        /* segue só com base64 (vision desta sessão) */
      }
    } catch {
      toast.error("Não consegui ler a imagem.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function saveChat(msgs: Msg[]) {
    try {
      const payload = msgs.map((m) => ({ role: m.role, text: m.text, imageUrl: m.imageUrl }));
      const r = await apiPost<{ id: string }>("/api/chats", { id: chatId, messages: payload });
      if (r?.id) setChatId(r.id);
    } catch {
      /* salvar é best-effort; não atrapalha a conversa */
    }
  }

  async function send() {
    const text = input.trim();
    if ((!text && !pendingImage) || busy) return;
    const userMsg: Msg = { role: "user", text, image: pendingImage?.base64, imageUrl: pendingImage?.url };
    const next = [...messages, userMsg];
    setMessages([...next, { role: "assistant", text: "" }]);
    setInput("");
    setPendingImage(null);
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, text: m.text, image: m.image })) }),
      });
      if (res.status === 503) {
        toast.error("IA ainda não configurada (ANTHROPIC_API_KEY).");
        setMessages(next);
        return;
      }
      if (!res.ok || !res.body) {
        toast.error("A IA não respondeu agora. Tente de novo.");
        setMessages(next);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", text: acc }]);
      }
      void saveChat([...next, { role: "assistant", text: acc }]);
    } catch {
      toast.error("Falha de conexão.");
      setMessages(next);
    } finally {
      setBusy(false);
    }
  }

  function novaConversa() {
    if (busy) return;
    setMessages([]);
    setChatId(null);
    setPendingImage(null);
    setInput("");
    setShowHist(false);
  }

  async function abrirHistorico() {
    setShowHist(true);
    setLoadingHist(true);
    try {
      const r = await apiGet<{ chats: ChatRef[] }>("/api/chats");
      setHist(r.chats || []);
    } catch {
      toast.error("Não consegui carregar o histórico.");
    } finally {
      setLoadingHist(false);
    }
  }

  async function abrirChat(id: string) {
    try {
      const r = await apiGet<{ id: string; messages: Msg[] }>(`/api/chats/${id}`);
      setMessages(r.messages || []);
      setChatId(r.id);
      setShowHist(false);
    } catch {
      toast.error("Não consegui abrir a conversa.");
    }
  }

  async function apagarChat(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await fetch(`/api/chats/${id}`, { method: "DELETE" });
      setHist((h) => h.filter((c) => c.id !== id));
      if (chatId === id) novaConversa();
    } catch {
      toast.error("Não consegui apagar.");
    }
  }

  return (
    <div className="chat-root">
      <div className="chat-top">
        <span className="chat-top-badge"><EcgIcon size={20} stroke={2} /></span>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15, flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>STAT IA</span>
          <span className="faint" style={{ fontSize: 12, fontStyle: "italic", letterSpacing: "0.02em" }}>Do it stat</span>
        </div>
        <button className="chat-top-btn" onClick={abrirHistorico} aria-label="Histórico de conversas"><History size={19} /></button>
        <button className="chat-top-btn" onClick={novaConversa} aria-label="Nova conversa"><SquarePen size={19} /></button>
      </div>

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
            {(m.image || m.imageUrl) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.image ? `data:image/jpeg;base64,${m.image}` : m.imageUrl} alt="anexo" className="chat-img" />
            )}
            {m.text ? (
              <RichText text={m.text} />
            ) : busy && i === messages.length - 1 ? (
              <span className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <Loader2 size={15} className="spin" /> Analisando…
              </span>
            ) : null}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="chat-input-bar">
        {pendingImage && (
          <div className="chat-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`data:image/jpeg;base64,${pendingImage.base64}`} alt="prévia" />
            <button onClick={() => setPendingImage(null)} aria-label="Remover imagem"><X size={14} /></button>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <button className="chat-attach" onClick={() => fileRef.current?.click()} aria-label="Anexar imagem" disabled={busy}>
            <ImagePlus size={20} />
          </button>
          <VoiceButton value={input} onChange={setInput} />
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
      </div>

      {showHist && (
        <div className="chat-hist-overlay" onClick={() => setShowHist(false)}>
          <div className="chat-hist" onClick={(e) => e.stopPropagation()}>
            <div className="chat-hist-head">
              <span style={{ fontWeight: 800, fontSize: 15 }}>Histórico de conversas</span>
              <button className="chat-top-btn" onClick={() => setShowHist(false)} aria-label="Fechar"><X size={18} /></button>
            </div>
            <button className="btn btn-primary btn-sm" style={{ margin: "0 14px 8px" }} onClick={novaConversa}>
              <SquarePen size={16} /> Nova conversa
            </button>
            <div className="chat-hist-list">
              {loadingHist ? (
                <div className="muted" style={{ padding: 16, textAlign: "center" }}><Loader2 size={16} className="spin" /> Carregando…</div>
              ) : hist.length === 0 ? (
                <div className="faint" style={{ padding: 16, textAlign: "center", fontSize: 13 }}>Nenhuma conversa salva ainda.</div>
              ) : (
                hist.map((c) => (
                  <div key={c.id} className={`chat-hist-item ${chatId === c.id ? "on" : ""}`} onClick={() => abrirChat(c.id)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div>
                      <div className="faint" style={{ fontSize: 11.5 }}>{quando(c.updated_at)}</div>
                    </div>
                    <button className="chat-hist-del" onClick={(e) => apagarChat(c.id, e)} aria-label="Apagar"><Trash2 size={15} /></button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickImage(e.target.files)} />
    </div>
  );
}
