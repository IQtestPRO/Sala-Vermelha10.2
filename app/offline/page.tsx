export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <div className="app-main" style={{ alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Sem conexão</div>
        <p className="muted" style={{ marginTop: 8 }}>Reconecte para ver e enviar casos. O app volta sozinho quando a internet retornar.</p>
      </div>
    </div>
  );
}
