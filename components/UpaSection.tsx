import React from "react";

// Logo oficial "UPA 24h" (public/upa-24h.png), sobre um chip branco para destacar em qualquer tema.
export function UpaBadge({ h = 28 }: { h?: number }) {
  return (
    <span className="upa-logo-chip" aria-label="UPA 24h">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/upa-24h.png" alt="UPA 24h" style={{ height: h, width: "auto", display: "block" }} />
    </span>
  );
}

// Quebra "LEAD: corpo" ou "LEAD — corpo" (lead curto no começo) para deixar escaneável.
function leadBody(raw: string): [string, string] {
  const s = raw.trim();
  const cands: [number, number][] = [];
  const c = s.indexOf(": ");
  if (c > 2 && c <= 72) cands.push([c, 2]);
  const d = s.indexOf(" — ");
  if (d > 2 && d <= 72) cands.push([d, 3]);
  const h = s.indexOf(" - ");
  if (h > 2 && h <= 72) cands.push([h, 3]);
  if (!cands.length) return ["", s];
  cands.sort((a, b) => a[0] - b[0]);
  const [pos, len] = cands[0];
  return [s.slice(0, pos).trim(), s.slice(pos + len).trim()];
}

// Seção "Alternativa no SUS / UPA" escaneável: cada item vira um cartão numerado
// com tópico em destaque + corpo. Usada na IA (AnalysisResult) e nas condutas.
export default function UpaSection({ items, title = "Alternativa no SUS / UPA" }: { items: string[]; title?: string }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="upa-head">
        <UpaBadge />
        <span className="label" style={{ margin: 0 }}>{title}</span>
      </div>
      <div className="upa-list">
        {items.map((it, i) => {
          const [lead, body] = leadBody(it);
          return (
            <div key={i} className="upa-card">
              <span className="upa-num">{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {lead && <div className="upa-lead">{lead}</div>}
                <div className="upa-body">{body}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
