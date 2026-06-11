"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { PublicCase } from "@/lib/cases";
import { questionMeta } from "@/lib/types/case";
import { statusLabel, statusBadgeClass, sexoLabel, timeAgo } from "@/lib/labels";
import SlaCountdown from "./SlaCountdown";

// Ficha técnica do caso: condição em microlabel vermelho, resumo em destaque,
// dados do paciente em MONO (dado é dado) e SLA com traçado que degrada.
export default function CaseCard({ c, serverNow }: { c: PublicCase; serverNow: number }) {
  const meta = questionMeta(c.question_type);
  const showCountdown = c.status === "open";
  const patient = [
    c.patient_age != null ? `${c.patient_age}a` : null,
    c.patient_sex ? sexoLabel(c.patient_sex) : null,
    c.patient_weight_kg != null ? `${c.patient_weight_kg} kg` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/case/${c.id}`}
      className="card-2"
      style={{ display: "flex", gap: 12, alignItems: "center", borderRadius: "var(--r-md)", padding: "12px 14px" }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
          <span className="microlabel" style={{ color: "var(--red)", letterSpacing: "0.07em" }}>
            {meta.short.toUpperCase()}
          </span>
          {showCountdown ? (
            <SlaCountdown expiresAt={c.sla_expires_at} serverNow={serverNow} size={13} trace />
          ) : (
            <span className={statusBadgeClass(c.status)}>{statusLabel(c.status)}</span>
          )}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.35, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {c.clinical_summary || c.question_text}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 5 }}>
          {patient && (
            <span className="data" style={{ fontSize: 12, color: "var(--text-dim)" }}>
              {patient}
            </span>
          )}
          <span className="faint" style={{ fontSize: 11.5 }}>{timeAgo(c.created_at, serverNow)}</span>
        </div>
      </div>
      <ChevronRight size={18} className="faint" style={{ flex: "0 0 auto" }} />
    </Link>
  );
}
