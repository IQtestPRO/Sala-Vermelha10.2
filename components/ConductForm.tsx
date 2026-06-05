"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { apiPost } from "@/lib/client";
import { Confianca, Destino, DESTINOS, StructuredConduct } from "@/lib/types/answer";

const CONF: { key: Confianca; label: string }[] = [
  { key: "ALTA", label: "Confiança alta" },
  { key: "MEDIA", label: "Confiança média" },
  { key: "PRECISA_MAIS_DADOS", label: "Preciso de mais dados" },
];

export default function ConductForm({ caseId, onSent }: { caseId: string; onSent: () => void }) {
  const [body, setBody] = useState("");
  const [confianca, setConfianca] = useState<Confianca | undefined>(undefined);
  const [pedido, setPedido] = useState("");
  const [energia, setEnergia] = useState("");
  const [destino, setDestino] = useState<Destino | undefined>(undefined);
  const [sending, setSending] = useState(false);

  async function send() {
    if (!body.trim()) {
      toast.error("Escreva a conduta recomendada.");
      return;
    }
    setSending(true);
    try {
      const structured: StructuredConduct = {
        confianca,
        energia: energia.trim() || undefined,
        destino,
        pedidoDeDados: confianca === "PRECISA_MAIS_DADOS" ? pedido.trim() || undefined : undefined,
      };
      await apiPost(`/api/cases/${caseId}/respond`, { body: body.trim(), structured_conduct: structured });
      toast.success("Resposta enviada.");
      setBody("");
      setEnergia("");
      setPedido("");
      setConfianca(undefined);
      setDestino(undefined);
      onSent();
    } catch {
      toast.error("Falha ao enviar a resposta.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontWeight: 800, fontSize: 15 }}>Sua conduta</div>
      <textarea
        className="field"
        placeholder="Ex.: Cardioversão sincronizada 120–150 J. Sedação com etomidato 0,1–0,15 mg/kg. Reavaliar ritmo após o choque…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        style={{ minHeight: 110 }}
      />

      <div className="scroll-x" style={{ flexWrap: "wrap" }}>
        {CONF.map((c) => (
          <button key={c.key} className={`chip ${confianca === c.key ? "chip-on" : ""}`} onClick={() => setConfianca(c.key)} style={{ flex: "0 0 auto" }}>
            {c.label}
          </button>
        ))}
      </div>

      {confianca === "PRECISA_MAIS_DADOS" && (
        <input className="field" placeholder="O que falta? (ECG completo, peso, ritmo…)" value={pedido} onChange={(e) => setPedido(e.target.value)} />
      )}

      <input className="field" placeholder="Energia (opcional): ex. 120–150 J sincronizado" value={energia} onChange={(e) => setEnergia(e.target.value)} />

      <div>
        <div className="label">Disposição sugerida (opcional)</div>
        <div className="scroll-x" style={{ flexWrap: "wrap" }}>
          {DESTINOS.map((d) => (
            <button
              key={d.key}
              className={`chip ${destino === d.key ? "chip-on" : ""}`}
              onClick={() => setDestino(destino === d.key ? undefined : d.key)}
              style={{ flex: "0 0 auto" }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-primary" disabled={sending} onClick={send}>
        <Send size={20} /> {sending ? "Enviando…" : "Enviar resposta"}
      </button>
    </div>
  );
}
