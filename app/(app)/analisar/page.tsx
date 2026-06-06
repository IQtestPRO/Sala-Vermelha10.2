"use client";

import { useRef, useState } from "react";
import { Camera, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import TopBar, { LogoutButton } from "@/components/TopBar";
import AnalysisResult, { Analysis } from "@/components/AnalysisResult";
import { resizeToJpegBase64 } from "@/lib/image";
import { LGPD_NOTA } from "@/lib/legal/disclaimer";

export default function AnalisarPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);

  async function pick(files: FileList | null) {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const b = await resizeToJpegBase64(file);
      setBase64(b);
      setResult(null);
    } catch {
      toast.error("Não consegui ler a imagem.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function analyze() {
    if (!base64) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image_base64: base64, context }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 503) {
        toast.error("IA ainda não configurada (defina ANTHROPIC_API_KEY na Vercel).");
        return;
      }
      if (!res.ok) {
        toast.error("A IA não conseguiu analisar agora. Tente de novo.");
        return;
      }
      setResult(data.analysis as Analysis);
    } catch {
      toast.error("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TopBar title="Analisar com IA" subtitle="ECG / monitor — leitura individual" right={<LogoutButton />} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, paddingBottom: 28 }}>
        {!base64 ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="card"
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "32px 16px", cursor: "pointer", borderStyle: "dashed", borderColor: "var(--border-strong)" }}
          >
            <div style={{ width: 60, height: 60, borderRadius: 16, background: "var(--navy-tint)", color: "var(--navy)", display: "grid", placeItems: "center" }}>
              <Camera size={30} />
            </div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Fotografar ECG / monitor</div>
            <div className="faint" style={{ fontSize: 12.5, textAlign: "center", lineHeight: 1.4 }}>{LGPD_NOTA}</div>
          </button>
        ) : (
          <div style={{ position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/jpeg;base64,${base64}`}
              alt="Imagem capturada"
              style={{ width: "100%", borderRadius: 16, border: "1px solid var(--border)" }}
            />
            <button
              onClick={() => inputRef.current?.click()}
              className="chip"
              style={{ position: "absolute", top: 10, right: 10, minHeight: 36, background: "rgba(255,255,255,0.92)" }}
            >
              <RefreshCw size={15} /> Trocar
            </button>
          </div>
        )}

        <input ref={inputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pick(e.target.files)} />

        <div>
          <label className="label">Contexto (opcional)</label>
          <input
            className="field"
            placeholder="Ex.: homem 64a, dor torácica, hipotenso"
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" disabled={!base64 || loading} onClick={analyze}>
          {loading ? <Loader2 size={20} className="spin" /> : <Sparkles size={20} />}
          {loading ? "Analisando…" : "Analisar com IA"}
        </button>

        {loading && (
          <div className="muted" style={{ fontSize: 13, textAlign: "center" }}>
            A IA está lendo a imagem deste paciente…
          </div>
        )}

        {result && <AnalysisResult a={result} />}
      </div>
    </>
  );
}
