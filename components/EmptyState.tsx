import EcgLine from "@/components/EcgLine";

// Empty state de instrumento: flatline + microcopy clínica (tom seco, de plantão).
// Sem foto, sem ilustração — a ausência de sinal É a mensagem.
export default function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="card" style={{ textAlign: "center", padding: "26px 22px 24px", borderRadius: "var(--r-lg)" }}>
      <EcgLine variant="flat" height={22} stroke={1.5} color="var(--text-faint)" opacity={0.8} style={{ maxWidth: 240, margin: "0 auto" }} />
      <div style={{ fontWeight: 800, fontSize: 15.5, marginTop: 14 }}>{title}</div>
      {subtitle && (
        <div className="faint" style={{ fontSize: 13, marginTop: 5, lineHeight: 1.45, maxWidth: 300, marginLeft: "auto", marginRight: "auto" }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
