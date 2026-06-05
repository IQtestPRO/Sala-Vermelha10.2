"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { CaseImageRow } from "@/lib/db";

export default function EcgViewer({ images }: { images: CaseImageRow[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!images.length) return null;

  return (
    <>
      <div className="scroll-x">
        {images.map((im) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={im.id}
            src={im.blob_url}
            alt={im.kind === "ecg" ? "ECG" : "Imagem do caso"}
            onClick={() => setOpen(im.blob_url)}
            style={{ height: 130, borderRadius: 12, border: "1px solid var(--border)", cursor: "zoom-in", flex: "0 0 auto" }}
          />
        ))}
      </div>

      {open && (
        <div
          onClick={() => setOpen(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.94)", zIndex: 100, display: "grid", placeItems: "center", padding: 12 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={open} alt="Imagem ampliada" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          <button
            onClick={() => setOpen(null)}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 44,
              height: 44,
              borderRadius: 999,
              background: "rgba(255,255,255,0.12)",
              border: "none",
              color: "white",
              display: "grid",
              placeItems: "center",
            }}
          >
            <X size={22} />
          </button>
        </div>
      )}
    </>
  );
}
