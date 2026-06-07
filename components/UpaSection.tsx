import React from "react";

// Marca "UPA 24h" (recriada do logotipo: UPA verde + 24h azul).
export function UpaBadge({ size = 17 }: { size?: number }) {
  return (
    <span className="upa-badge" aria-label="UPA 24h">
      <span className="upa-g" style={{ fontSize: size }}>UPA</span>
      <span className="upa-b" style={{ fontSize: Math.round(size * 0.76) }}>24h</span>
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
