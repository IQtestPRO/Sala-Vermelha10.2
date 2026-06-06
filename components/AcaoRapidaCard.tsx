"use client";

import { Zap, AlertTriangle } from "lucide-react";
import type { AcaoRapida } from "@/lib/condutas";

export default function AcaoRapidaCard({ acao }: { acao: AcaoRapida }) {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden", borderColor: "var(--navy)" }}>
      <div style={{ background: "var(--navy)", color: "#fff", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <Zap size={18} />
        <span style={{ fontWeight: 900, letterSpacing: "0.04em", fontSize: 13 }}>AÇÃO IMEDIATA</span>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="muted" style={{ fontSize: 13, lineHeight: 1.45 }}>{acao.gatilho}</div>

        {acao.passos.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 12 }}>
            <div
              style={{
                flex: "0 0 28px",
                height: 28,
                borderRadius: 8,
                background: "var(--navy-tint)",
                color: "var(--navy)",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                fontSize: 14,
              }}
            >
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.3 }}>{p.acao}</div>
              {p.ampola && (
                <div
                  style={{
                    marginTop: 6,
                    background: "var(--primary-tint)",
                    color: "var(--primary-press)",
                    fontWeight: 800,
                    fontSize: 14,
                    padding: "7px 11px",
                    borderRadius: 10,
                    display: "inline-block",
                  }}
                >
                  {p.ampola}
                </div>
              )}
              {p.repetir && <div className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.4 }}>{p.repetir}</div>}
            </div>
          </div>
        ))}

        {acao.seRefratario && (
          <div className="card-2" style={{ background: "var(--surface-2)", boxShadow: "none" }}>
            <div style={{ fontWeight: 800, fontSize: 12, color: "var(--navy)", letterSpacing: "0.03em", marginBottom: 4 }}>
              SE NÃO RESOLVER
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.45 }}>{acao.seRefratario}</div>
          </div>
        )}

        {acao.naoFaca && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <AlertTriangle size={16} color="var(--red)" style={{ flex: "0 0 auto", marginTop: 2 }} />
            <div style={{ fontSize: 13, lineHeight: 1.45 }}>
              <b style={{ color: "var(--red)" }}>Cuidado: </b>
              {acao.naoFaca}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
