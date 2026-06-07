"use client";

import { useCallback, useEffect, useState } from "react";
import { Lightbulb, Bug, Sparkles, Send } from "lucide-react";
import TopBar, { LogoutButton } from "@/components/TopBar";
import VoiceButton from "@/components/VoiceButton";
import { apiGet, apiPost } from "@/lib/client";
import { toast } from "sonner";

type Tipo = "ideia" | "problema" | "melhoria";
type FB = { id: string; tipo: string; texto: string; app_ref: string | null; status: string; created_at: number };

const TIPOS: { k: Tipo; label: string; icon: React.ReactNode }[] = [
  { k: "ideia", label: "Ideia / funcionalidade", icon: <Lightbulb size={16} /> },
  { k: "problema", label: "Problema / bug", icon: <Bug size={16} /> },
  { k: "melhoria", label: "Melhoria", icon: <Sparkles size={16} /> },
];
const tipoLabel = (t: string) => TIPOS.find((x) => x.k === t)?.label ?? t;
const statusLabel = (s: string) => (s === "feito" ? "Feito ✓" : s === "visto" ? "Em análise" : "Recebido");
const quando = (ts: number) => new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });

export default function SuportePage() {
  const [tipo, setTipo] = useState<Tipo>("ideia");
  const [texto, setTexto] = useState("");
  const [appRef, setAppRef] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [meus, setMeus] = useState<FB[]>([]);

  const load = useCallback(async () => {
    try {
      const r = await apiGet<{ feedback: FB[] }>("/api/feedback");
      setMeus(r.feedback);
    } catch {
      /* noop */
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function enviar() {
    if (texto.trim().length < 3) return toast.error("Escreva sua mensagem.");
    setEnviando(true);
    try {
      await apiPost("/api/feedback", { tipo, texto, app_ref: appRef });
      toast.success("Enviado! Obrigado pela contribuição.");
      setTexto("");
      setAppRef("");
      load();
    } catch {
      toast.error("Não consegui enviar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <TopBar brand title="Ideias e suporte" subtitle="Sua opinião melhora o STAT" right={<LogoutButton />} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, paddingBottom: 96 }}>
        <div className="card-2" style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.5, boxShadow: "none" }}>
          Mande uma <b>ideia</b>, conte um <b>problema</b> que deu errado, ou peça uma <b>funcionalidade</b> que você viu em outro app. Tudo vai direto pra equipe — é assim que decidimos o que entra no STAT.
        </div>

        <div>
          <label className="label">Tipo</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {TIPOS.map((t) => (
              <button key={t.k} className={`chip ${tipo === t.k ? "chip-on" : ""}`} onClick={() => setTipo(t.k)} style={{ justifyContent: "flex-start", gap: 8, minHeight: 46 }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label className="label">Sua mensagem</label>
            <VoiceButton value={texto} onChange={setTexto} />
          </div>
          <textarea
            className="field"
            rows={5}
            placeholder={tipo === "problema" ? "O que deu errado? Em que tela aconteceu?" : "Descreva sua ideia ou o que gostaria que melhorasse…"}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            style={{ resize: "vertical", lineHeight: 1.5 }}
          />
        </div>

        <div>
          <label className="label">App de referência (opcional)</label>
          <input className="field" placeholder="Ex.: vi no ACLS Helper / UpToDate / Plantãozinho…" value={appRef} onChange={(e) => setAppRef(e.target.value)} style={{ minHeight: 48 }} />
        </div>

        <button className="btn btn-primary" disabled={enviando} onClick={enviar} style={{ minHeight: 52 }}>
          <Send size={18} /> {enviando ? "Enviando…" : "Enviar"}
        </button>

        {meus.length > 0 && (
          <div>
            <div className="eyebrow" style={{ margin: "6px 0 8px" }}>Seus envios</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {meus.map((m) => (
                <div key={m.id} className="card" style={{ padding: "11px 13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 12.5, color: "var(--primary)" }}>{tipoLabel(m.tipo)}</span>
                    <span className="faint" style={{ fontSize: 11 }}>{statusLabel(m.status)} · {quando(m.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.45, color: "var(--text-dim)" }}>{m.texto}</div>
                  {m.app_ref && <div className="faint" style={{ fontSize: 11.5, marginTop: 3 }}>Ref.: {m.app_ref}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
