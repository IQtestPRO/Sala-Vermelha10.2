/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { toast } from "sonner";

// Ditado por voz (fala -> texto em tempo real). Web Speech API (pt-BR), com
// auto-reinício (iOS Safari corta sozinho a cada pausa). Some sozinho se o
// navegador não suportar. Acrescenta o texto falado ao valor atual do campo.
export default function VoiceButton({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
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
    if (!SR) {
      toast.error("Seu navegador não suporta ditado por voz.");
      return;
    }
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
        toast.error("Permita o microfone para ditar por voz.");
        wantRef.current = false;
        setListening(false);
      }
    };
    rec.onend = () => {
      // iOS/Chrome encerram a cada pausa — reinicia enquanto o usuário quiser.
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
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(10);
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

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => (listening ? stop() : start())}
      className={`voice-btn ${listening ? "on" : ""} ${className ?? ""}`}
      aria-label={listening ? "Parar ditado por voz" : "Ditar por voz"}
      title={listening ? "Parar" : "Falar"}
    >
      <Mic size={18} />
    </button>
  );
}
