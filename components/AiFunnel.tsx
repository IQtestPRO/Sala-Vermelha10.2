"use client";

import { useState } from "react";
import { ChevronRight, MessageCircleQuestion, Loader2 } from "lucide-react";

export type Pergunta = { pergunta: string; opcoes: string[] };

// Funil de esclarecimento: a IA propôs perguntas; o médico clica nas opções e refina.
export default function AiFunnel({
  perguntas,
  onFinish,
  loading,
}: {
  perguntas: Pergunta[];
  onFinish: (respostas: { pergunta: string; resposta: string }[]) => void;
  loading?: boolean;
}) {
  const [resp, setResp] = useState<Record<number, string>>({});
  const answered = Object.keys(resp).length;

  return (
    <div className="card" style={{ borderColor: "var(--navy)", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 14, color: "var(--navy)" }}>
        <MessageCircleQuestion size={18} /> Refinar o diagnóstico
      </div>
      {perguntas.map((p, i) => (
        <div key={i}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, lineHeight: 1.35 }}>
            {i + 1}. {p.pergunta}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {p.opcoes.map((o) => (
              <button
                key={o}
                className={`chip ${resp[i] === o ? "chip-on" : ""}`}
                onClick={() => setResp((r) => ({ ...r, [i]: o }))}
                style={{ flex: "0 0 auto" }}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        className="btn btn-primary"
        disabled={loading || answered === 0}
        onClick={() =>
          onFinish(
            perguntas
              .map((p, i) => ({ pergunta: p.pergunta, resposta: resp[i] }))
              .filter((r) => r.resposta != null) as { pergunta: string; resposta: string }[]
          )
        }
      >
        {loading ? (
          <>
            <Loader2 size={18} className="spin" /> Refinando…
          </>
        ) : (
          <>
            Refinar diagnóstico ({answered}/{perguntas.length}) <ChevronRight size={18} />
          </>
        )}
      </button>
    </div>
  );
}
