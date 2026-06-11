"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import type { CaseImageRow } from "@/lib/db";

/* Lightbox com ZOOM PRÓPRIO (Pointer Events): pinch 1–5x + double-tap 2.5x + arrastar.
   Necessário porque o viewport do PWA trava maximumScale=1 — sem isto o médico
   NÃO consegue ampliar o traçado do ECG no celular (o dado clínico central). */
function ZoomableImage({ src }: { src: string }) {
  const [t, setT] = useState({ scale: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const start = useRef({ dist: 0, scale: 1, x: 0, y: 0, midX: 0, midY: 0 });
  const lastTap = useRef(0);

  const clamp = (s: { scale: number; x: number; y: number }) => ({
    scale: Math.max(1, Math.min(5, s.scale)),
    x: s.scale <= 1 ? 0 : s.x,
    y: s.scale <= 1 ? 0 : s.y,
  });

  function onPointerDown(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      start.current = {
        dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        scale: t.scale,
        x: t.x,
        y: t.y,
        midX: (pts[0].x + pts[1].x) / 2,
        midY: (pts[0].y + pts[1].y) / 2,
      };
    } else if (pts.length === 1) {
      start.current = { ...start.current, scale: t.scale, x: t.x, y: t.y, midX: pts[0].x, midY: pts[0].y };
      // double-tap: alterna 1x ↔ 2.5x
      const now = Date.now();
      if (now - lastTap.current < 300) {
        setT((p) => clamp(p.scale > 1 ? { scale: 1, x: 0, y: 0 } : { scale: 2.5, x: 0, y: 0 }));
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const scale = (start.current.scale * dist) / Math.max(1, start.current.dist);
      setT(clamp({ scale, x: start.current.x, y: start.current.y }));
    } else if (pts.length === 1 && t.scale > 1) {
      setT((p) => clamp({ scale: p.scale, x: start.current.x + (pts[0].x - start.current.midX), y: start.current.y + (pts[0].y - start.current.midY) }));
    }
  }
  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Imagem ampliada — pince para dar zoom"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      draggable={false}
      style={{
        maxWidth: "100%",
        maxHeight: "100%",
        objectFit: "contain",
        touchAction: "none",
        transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`,
        transition: pointers.current.size ? "none" : "transform 0.15s ease-out",
        cursor: t.scale > 1 ? "grab" : "zoom-in",
        userSelect: "none",
      }}
    />
  );
}

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
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.94)", zIndex: 100, display: "grid", placeItems: "center", padding: 12, overflow: "hidden" }}
        >
          <ZoomableImage src={open} />
          <span className="microlabel" style={{ position: "absolute", bottom: "calc(env(safe-area-inset-bottom) + 14px)", left: 0, right: 0, textAlign: "center", color: "rgba(255,255,255,0.55)" }}>
            Pince para ampliar · toque 2x
          </span>
          <button
            onClick={() => setOpen(null)}
            aria-label="Fechar"
            style={{
              position: "absolute",
              top: "calc(env(safe-area-inset-top) + 12px)",
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
