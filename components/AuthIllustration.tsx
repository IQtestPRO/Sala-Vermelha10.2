import MeshGradient from "./MeshGradient";

// Painel ilustrativo do login (porte do AuthIllustration do Aceternity), tema médico STAT.
export default function AuthIllustration() {
  const tile: React.CSSProperties = {
    width: 150,
    height: 150,
    flex: "0 0 auto",
    borderRadius: 26,
    background: "#0e1626",
    boxShadow: "0px 2px 0px 0px rgba(120,140,180,0.18) inset",
  };
  return (
    <div className="auth-illus">
      {/* tiles decorativos rotacionados (textura) */}
      <div
        style={{
          position: "absolute",
          top: -150,
          right: -130,
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 110,
          transform: "rotate(45deg)",
          WebkitMaskImage: "linear-gradient(to right, black, transparent 55%)",
          maskImage: "linear-gradient(to right, black, transparent 55%)",
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={tile} />
        ))}
      </div>

      {/* mesh gradient (desfocado + fade no topo) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          filter: "blur(58px)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 48%)",
          maskImage: "linear-gradient(to bottom, transparent, black 48%)",
        }}
      >
        <MeshGradient />
      </div>

      {/* conteúdo */}
      <div style={{ position: "relative", zIndex: 4, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="auth-tag">Sala vermelha</span>
          <span className="auth-tag">ECG por IA</span>
          <span className="auth-tag">Resposta em 10 min</span>
        </div>
        <div className="auth-quote">
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, color: "#f1f6ff", fontWeight: 600 }}>
            “Mandei a foto do monitor e, em minutos, tive a leitura do ECG e a confirmação de conduta de um plantonista. Numa
            sala vermelha, isso é a diferença entre decidir com segurança ou no escuro.”
          </p>
          <p style={{ margin: "14px 0 0", fontSize: 13.5, color: "#aebbd2", fontWeight: 700 }}>Dra. Marina Alves</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#8294b0" }}>
            Emergencista, Hospital São Lucas
          </p>
        </div>
      </div>
    </div>
  );
}
