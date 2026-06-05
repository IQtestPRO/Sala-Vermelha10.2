"use client";

import { ShieldCheck } from "lucide-react";
import { DISCLAIMER_LONGO, LGPD_NOTA } from "@/lib/legal/disclaimer";

export default function ConsentScreen({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="app-main" style={{ padding: "0 20px" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "28px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <ShieldCheck size={26} color="var(--red)" />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>Antes de começar</h1>
        </div>
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-dim)" }}>{DISCLAIMER_LONGO}</p>
          <div className="card-2" style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.5 }}>
            <b style={{ color: "var(--text)" }}>Privacidade (LGPD):</b> {LGPD_NOTA}
          </div>
          <button className="btn btn-primary" onClick={onAccept}>
            Li e concordo — continuar
          </button>
        </div>
      </div>
    </div>
  );
}
