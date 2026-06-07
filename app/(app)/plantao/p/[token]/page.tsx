"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Share2, Send, Check, Lock } from "lucide-react";
import TopBar from "@/components/TopBar";
import VoiceButton from "@/components/VoiceButton";
import { apiGet, apiPost } from "@/lib/client";
import { toast } from "sonner";

type Entry = { author_name: string | null; texto: string; created_at: number };
type Handoff = { token: string; paciente: string; idade: string | null; leito: string | null; status: string; author_name: string | null; created_at: number; updated_at: number };

function quando(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function PassagemPage() {
  const { token } = useParams<{ token: string }>();
  const [h, setH] = useState<Handoff | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [texto, setTexto] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await apiGet<{ handoff: Handoff; entries: Entry[] }>(`/api/handoffs/${token}`);
      setH(r.handoff);
      setEntries(r.entries);
    } catch {
      setErro(true);
    } finally {
      setLoading(false);
    }
  }, [token]);
  useEffect(() => {
    load();
  }, [load]);

  async function continuar() {
    if (!texto.trim()) return;
    setSaving(true);
    try {
      await apiPost(`/api/handoffs/${token}/entries`, { texto });
      setTexto("");
      toast.success("Adicionado à passagem.");
      load();
    } catch {
      toast.error("Não consegui salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function encerrar() {
    const novo = h?.status === "ativo" ? "encerrado" : "ativo";
    await fetch(`/api/handoffs/${token}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: novo }) });
    toast.success(novo === "encerrado" ? "Passagem encerrada." : "Passagem reaberta.");
    load();
  }

  async function compartilhar() {
    const url = `${window.location.origin}/plantao/p/${token}`;
    const texto = `Passagem de plantão — ${h?.paciente || ""}\nAbra e continue: ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Passagem de plantão", text: texto, url });
        return;
      }
    } catch {
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  }

  if (loading) return <div className="app-main" style={{ alignItems: "center", justifyContent: "center" }}><div className="muted">Carregando…</div></div>;
  if (erro || !h) {
    return (
      <>
        <TopBar brand title="Passagem" right={<Link href="/plantao" className="btn btn-ghost btn-sm">Voltar</Link>} />
        <div className="muted" style={{ textAlign: "center", padding: 40 }}>Passagem não encontrada.</div>
      </>
    );
  }

  return (
    <>
      <TopBar brand title={h.paciente} subtitle={[h.idade, h.leito ? "leito " + h.leito : null].filter(Boolean).join(" · ") || "Passagem de plantão"} right={
        <button className="btn btn-ghost btn-sm" onClick={compartilhar} style={{ color: "var(--green)" }}><Share2 size={16} /></button>
      } />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, paddingBottom: 28 }}>
        <Link href="/plantao" className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }}><ChevronLeft size={16} /> Plantão</Link>

        {h.status === "encerrado" && (
          <div className="card-2" style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, color: "var(--text-dim)", boxShadow: "none" }}>
            <Lock size={14} /> Passagem encerrada (somente leitura do histórico).
          </div>
        )}

        {/* Thread (histórico completo — tudo que cada médico passou) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {entries.map((e, i) => (
            <div key={i} className="card" style={{ padding: "11px 13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 800, fontSize: 12.5, color: "var(--primary)" }}>{e.author_name || "Médico"}</span>
                <span className="faint" style={{ fontSize: 11 }}>{quando(e.created_at)}</span>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{e.texto}</div>
            </div>
          ))}
          {entries.length === 0 && <div className="muted" style={{ textAlign: "center", padding: 12 }}>Sem anotações ainda.</div>}
        </div>

        {/* Continuar */}
        {h.status !== "encerrado" && (
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="label" style={{ margin: 0 }}>Continuar a passagem</label>
              <VoiceButton value={texto} onChange={setTexto} />
            </div>
            <textarea className="field" rows={4} placeholder="O que você fez/observou neste plantão, novas pendências…" value={texto} onChange={(e) => setTexto(e.target.value)} style={{ resize: "vertical", lineHeight: 1.5 }} />
            <button className="btn btn-primary" disabled={saving || !texto.trim()} onClick={continuar} style={{ minHeight: 48 }}>
              <Send size={17} /> {saving ? "Salvando…" : "Adicionar à passagem"}
            </button>
          </div>
        )}

        <button className="btn btn-ghost btn-sm" onClick={encerrar} style={{ alignSelf: "center" }}>
          {h.status === "ativo" ? <><Check size={15} /> Encerrar passagem</> : "Reabrir passagem"}
        </button>
      </div>
    </>
  );
}
