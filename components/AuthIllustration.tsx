// Painel ilustrativo do login: imagem cinematografica (UTI navy + ECG vermelho, gerada no Higgsfield)
// com scrim p/ legibilidade + depoimento de medica.
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
      {/* scrim de baixo p/ cima (legibilidade do depoimento) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background: "linear-gradient(to top, rgba(4,6,12,0.93) 0%, rgba(4,6,12,0.55) 42%, rgba(4,6,12,0.12) 100%)",
        }}
      />

      {/* conteudo */}
      <div style={{ position: "relative", zIndex: 4, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="auth-tag">Sala vermelha</span>
          <span className="auth-tag">ECG por IA</span>
          <span className="auth-tag">Resultado em &lt; 2 min</span>
        </div>
        <div className="auth-quote">
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, color: "#f1f6ff", fontWeight: 600 }}>
            “Mandei a foto do monitor e, em menos de dois minutos, tive a leitura do ECG e a conduta sugerida. Numa
            sala vermelha, isso é a diferença entre decidir com segurança ou no escuro.”
          </p>
          <p style={{ margin: "14px 0 0", fontSize: 13.5, color: "#aebbd2", fontWeight: 700 }}>Dra. Marina Alves</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#8294b0" }}>Emergencista, Hospital São Lucas</p>
        </div>
      </div>
    </div>
  );
}
