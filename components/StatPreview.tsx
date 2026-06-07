"use client";

import { FlippingText, IphoneMockup } from "@/block/text-animation-flipping-words-demo";

// Previa + tutorial do app, exibida abaixo do login. Adaptada ao STAT (PT-BR).
const STEPS = [
  { icon: "📷", title: "1. Fotografe o ECG", desc: "Tire ou envie a foto do monitor ou do ECG do paciente." },
  { icon: "⚡", title: "2. Analise com a IA", desc: "Leitura fundamentada em diretrizes em menos de 2 minutos." },
  { icon: "🩺", title: "3. Receba a conduta", desc: "Hipóteses, conduta imediata e doses calculadas por peso." },
  { icon: "✅", title: "4. Confirme com o plantonista", desc: "Um plantonista revisa e valida a conduta do caso." },
  { icon: "⚡", title: "5. Ação rápida & condutas", desc: "Drogas, doses e protocolos da sala vermelha na hora." },
];

export default function StatPreview() {
  return (
    <section className="stat-preview">
      <div className="stat-preview-wrap">
        <div className="stat-preview-left">
          <div className="eyebrow" style={{ color: "#8fa1bd" }}>Como funciona</div>
          <h2 className="stat-preview-title">
            O STAT lê <FlippingText words={["ECG", "arritmias", "PCR", "choque", "intoxicações"]} className="flip-red" />
          </h2>
          <p className="stat-preview-desc">
            Da foto do monitor à conduta com evidência, em menos de 2 minutos. A IA analisa o caso fundamentada em diretrizes
            (AHA, ESC, SBC) e um plantonista confirma a conduta na sala vermelha.
          </p>
          <p className="stat-preview-foot">Baseado em diretrizes · AHA · ESC · SBC · ACLS</p>
        </div>

        <IphoneMockup>
          <div className="stat-preview-phone">
            {STEPS.map((s, i) => (
              <div key={i} className="stat-preview-card">
                <span className="stat-preview-card-ic">{s.icon}</span>
                <span>
                  <span className="stat-preview-card-title">{s.title}</span>
                  <span className="stat-preview-card-desc">{s.desc}</span>
                </span>
              </div>
            ))}
          </div>
        </IphoneMockup>
      </div>
    </section>
  );
}
