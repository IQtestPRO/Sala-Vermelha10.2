"use client";

import type { Vitais } from "@/lib/types/case";
import { RITMOS } from "@/lib/types/case";

function ritmoLabel(r?: string) {
  return RITMOS.find((x) => x.key === r)?.label ?? r ?? "";
}

export default function VitalsGrid({ v }: { v: Vitais | null }) {
  if (!v) return null;
  const items: { label: string; val: string }[] = [];
  if (v.paSys != null || v.paDia != null) items.push({ label: "PA", val: `${v.paSys ?? "–"}/${v.paDia ?? "–"}` });
  if (v.fc != null) items.push({ label: "FC", val: `${v.fc}` });
  if (v.fr != null) items.push({ label: "FR", val: `${v.fr}` });
  if (v.satO2 != null) items.push({ label: "SpO₂", val: `${v.satO2}%` });
  if (v.tax != null) items.push({ label: "Tax", val: `${v.tax}°` });
  if (v.glicemia != null) items.push({ label: "HGT", val: `${v.glicemia}` });
  if (v.glasgow != null) items.push({ label: "Glasgow", val: `${v.glasgow}` });
  if (v.ritmo) items.push({ label: "Ritmo", val: ritmoLabel(v.ritmo) });
  if (!items.length) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
      {items.map((it) => (
        <div key={it.label} className="card-2" style={{ padding: "9px 6px", textAlign: "center" }}>
          <div className="faint" style={{ fontSize: 11, fontWeight: 700 }}>{it.label}</div>
          <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2 }}>{it.val}</div>
        </div>
      ))}
    </div>
  );
}
