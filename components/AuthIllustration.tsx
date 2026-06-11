// Painel ilustrativo do login: vídeo cinematográfico (UTI navy + ECG vermelho, Higgsfield)
// com scrim p/ legibilidade. Conteúdo FACTUAL (pilares do produto) — nada de depoimento inventado.
export default function AuthIllustration() {
  return (
    <div className="auth-illus" style={{ background: "#04060c" }}>
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/stat-auth.jpg"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
      >
        <source src="/stat-hero.mp4" type="video/mp4" />
      </video>
      {/* scrim de baixo p/ cima (legibilidade) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background: "linear-gradient(to top, rgba(4,6,12,0.94) 0%, rgba(4,6,12,0.55) 46%, rgba(4,6,12,0.10) 100%)",
        }}
      />

      {/* conteúdo */}
      <div style={{ position: "relative", zIndex: 4, display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ margin: 0, fontSize: 26, lineHeight: 1.2, color: "#fff", fontWeight: 800, letterSpacing: "-0.01em" }}>
          Do it <span style={{ color: "#ff5b64" }}>stat</span>.
        </p>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "#c9d4e6", maxWidth: 380 }}>
          Da foto do ECG à conduta fundamentada — na velocidade que a sala vermelha exige.
        </p>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "Modo PCR interativo (ciclos, adrenalina, metrônomo)",
            "Escores, gasometria e diluições do seu serviço",
            "IA que lê o ECG e discute o caso com você",
            "Agenda de plantões com financeiro e passagem",
          ].map((t) => (
            <li key={t} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13.5, lineHeight: 1.45, color: "#e7eefb", fontWeight: 600 }}>
              <span aria-hidden style={{ flex: "0 0 auto", marginTop: 6, width: 6, height: 6, borderRadius: 999, background: "#ff5b64" }} />
              {t}
            </li>
          ))}
        </ul>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#8294b0", fontWeight: 600 }}>
          Fundamentado em diretrizes · AHA · ESC · SBC · ACLS
        </p>
      </div>
    </div>
  );
}
