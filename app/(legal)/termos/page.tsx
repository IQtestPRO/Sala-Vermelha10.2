import Link from "next/link";
import { DISCLAIMER_LONGO } from "@/lib/legal/disclaimer";

export const metadata = { title: "Termos de Uso — STAT" };

const h: React.CSSProperties = { fontSize: 17, fontWeight: 800, margin: "26px 0 8px" };
const p: React.CSSProperties = { fontSize: 14.5, lineHeight: 1.65, color: "var(--text-dim)", margin: "0 0 10px" };

export default function TermosPage() {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--text)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 22px 64px" }}>
        <Link href="/login" style={{ fontSize: 14, fontWeight: 700, color: "var(--primary-press)" }}>← Voltar</Link>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "18px 0 4px" }}>Termos de Uso</h1>
        <p style={{ ...p, color: "var(--text-faint)", fontSize: 13 }}>Versão 1.0</p>

        <h2 style={h}>1. O que é o STAT</h2>
        <p style={p}>
          O STAT é uma plataforma de apoio à decisão clínica para médicos e estudantes de medicina: protocolos de
          emergência, calculadoras e escores, assistente de inteligência artificial e organização de plantões.
        </p>

        <h2 style={h}>2. Natureza do conteúdo (leia com atenção)</h2>
        <p style={p}>{DISCLAIMER_LONGO}</p>

        <h2 style={h}>3. Quem pode usar</h2>
        <p style={p}>
          A plataforma destina-se a profissionais de saúde habilitados e a estudantes de medicina (para fins
          educacionais). Ao criar conta, você declara que as informações fornecidas (CRM ou CPF) são verdadeiras e
          suas.
        </p>

        <h2 style={h}>4. Responsabilidades do usuário</h2>
        <p style={p}>
          Manter a confidencialidade da sua senha; conferir doses, contraindicações e protocolos locais antes de
          qualquer conduta; usar as ferramentas de registro (relatórios, passagens de plantão) em conformidade com as
          normas do seu serviço e do CFM.
        </p>

        <h2 style={h}>5. Inteligência artificial</h2>
        <p style={p}>
          As respostas da STAT IA são geradas por modelos de linguagem e podem conter erros. Elas são material de
          apoio — a decisão clínica e a conferência das informações são sempre do médico assistente.
        </p>

        <h2 style={h}>6. Alterações</h2>
        <p style={p}>
          Estes termos podem ser atualizados; mudanças relevantes serão comunicadas na plataforma. O uso contínuo após
          a atualização significa concordância.
        </p>

        <p style={{ ...p, marginTop: 26 }}>
          Veja também a <Link href="/privacidade" style={{ color: "var(--primary-press)", fontWeight: 700 }}>Política de Privacidade</Link>.
        </p>
      </div>
    </div>
  );
}
