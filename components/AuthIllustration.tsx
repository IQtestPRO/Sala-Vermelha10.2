// Painel do login (desktop): navy sólido, sóbrio — tagline + pilares FACTUAIS.
// ECG fino monocromático confinado à faixa superior (não cruza nenhum texto).
export default function AuthIllustration() {
  return (
    <div className="auth-illus" style={{ background: "#101e3a", justifyContent: "flex-end" }}>
      {/* faixa do ECG (topo, longe do conteúdo) */}
      <svg
        viewBox="0 0 400 64"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ position: "absolute", left: 0, right: 0, top: 34, width: "100%", height: 64, opacity: 0.3 }}
      >
        <path
          d="M0 32 H96 L106 32 L114 14 L124 52 L134 24 L142 32 H230 L240 27 L247 37 L254 32 H400"
          fill="none"
          stroke="#ff5b64"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* conteúdo */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ margin: 0, fontSize: 27, lineHeight: 1.2, color: "#fff", fontWeight: 800, letterSpacing: "-0.01em" }}>
          Do it <span style={{ color: "#ff5b64" }}>stat</span>.
        </p>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "#c9d4e6", maxWidth: 380 }}>
          Da foto do ECG à conduta fundamentada — na velocidade que a sala vermelha exige.
        </p>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
          {[
            "Modo PCR interativo (ciclos, adrenalina, metrônomo)",
            "Escores, gasometria e diluições do seu serviço",
            "IA que lê o ECG e discute o caso com você",
            "Agenda de plantões com financeiro e passagem",
          ].map((t) => (
            <li key={t} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13.5, lineHeight: 1.5, color: "#eaf0fa", fontWeight: 600 }}>
              <span aria-hidden style={{ flex: "0 0 auto", marginTop: 7, width: 6, height: 6, borderRadius: 999, background: "#ff5b64" }} />
              {t}
            </li>
          ))}
        </ul>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#94a4c0", fontWeight: 600 }}>
          Fundamentado em diretrizes · AHA · ESC · SBC · ACLS
        </p>
      </div>
    </div>
  );
}
