/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Wand2 } from "lucide-react";
import { toast } from "sonner";
import EcgLine from "@/components/EcgLine";
import type { Sexo, Vitais } from "@/lib/types/case";

export type VoiceCampos = {
  resumo_clinico: string;
  idade?: number;
  sexo?: Sexo;
  peso?: number;
  vitais?: Vitais;
};

/* DITAR CASO — na sala vermelha ninguém digita com paciente grave na frente.
   Fala → transcript ao vivo (Web Speech API pt-BR, auto-reinício) → "Estruturar caso"
   → /api/voice-case (Claude) preenche o formulário → o MÉDICO revisa e envia.
   Sem suporte de voz no navegador: o bloco some (o campo de texto é o fallback). */
export default function DitarCaso({
  value,
  onChange,
  onCampos,
}: {
  value: string;
  onChange: (v: string) => void;
  onCampos: (campos: VoiceCampos) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const recRef = useRef<any>(null);
  const wantRef = useRef(false);
  const baseRef = useRef("");
  const finalRef = useRef("");
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    const SR = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setSupported(!!SR);
    return () => {
      wantRef.current = false;
      try {
        recRef.current?.stop();
      } catch {
        /* noop */
      }
    };
  }, []);

  function start() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "pt-BR";
    rec.continuous = true;
    rec.interimResults = true;
    baseRef.current = valueRef.current ? valueRef.current.replace(/\s+$/, "") + " " : "";
    finalRef.current = "";

    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += t + " ";
        else interim += t;
      }
      onChange(baseRef.current + finalRef.current + interim);
    };
    rec.onerror = (e: any) => {
      if (e?.error === "not-allowed" || e?.error === "service-not-allowed") {
        toast.error("Permita o microfone nas configurações do navegador para ditar o caso.");
        wantRef.current = false;
        setListening(false);
      }
    };
    rec.onend = () => {
      // iOS/Chrome cortam a cada pausa — reinicia enquanto o médico estiver ditando.
      if (wantRef.current) {
        try {
          rec.start();
        } catch {
          /* noop */
        }
      } else {
        setListening(false);
      }
    };

    recRef.current = rec;
    wantRef.current = true;
    try {
      rec.start();
      setListening(true);
      try {
        navigator.vibrate?.(20);
      } catch {
        /* noop */
      }
    } catch {
      /* já iniciado */
    }
  }

  function stop() {
    wantRef.current = false;
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
    setListening(false);
  }

  async function estruturar() {
    stop();
    const transcript = valueRef.current.trim();
    if (transcript.length < 8) {
      toast.error("Dite o caso primeiro.");
      return;
    }
    setProcessing(true);
    try {
      const r = await fetch("/api/voice-case", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!r.ok) {
        toast.error("Não consegui estruturar o ditado — revise o texto manualmente.");
        return;
      }
      const d = await r.json();
      if (d?.campos?.resumo_clinico) {
        onCampos(d.campos as VoiceCampos);
        toast.success("Campos preenchidos — revise antes de enviar.");
      }
    } catch {
      toast.error("Falha de conexão ao estruturar o ditado.");
    } finally {
      setProcessing(false);
    }
  }

  if (!supported) return null;

  return (
    <div className="well" style={{ padding: "14px 14px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          type="button"
          onClick={() => (listening ? stop() : start())}
          aria-label={listening ? "Parar ditado" : "Ditar caso por voz"}
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            border: "none",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            color: "#fff",
            background: listening ? "var(--red)" : "var(--navy)",
            boxShadow: listening ? "0 0 18px var(--red-halo)" : "var(--shadow-sm)",
            flex: "0 0 auto",
          }}
        >
          {listening ? <Square size={22} /> : <Mic size={24} />}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="label" style={{ marginBottom: 2 }}>Ditar caso</div>
          <div className="faint" style={{ fontSize: 12.5, lineHeight: 1.4 }}>
            {processing
              ? "Estruturando o caso…"
              : listening
                ? "Ouvindo — fale o caso, os vitais e a dúvida."
                : "Fale o caso; a IA preenche os campos e você revisa."}
          </div>
        </div>
      </div>

      {(listening || processing) && (
        <EcgLine variant="run" height={20} stroke={1.8} opacity={0.9} glow style={{ width: "100%" }} />
      )}

      {!processing && value.trim().length >= 8 && (
        <button type="button" className="btn btn-primary btn-sm" onClick={estruturar} disabled={processing} style={{ minHeight: 46 }}>
          <Wand2 size={16} /> Estruturar caso (preencher campos)
        </button>
      )}
    </div>
  );
}
