"use client";

import { useRef, useState } from "react";
import { Camera, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { resizeToJpegBase64 } from "@/lib/image";
import AnalysisResult, { Analysis } from "./AnalysisResult";
import { MultiStepLoader } from "./ui/multi-step-loader";

const ANALYZE_STEPS = [
  { text: "Lendo a imagem do ECG / monitor" },
  { text: "Identificando ritmo e frequência" },
  { text: "Medindo intervalos e segmentos" },
  { text: "Cruzando com diretrizes (AHA · ESC · SBC)" },
  { text: "Levantando hipóteses diagnósticas" },
  { text: "Definindo conduta e doses" },
];

// Análise de imagem por IA, ESPECIALIZADA na área (conduta_id). Reutilizado na
// Ação Rápida, nas Condutas e no Novo caso. Tira foto na hora (capture) ou envia.
export default function ImageAnalyzer({
  condutaId,
  area,
  title = "Analisar ECG/monitor com IA",
}: {
  condutaId: string;
  area: string;
  title?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [img, setImg] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  async function analyze(b: string) {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image_base64: b, area, conduta_id: condutaId }),
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
      setAnalysis(data.analysis as Analysis);
    } catch {
      toast.error("Falha de conexão.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function onPick(files: FileList | null) {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const b = await resizeToJpegBase64(file);
      setImg(b);
      setAnalysis(null);
      analyze(b); // analisa automaticamente — rapidez na sala vermelha
    } catch {
      toast.error("Não consegui ler a imagem.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="card" style={{ borderColor: "var(--navy)", display: "flex", flexDirection: "column", gap: 12 }}>
      <MultiStepLoader loadingStates={ANALYZE_STEPS} loading={analyzing} duration={2400} />
      {!img ? (
        <>
          <button
            className="btn"
            onClick={() => fileRef.current?.click()}
            style={{ background: "var(--navy)", borderColor: "var(--navy)", color: "#fff" }}
          >
            <Camera size={20} /> {title}
          </button>
          <p className="faint" style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, textAlign: "center" }}>
            Tire a foto agora ou envie da galeria — a IA faz uma leitura rápida, especialista em{" "}
            <b style={{ color: "var(--text-dim)" }}>{area}</b>, fundamentada em diretrizes. Você lê e confirma.
          </p>
        </>
      ) : (
        <>
          <div style={{ position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/jpeg;base64,${img}`}
              alt="ECG/monitor"
              style={{ width: "100%", borderRadius: 12, border: "1px solid var(--border)", display: "block" }}
            />
            <button
              className="chip"
              onClick={() => fileRef.current?.click()}
              style={{ position: "absolute", top: 8, right: 8, minHeight: 34, background: "rgba(255,255,255,0.92)" }}
            >
              <RefreshCw size={14} /> Trocar
            </button>
          </div>
          {analyzing && (
            <div className="muted" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14 }}>
              <Loader2 size={18} className="spin" /> Analisando este paciente…
            </div>
          )}
          {analysis && <AnalysisResult a={analysis} />}
          {!analyzing && !analysis && (
            <button className="btn btn-ghost btn-sm" onClick={() => analyze(img)} style={{ alignSelf: "center" }}>
              <Sparkles size={16} /> Analisar de novo
            </button>
          )}
        </>
      )}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPick(e.target.files)} />
    </div>
  );
}
