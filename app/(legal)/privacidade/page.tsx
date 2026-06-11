import Link from "next/link";

export const metadata = { title: "Política de Privacidade — STAT" };

const h: React.CSSProperties = { fontSize: 17, fontWeight: 800, margin: "26px 0 8px" };
const p: React.CSSProperties = { fontSize: 14.5, lineHeight: 1.65, color: "var(--text-dim)", margin: "0 0 10px" };

export default function PrivacidadePage() {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 22px 64px" }}>
        <Link href="/login" style={{ fontSize: 14, fontWeight: 700, color: "var(--primary-press)" }}>← Voltar</Link>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "18px 0 4px" }}>Política de Privacidade</h1>
        <p style={{ ...p, color: "var(--text-faint)", fontSize: 13 }}>Versão 1.0 · LGPD (Lei 13.709/2018)</p>

        <h2 style={h}>1. Dados que coletamos</h2>
        <p style={p}>
          No cadastro: nome, CRM (médicos) ou CPF (estudantes), especialidade, e-mail e telefone. No uso: conteúdo que
          você cria na plataforma (conversas com a IA, cálculos salvos, diluições, plantões, passagens de plantão e
          relatórios), sempre vinculado à sua conta.
        </p>

        <h2 style={h}>2. Para que usamos</h2>
        <p style={p}>
          Autenticação e funcionamento das ferramentas; persistência do seu conteúdo entre dispositivos; avisos
          operacionais (ex.: notificações de caso ou plantão). Não vendemos seus dados nem os usamos para marketing de
          terceiros.
        </p>

        <h2 style={h}>3. Dados de pacientes</h2>
        <p style={p}>
          Você é o controlador das informações clínicas que insere. Recomendamos registrar apenas o necessário ao seu
          exercício profissional, conforme as normas do seu serviço, do CFM e da LGPD. O conteúdo inserido fica restrito
          à sua conta (e, nas passagens de plantão, a quem receber o link autenticado).
        </p>

        <h2 style={h}>4. Armazenamento e segurança</h2>
        <p style={p}>
          Os dados ficam em banco gerenciado com acesso restrito; senhas são armazenadas com hash (bcrypt); o tráfego é
          criptografado (HTTPS). Conteúdo enviado à IA é processado pelo provedor do modelo exclusivamente para gerar a
          resposta.
        </p>

        <h2 style={h}>5. Seus direitos (LGPD)</h2>
        <p style={p}>
          Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento pela área{" "}
          <i>Perfil → Ideias e suporte</i> dentro do app.
        </p>

        <p style={{ ...p, marginTop: 26 }}>
          Veja também os <Link href="/termos" style={{ color: "var(--primary-press)", fontWeight: 700 }}>Termos de Uso</Link>.
        </p>
      </div>
    </div>
  );
}
