"use client";

import { useEffect, useState } from "react";

// WOW: faixa navy estilo monitor de cabeceira — linha de ECG percorrendo + SLA vivo.
// Unica superficie escura no app claro: vira ancora visual do caso ativo.
export default function VitalsStrip({
  expiresAt,
  serverNow,
  status,
  priority,
}: {
  expiresAt: number;
  serverNow: number;
  status: string;
  priority?: string | null;
}) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const offset = Date.now() - serverNow; // sincroniza com o relogio do servidor
    const id = setInterval(() => setNow(Date.now() - offset), 1000);
    return () => clearInterval(id);
  }, [serverNow]);

  const open = status === "open";
  const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const danger = open && remaining <= 120;
  const warn = open && remaining <= 300 && !danger;
  const urgent = priority === "urgent";

  const label =
    status === "open"
      ? urgent
        ? "Urgente · aguardando"
        : "Aguardando plantonista"
      : status === "claimed"
        ? "Em atendimento"
        : status === "answered"
          ? "Respondido"
          : status === "expired"
            ? "SLA expirado · escalonado"
            : "Encerrado";

  const beat = danger ? "sla-beat-fast" : warn ? "sla-beat" : "";

  return (
    <div className="vitals-strip navy-material">
      <svg className="vitals-ecg" viewBox="0 0 360 40" preserveAspectRatio="none" aria-hidden="true">
        <path
          className="vitals-ecg-line"
          d="M0 20 H80 l6 -2 l5 -12 l5 24 l6 -16 l6 6 H200 l6 -2 l5 -12 l5 24 l6 -16 l6 6 H360"
        />
      </svg>

      <div className="vitals-left">
        <span className={`vitals-dot ${open ? beat : ""}`} />
        <span className="vitals-label">{label}</span>
      </div>

      {open ? (
        <span className={`vitals-sla ${danger ? "is-danger" : warn ? "is-warn" : ""}`}>
          {mm}:{ss}
        </span>
      ) : (
        <span className="vitals-state">{status === "expired" ? "+10:00" : "—"}</span>
      )}
    </div>
  );
}
