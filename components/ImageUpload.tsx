"use client";

import { useRef, useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

async function resizeToJpegBase64(file: File, maxDim = 1600, quality = 0.82): Promise<string> {
  const dataUrl: string = await new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
  const img: HTMLImageElement = await new Promise((res, rej) => {
    const i = new window.Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  let { width, height } = img;
  if (width > height && width > maxDim) {
    height = Math.round((height * maxDim) / width);
    width = maxDim;
  } else if (height >= width && height > maxDim) {
    width = Math.round((width * maxDim) / height);
    height = maxDim;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-canvas");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality).split(",")[1];
}

export type UploadedImage = { url: string };

export default function ImageUpload({
  images,
  onChange,
  max = 4,
}: {
  images: UploadedImage[];
  onChange: (imgs: UploadedImage[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      const next = [...images];
      for (const file of Array.from(files)) {
        if (next.length >= max) break;
        if (!file.type.startsWith("image/")) continue;
        const base64 = await resizeToJpegBase64(file);
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ base64 }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error("Falha no upload da imagem.");
          continue;
        }
        next.push({ url: data.url });
      }
      onChange(next);
    } catch {
      toast.error("Não consegui processar a imagem.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {images.map((im, i) => (
          <div key={i} style={{ position: "relative", width: 84, height: 84 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={im.url}
              alt="ECG"
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10, border: "1px solid var(--border)" }}
            />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, j) => j !== i))}
              style={{
                position: "absolute",
                top: -7,
                right: -7,
                width: 24,
                height: 24,
                borderRadius: 999,
                background: "var(--red)",
                border: "none",
                color: "white",
                display: "grid",
                placeItems: "center",
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            style={{
              width: 84,
              height: 84,
              borderRadius: 10,
              border: "1px dashed var(--border-strong)",
              background: "var(--surface-2)",
              color: "var(--text-dim)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            {busy ? <Loader2 size={22} className="spin" /> : <Camera size={24} />}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
