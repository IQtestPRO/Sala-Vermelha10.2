"use client";

import { useRef, useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { resizeToJpegBase64 } from "@/lib/image";

export type CapturedPhoto = { url: string; base64: string };

// 1 foto: câmera (tira na hora) ou galeria → redimensiona → sobe ao Blob (url p/ o caso)
// e mantém o base64 (p/ a IA analisar). Best-effort no upload (sem Blob, ainda guarda base64).
export default function PhotoCapture({
  photo,
  onChange,
  label,
}: {
  photo: CapturedPhoto | null;
  onChange: (p: CapturedPhoto | null) => void;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(files: FileList | null) {
    const file = files?.[0];
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
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div>
      {label && <label className="label">{label}</label>}
      {!photo ? (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          style={{
            width: "100%",
            minHeight: 128,
            display: "grid",
            placeItems: "center",
            gap: 7,
            borderRadius: 16,
            border: "1.5px dashed var(--border-strong)",
            background: "var(--surface-2)",
            color: "var(--text-dim)",
            cursor: "pointer",
          }}
        >
          {busy ? <Loader2 size={28} className="spin" /> : <Camera size={30} />}
          <span style={{ fontSize: 13.5, fontWeight: 700 }}>{busy ? "Enviando…" : "Tirar foto ou enviar da galeria"}</span>
        </button>
      ) : (
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
      )}
      <input ref={ref} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pick(e.target.files)} />
    </div>
  );
}
