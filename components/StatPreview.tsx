import { BookOpenCheck, Calculator, CalendarClock } from "lucide-react";
import EcgIcon from "@/components/icons/EcgIcon";

// O que tem dentro do STAT — seção clara abaixo do login (factual, sem ornamento).
const PILARES = [
  {
    icon: <BookOpenCheck size={20} />,
    title: "Protocolos + Modo PCR",
    desc: "ACLS interativo: ciclos de 2 min, adrenalina, metrônomo e relatório automático da parada.",
  },
  {
    icon: <Calculator size={20} />,
    title: "Calculadoras",
    desc: "Escores (NIHSS, qSOFA…), gasometria interpretada passo a passo e a diluição do SEU serviço.",
  },
  {
    icon: <EcgIcon size={20} stroke={2.2} />,
    title: "STAT IA",
    desc: "Envie a foto do ECG e discuta o caso. Conduta padrão-ouro + alternativa adaptada à UPA/SUS.",
    red: true,
  },
  {
    icon: <CalendarClock size={20} />,
    title: "Plantão",
    desc: "Agenda com financeiro (recebido / a receber) e passagem de plantão compartilhável no WhatsApp.",
  },
];

export default function StatPreview() {
  return (
    <section className="stat-preview">
      <div className="stat-preview-wrap">
        <div>
          <div className="eyebrow">O que tem dentro</div>
          <h2 className="stat-preview-title">Tudo o que o plantão precisa, em um lugar só.</h2>
          <p className="stat-preview-desc">
            Ferramentas pensadas para a rotina real de médicos e estudantes: da sala vermelha à organização dos seus
            plantões.
          </p>
          <p className="stat-preview-foot">Fundamentado em diretrizes — AHA · ESC · SBC · ACLS · Surviving Sepsis.</p>
        </div>

        <div className="stat-preview-grid">
          {PILARES.map((p) => (
            <div key={p.title} className="stat-preview-card">
              <span className="stat-preview-card-ic" style={p.red ? { background: "var(--red-tint)", color: "var(--red)" } : undefined}>
                {p.icon}
              </span>
              <span>
                <span className="stat-preview-card-title">{p.title}</span>
                <span className="stat-preview-card-desc">{p.desc}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
