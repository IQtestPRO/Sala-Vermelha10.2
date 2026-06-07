"use client";

import { useRef, useState } from "react";
import { Camera, Images, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { resizeToJpegBase64 } from "@/lib/image";

export type CapturedPhoto = { url: string; base64: string };

// 1 foto: a pessoa ESCOLHE — Tirar foto (câmera) ou Galeria (fototeca do iPhone).
// Redimensiona → sobe ao Blob (url p/ o caso) e mantém o base64 (p/ a IA). Upload best-effort.
export default function PhotoCapture({
  photo,
  onChange,
  label,
}: {
  photo: CapturedPhoto | null;
  onChange: (p: CapturedPhoto | null) => void;
  label?: string;
}) {
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(input: HTMLInputElement | null) {
    const file = input?.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      const base64 = await resizeToJpegBase64(file);
      let url = "";
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ base64 }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.url) url = data.url;
      } catch {
        /* upload best-effort */
      }
      onChange({ url, base64 });
    } catch {
      toast.error("Não consegui ler a imagem.");
    } finally {
      setBusy(false);
      if (input) input.value = "";
    }
  }

  const pickStyle: React.CSSProperties = {
    minHeight: 116,
    display: "grid",
    placeItems: "center",
    gap: 8,
    borderRadius: 16,
    border: "1.5px dashed var(--border-strong)",
    background: "var(--surface-2)",
    color: "var(--text-dim)",
    cursor: "pointer",
    fontSize: 13.5,
    fontWeight: 700,
  };

  return (
    <div>
      {label && <label className="label">{label}</label>}

      {photo ? (
        <div style={{ position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/jpeg;base64,${photo.base64}`}
            alt="ECG/monitor"
            style={{ width: "100%", borderRadius: 16, border: "1px solid var(--border)", display: "block" }}
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remover foto"
            style={{ position: "absolute", top: 8, right: 8, width: 32, height: 32, borderRadius: 999, background: "var(--red)", border: "none", color: "#fff", display: "grid", placeItems: "center" }}
          >
            <X size={17} />
          </button>
        </div>
      ) : busy ? (
        <div style={{ ...pickStyle, gridTemplateColumns: "auto", gridAutoFlow: "column", color: "var(--text-dim)" }}>
          <Loader2 size={26} className="spin" />
          <span>Enviando…</span>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button type="button" onClick={() => camRef.current?.click()} style={pickStyle}>
            <Camera size={28} color="var(--primary)" />
            <span>Tirar foto</span>
          </button>
          <button type="button" onClick={() => galRef.current?.click()} style={pickStyle}>
            <Images size={28} color="var(--primary)" />
            <span>Galeria</span>
          </button>
        </div>
      )}

      {/* câmera (tira na hora) */}
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={() => pick(camRef.current)} />
      {/* galeria / fototeca (sem capture → iOS abre a Fototeca/Arquivos) */}
      <input ref={galRef} type="file" accept="image/*" hidden onChange={() => pick(galRef.current)} />
    </div>
  );
}
