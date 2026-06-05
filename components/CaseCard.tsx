"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { PublicCase } from "@/lib/cases";
import { questionMeta } from "@/lib/types/case";
import { statusLabel, statusBadgeClass, sexoLabel, timeAgo } from "@/lib/labels";
import SlaCountdown from "./SlaCountdown";

export default function CaseCard({ c, serverNow }: { c: PublicCase; serverNow: number }) {
  const meta = questionMeta(c.question_type);
  const showCountdown = c.status === "open";
  const patient = [
    c.patient_age != null ? `${c.patient_age}a` : null,
    c.patient_sex ? sexoLabel(c.patient_sex) : null,
    c.patient_weight_kg != null ? `${c.patient_weight_kg}kg` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link href={`/case/${c.id}`} className="card-2" style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 800, fontSize: 12, color: "var(--red)", letterSpacing: "0.03em" }}>
            {meta.short.toUpperCase()}
          </span>
          {showCountdown ? (
            <SlaCountdown expiresAt={c.sla_expires_at} serverNow={serverNow} size={13} />
          ) : (
            <span className={statusBadgeClass(c.status)}>{statusLabel(c.status)}</span>
          )}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {c.clinical_summary || c.question_text}
        </div>
        <div className="faint" style={{ fontSize: 12, marginTop: 3 }}>
          {patient ? patient + " · " : ""}
          {timeAgo(c.created_at, serverNow)}
        </div>
      </div>
      <ChevronRight size={20} className="faint" />
    </Link>
  );
}
