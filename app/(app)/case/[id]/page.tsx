"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, ShieldCheck, AlertTriangle, CheckCircle2, HandHelping } from "lucide-react";
import TopBar from "@/components/TopBar";
import { useMe } from "@/components/AppShell";
import { usePoll } from "@/lib/usePoll";
import { apiPost, friendlyError, ApiError } from "@/lib/client";
import SlaCountdown from "@/components/SlaCountdown";
import VitalsStrip from "@/components/VitalsStrip";
import VitalsGrid from "@/components/VitalsGrid";
import EcgViewer from "@/components/EcgViewer";
import AnalysisResult, { Analysis } from "@/components/AnalysisResult";
import ConductForm from "@/components/ConductForm";
import ChatThread from "@/components/ChatThread";
import type { PublicCase, PublicResponse } from "@/lib/cases";
import type { CaseImageRow, MessageRow, Role } from "@/lib/db";
import { questionMeta } from "@/lib/types/case";
import { statusLabel, statusBadgeClass, sexoLabel } from "@/lib/labels";
import { DESTINOS } from "@/lib/types/answer";
import { DISCLAIMER_CURTO } from "@/lib/legal/disclaimer";

type Detail = {
  case: PublicCase;
  images: CaseImageRow[];
  responses: PublicResponse[];
  messages: MessageRow[];
  viewerId: string;
  viewerRole: Role;
  serverNow: number;
};

function ResponseCard({ r }: { r: PublicResponse }) {
  const sc = r.structured_conduct;
  const destinoLabel = sc?.destino ? DESTINOS.find((d) => d.key === sc.destino)?.label : null;
  return (
    <div className="card" style={{ borderColor: "color-mix(in srgb, var(--green) 35%, var(--border))" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <CheckCircle2 size={18} color="var(--green)" />
        <span style={{ fontWeight: 800 }}>Conduta do plantonista</span>
      </div>
      <div style={{ whiteSpace: "pre-wrap", fontSize: 15, lineHeight: 1.5 }}>{r.body}</div>

      {sc?.energia && (
        <div className="card-2" style={{ marginTop: 10, padding: "8px 12px" }}>
          <span className="faint" style={{ fontSize: 12, fontWeight: 700 }}>Energia: </span>
          <span style={{ fontWeight: 700 }}>{sc.energia}</span>
        </div>
      )}
      {sc?.pedidoDeDados && (
        <div className="card-2" style={{ marginTop: 10, padding: "8px 12px", color: "var(--amber)" }}>
          <AlertTriangle size={14} style={{ verticalAlign: "-2px" }} /> Precisa de mais dados: {sc.pedidoDeDados}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {destinoLabel && <span className="chip" style={{ minHeight: 30 }}>{destinoLabel}</span>}
        {sc?.confianca && (
          <span className="chip" style={{ minHeight: 30 }}>
            {sc.confianca === "ALTA" ? "Confiança alta" : sc.confianca === "MEDIA" ? "Confiança média" : "Mais dados"}
          </span>
        )}
      </div>
    </div>
  );
}

export default function CasePage() {
  const me = useMe();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, error, refresh } = usePoll<Detail>(`/api/cases/${id}`, 2500);

  if (error && (error as unknown as ApiError)) {
    return (
      <>
        <TopBar title="Caso" onBack={() => router.back()} />
        <div style={{ padding: 24, textAlign: "center" }} className="muted">
          Não foi possível carregar este caso.
        </div>
      </>
    );
  }
  if (!data) {
    return (
      <>
        <TopBar title="Caso" onBack={() => router.back()} />
        <div style={{ padding: 24, textAlign: "center" }} className="muted">Carregando…</div>
      </>
    );
  }

  const c = data.case;
  const meta = questionMeta(c.question_type);
  const isOwner = c.requester_id === data.viewerId;
  const isResponder = data.viewerRole === "responder";
  const isClaimer = c.claimed_by === data.viewerId;

  const patientLine =
    [
      c.patient_age != null ? `${c.patient_age} anos` : null,
      c.patient_sex ? sexoLabel(c.patient_sex) : null,
      c.patient_weight_kg != null ? `${c.patient_weight_kg} kg` : null,
    ]
      .filter(Boolean)
      .join(" • ") || "Paciente sem dados demográficos";

  const canChat = (isOwner || isClaimer) && (c.status === "claimed" || c.status === "answered");

  async function claim() {
    setBusy(true);
    try {
      await apiPost(`/api/cases/${id}/claim`);
      toast.success("Caso assumido. Avalie e responda.");
      refresh();
    } catch (err) {
      toast.error(friendlyError(err instanceof ApiError ? err.code : "internal_error"));
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function close() {
    setBusy(true);
    try {
      await apiPost(`/api/cases/${id}/close`);
      toast.success("Caso encerrado.");
      refresh();
    } catch {
      toast.error("Falha ao encerrar.");
    } finally {
      setBusy(false);
    }
  }

  async function sendMsg() {
    if (!msg.trim()) return;
    setBusy(true);
    try {
      await apiPost(`/api/cases/${id}/messages`, { body: msg.trim() });
      setMsg("");
      refresh();
    } catch {
      toast.error("Falha ao enviar mensagem.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopBar
        title={meta.label}
        subtitle={patientLine}
        onBack={() => router.back()}
        right={
          c.status === "open" ? (
            <SlaCountdown expiresAt={c.sla_expires_at} serverNow={data.serverNow} />
          ) : (
            <span className={statusBadgeClass(c.status)}>{statusLabel(c.status)}</span>
          )
        }
      />

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16, paddingBottom: 24 }}>
        <VitalsStrip expiresAt={c.sla_expires_at} serverNow={data.serverNow} status={c.status} priority={c.priority} />

        {c.status === "expired" && (
          <div className="card" style={{ borderColor: "var(--red)", background: "color-mix(in srgb, var(--red) 10%, var(--surface))" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--red)", fontWeight: 800 }}>
              <AlertTriangle size={18} /> SLA expirado — escalonado
            </div>
            <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
              Ninguém respondeu em 10 minutos. Todos os plantonistas foram notificados. O caso continua respondível.
            </div>
          </div>
        )}

        {c.vitals && <VitalsGrid v={c.vitals} />}

        <EcgViewer images={data.images} />

        {c.ai_analysis && (
          <div>
            <div className="faint" style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>LEITURA PRELIMINAR (à beira-leito)</div>
            <AnalysisResult a={c.ai_analysis as unknown as Analysis} />
          </div>
        )}

        <div className="card">
          <div className="faint" style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>PERGUNTA</div>
          <div style={{ fontSize: 16, fontWeight: 600, whiteSpace: "pre-wrap" }}>{c.question_text}</div>
          {c.clinical_summary && c.clinical_summary !== c.question_text && (
            <div className="muted" style={{ fontSize: 14, marginTop: 8 }}>{c.clinical_summary}</div>
          )}
        </div>

        {/* Respostas */}
        {data.responses.map((r) => (
          <ResponseCard key={r.id} r={r} />
        ))}

        {/* Zona de ação por papel/estado */}
        {isResponder && !isOwner && c.status === "open" && (
          <button className="btn btn-emergency" disabled={busy} onClick={claim}>
            <HandHelping size={20} /> Assumir este caso
          </button>
        )}

        {isClaimer && (c.status === "claimed" || c.status === "answered") && (
          <ConductForm caseId={id} onSent={refresh} />
        )}

        {isOwner && c.status === "open" && (
          <div className="card" style={{ textAlign: "center", padding: 22 }}>
            <div className="muted">Aguardando um plantonista assumir…</div>
            <div style={{ marginTop: 8 }}>
              <SlaCountdown expiresAt={c.sla_expires_at} serverNow={data.serverNow} size={28} />
            </div>
          </div>
        )}

        {isOwner && c.status === "claimed" && (
          <div className="card-2" style={{ textAlign: "center", color: "var(--amber)" }}>
            <ShieldCheck size={18} style={{ verticalAlign: "-3px" }} /> Plantonista avaliando seu caso.
          </div>
        )}

        {isOwner && c.status === "answered" && (
          <button className="btn btn-success" disabled={busy} onClick={close}>
            <CheckCircle2 size={20} /> Encerrar caso
          </button>
        )}

        {/* Chat */}
        {canChat && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <hr className="divider" />
            <div className="label">Conversa</div>
            <ChatThread messages={data.messages} viewerId={data.viewerId} requesterId={c.requester_id} />
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="field"
                placeholder="Mensagem…"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMsg();
                }}
                style={{ minHeight: 46 }}
              />
              <button className="btn btn-sm btn-primary" style={{ minHeight: 46, width: 52 }} disabled={busy} onClick={sendMsg}>
                <Send size={18} />
              </button>
            </div>
          </div>
        )}

        <p className="faint" style={{ fontSize: 11, lineHeight: 1.5, marginTop: 4 }}>
          {DISCLAIMER_CURTO}
        </p>
      </div>
    </>
  );
}
