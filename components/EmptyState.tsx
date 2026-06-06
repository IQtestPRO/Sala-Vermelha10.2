// Empty-state premium: banner cinematografico (Higgsfield, pulso calmo no navy) + texto.
export default function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="card" style={{ textAlign: "center", padding: 0, overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/stat-empty.jpg" alt="" style={{ width: "100%", height: 148, objectFit: "cover", display: "block" }} />
      <div style={{ padding: "16px 22px 24px" }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
        {subtitle && (
          <div className="faint" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.45, maxWidth: 300, marginLeft: "auto", marginRight: "auto" }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
