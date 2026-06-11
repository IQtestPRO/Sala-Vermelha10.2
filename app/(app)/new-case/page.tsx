"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Zap, ChevronLeft, Send, SlidersHorizontal, Sparkles, Loader2, Stethoscope } from "lucide-react";
import ScreenHero from "@/components/ScreenHero";
import PhotoCapture, { CapturedPhoto } from "@/components/PhotoCapture";
import AiFunnel from "@/components/AiFunnel";
import AnalysisResult, { Analysis } from "@/components/AnalysisResult";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import VoiceButton from "@/components/VoiceButton";
import { apiPost } from "@/lib/client";
import { RITMOS, RitmoMonitor, Sexo, Vitais } from "@/lib/types/case";

const ANALYZING_STEPS = [
  { text: "Lendo o caso e a imagem" },
  { text: "Identificando a condição" },
  { text: "Cruzando com a diretriz da especialidade" },
  { text: "Levantando hipóteses diagnósticas" },
  { text: "Definindo conduta imediata e doses" },
  { text: "Preparando a mensagem ao plantonista" },
];

function NumField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  suffix?: string;
}) {
  return (
    <div style={{ flex: 1 }}>
      <label className="label" style={{ marginBottom: 4 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        {/* dado clínico em MONO tabular (dado é dado, prosa é prosa) */}
        <input
          className="field data"
          inputMode="decimal"
          value={value ?? ""}
          onChange={(e) => {
            const n = e.target.value === "" ? undefined : Number(e.target.value.replace(",", "."));
            onChange(Number.isNaN(n as number) ? undefined : n);
          }}
          style={{ minHeight: 46, paddingRight: suffix ? 38 : 15, borderRadius: "var(--r-data)" }}
        />
        {suffix && (
          <span className="microlabel" style={{ position: "absolute", right: 11, top: 16, fontSize: 10 }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// Bloco editável da mensagem que vai ao plantonista (a IA preenche; o médico ajusta).
function MensagemBlock({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8, borderColor: "var(--primary)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 800, fontSize: 13.5, color: "var(--primary-press)" }}>
        <Stethoscope size={16} /> Mensagem ao plantonista (revise e ajuste)
      </div>
      <textarea
        className="field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Apresente o caso ao plantonista e peça a segunda opinião…"
        style={{ minHeight: 96 }}
      />
    </div>
  );
}

function NewCaseInner() {
  const router = useRouter();
  const params = useSearchParams();
  const urgenciaParam = params.get("mode") === "urgencia";

  const [urgente, setUrgente] = useState(urgenciaParam);
  const [step, setStep] = useState(1);
  const [summary, setSummary] = useState("");
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [age, setAge] = useState<number | undefined>(undefined);
  const [sexo, setSexo] = useState<Sexo | undefined>(undefined);
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [vitals, setVitals] = useState<Vitais>({});
  const [sending, setSending] = useState(false);

  // IA — a IA identifica sozinha a condição e aplica a guideline da especialidade.
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [aiMessage, setAiMessage] = useState("");
  const [perguntas, setPerguntas] = useState<{ pergunta: string; opcoes: string[] }[]>([]);

  const condutaId = "geral";
  const area = urgente ? "Urgência — qualquer caso" : "emergência geral";

  const setV = (patch: Partial<Vitais>) => setVitals((p) => ({ ...p, ...patch }));

  function resetAi() {
    setAnalysis(null);
    setAiMessage("");
    setPerguntas([]);
  }

  async function analyze(comFunil: boolean, respostas?: { pergunta: string; resposta: string }[]) {
    if (!photo && !summary.trim()) {
      toast.error("Descreva o caso ou anexe uma foto.");
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          image_base64: photo?.base64,
          conduta_id: condutaId,
          area,
          resumo: summary.trim() || undefined,
          vitais: Object.keys(vitals).length ? vitals : undefined,
          idade: age,
          peso: weight,
          sexo,
          comFunil,
          respostas,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 503) {
        toast.error("IA ainda não configurada (ANTHROPIC_API_KEY).");
        return;
      }
      if (!res.ok) {
        toast.error("A IA não conseguiu analisar agora. Tente de novo.");
        return;
      }
      const a = data.analysis as Analysis;
      setAnalysis(a);
      setAiMessage(a.mensagemPlantonista || "");
      setPerguntas(a.perguntas || []);
    } catch {
      toast.error("Falha de conexão.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function submit() {
    if (!photo && !summary.trim() && !aiMessage.trim()) {
      toast.error("Descreva o caso ou anexe uma foto.");
      return;
    }
    setSending(true);
    try {
      const { id } = await apiPost<{ id: string }>("/api/cases", {
        question_type: "OUTRO",
        clinical_summary: summary.trim() || (urgente ? "Caso de urgência (leitura imediata)" : ""),
        ai_message: aiMessage.trim() || undefined,
        ai_analysis: analysis || undefined,
        priority: urgente ? "urgent" : "critical",
        patient_age: age,
        patient_sex: sexo,
        patient_weight_kg: weight,
        vitals,
        image_urls: photo?.url ? [{ url: photo.url, kind: "ecg" as const }] : [],
      });
      toast.success(urgente ? "Caso URGENTE enviado! Plantonistas notificados." : "Caso enviado! Plantonistas notificados.");
      router.replace(`/case/${id}`);
    } catch {
      toast.error("Não consegui enviar o caso. Tente novamente.");
      setSending(false);
    }
  }

  // ============ FLUXO URGÊNCIA (só foto → leitura imediata → funil) ============
  if (urgente) {
    return (
      <>
        <MultiStepLoader loadingStates={ANALYZING_STEPS} loading={analyzing} duration={2400} />
        <ScreenHero
          bg="/hero-rapida.jpg"
          title="Urgência"
          subtitle="Leitura imediata pela imagem"
          onBack={() => {
            setUrgente(false);
            setPhoto(null);
            resetAi();
          }}
        />
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16, paddingBottom: 28 }}>
          <div className="card" style={{ borderColor: "var(--red)", background: "var(--red-tint)", display: "flex", gap: 9, alignItems: "flex-start" }}>
            <Zap size={18} color="var(--red)" style={{ flex: "0 0 auto", marginTop: 1 }} />
            <div style={{ fontSize: 13, lineHeight: 1.4 }}>
              <b style={{ color: "var(--red)" }}>Caso urgente.</b> Tire a foto do monitor e toque em analisar. A IA dá a leitura na
              hora e pode refinar com você por perguntas rápidas.
            </div>
          </div>

          <PhotoCapture photo={photo} onChange={(p) => { setPhoto(p); resetAi(); }} label="Foto do monitor / ECG" />

          {photo && !analysis && (
            <button className="btn btn-emergency" disabled={analyzing} onClick={() => analyze(true)}>
              {analyzing ? <><Loader2 size={20} className="spin" /> Analisando…</> : <><Sparkles size={20} /> Analisar agora</>}
            </button>
          )}

          {analysis && <AnalysisResult a={analysis} />}

          {analysis && perguntas.length > 0 && (
            <AiFunnel perguntas={perguntas} loading={analyzing} onFinish={(r) => analyze(true, r)} />
          )}

          {analysis && <MensagemBlock value={aiMessage} onChange={setAiMessage} />}

          {(analysis || photo) && (
            <button className="btn btn-emergency" disabled={sending} onClick={submit}>
              <Send size={20} /> {sending ? "Enviando…" : "Enviar ao plantonista (URGENTE)"}
            </button>
          )}
        </div>
      </>
    );
  }

  // ============ PASSO 2 (idade/peso/vitais — opcional) ============
  if (step === 2) {
    return (
      <>
        <ScreenHero
          bg="/hero-novocaso.jpg"
          title="Dados do paciente"
          subtitle="Tudo opcional — peso libera doses"
          right={
            <button className="hero-btn-text" onClick={() => setStep(1)}>
              <ChevronLeft size={16} /> Voltar
            </button>
          }
        />
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16, paddingBottom: 28 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <NumField label="Idade" value={age} onChange={setAge} suffix="anos" />
            <NumField label="Peso" value={weight} onChange={setWeight} suffix="kg" />
          </div>

          <div>
            <label className="label">Sexo</label>
            <div className="scroll-x">
              {([
                ["M", "Masculino"],
                ["F", "Feminino"],
                ["O", "Outro"],
              ] as [Sexo, string][]).map(([k, lbl]) => (
                <button key={k} className={`chip ${sexo === k ? "chip-on" : ""}`} onClick={() => setSexo(k)} style={{ flex: "0 0 auto" }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <hr className="divider" />

          {/* Dados críticos num POÇO (well) — vitais afundados como num monitor */}
          <div className="label">Sinais vitais</div>
          <div className="well" style={{ padding: "14px 14px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label className="label" style={{ marginBottom: 4 }}>
                Pressão arterial
              </label>
              <div className="scroll-x" style={{ marginBottom: 8 }}>
                {[
                  [120, 80],
                  [90, 60],
                  [80, 40],
                  [160, 100],
                ].map(([s, d]) => (
                  <button
                    key={`${s}/${d}`}
                    className={`chip data ${vitals.paSys === s && vitals.paDia === d ? "chip-on" : ""}`}
                    onClick={() => setV({ paSys: s, paDia: d })}
                    style={{ flex: "0 0 auto", fontSize: 13 }}
                  >
                    {s}/{d}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <NumField label="Sistólica" value={vitals.paSys} onChange={(v) => setV({ paSys: v })} suffix="mmHg" />
                <NumField label="Diastólica" value={vitals.paDia} onChange={(v) => setV({ paDia: v })} suffix="mmHg" />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <NumField label="FC" value={vitals.fc} onChange={(v) => setV({ fc: v })} suffix="bpm" />
              <NumField label="FR" value={vitals.fr} onChange={(v) => setV({ fr: v })} suffix="irpm" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <NumField label="SpO₂" value={vitals.satO2} onChange={(v) => setV({ satO2: v })} suffix="%" />
              <NumField label="Tax" value={vitals.tax} onChange={(v) => setV({ tax: v })} suffix="°C" />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <NumField label="Glicemia (HGT)" value={vitals.glicemia} onChange={(v) => setV({ glicemia: v })} suffix="mg/dL" />
              <NumField label="Glasgow" value={vitals.glasgow} onChange={(v) => setV({ glasgow: v })} />
            </div>
          </div>

          <div>
            <label className="label">Ritmo no monitor</label>
            <div className="scroll-x" style={{ flexWrap: "wrap" }}>
              {RITMOS.map((r) => (
                <button
                  key={r.key}
                  className={`chip ${vitals.ritmo === r.key ? "chip-on" : ""}`}
                  onClick={() => setV({ ritmo: vitals.ritmo === r.key ? undefined : (r.key as RitmoMonitor) })}
                  style={{ flex: "0 0 auto" }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-primary" onClick={() => setStep(1)}>
            <ChevronLeft size={18} /> Voltar para analisar / enviar
          </button>
        </div>
      </>
    );
  }

  // ============ ENTRADA ÚNICA: escreva o caso e/ou anexe uma foto ============
  return (
    <>
      <MultiStepLoader loadingStates={ANALYZING_STEPS} loading={analyzing} duration={2400} />
      <ScreenHero
        bg="/hero-novocaso.jpg"
        title="Novo caso"
        subtitle="Escreva o caso ou envie uma foto"
        right={
          <button className="hero-btn-text" onClick={() => router.back()}>
            <ChevronLeft size={16} /> Sair
          </button>
        }
      />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16, paddingBottom: 28 }}>
        <button
          className="btn btn-emergency pulse"
          onClick={() => { setUrgente(true); resetAi(); }}
          style={{ minHeight: 58, fontSize: 16.5 }}
        >
          <Zap size={22} /> URGÊNCIA — leitura imediata
        </button>

        <div>
          <label className="label">Relate o caso</label>
          <div style={{ position: "relative" }}>
            <textarea
              className="field"
              placeholder="Ex.: Homem, 58a, dor precordial em aperto com irradiação para MSE há 40 min, sudorese, PA 150/90. Anexei o ECG. (ou toque no microfone e fale)"
              value={summary}
              onChange={(e) => { setSummary(e.target.value); resetAi(); }}
              style={{ minHeight: 120, lineHeight: 1.5, paddingRight: 52 }}
            />
            <VoiceButton value={summary} onChange={setSummary} className="voice-in-area" />
          </div>
        </div>

        <PhotoCapture photo={photo} onChange={(p) => { setPhoto(p); resetAi(); }} label="Anexe o ECG / exame (opcional)" />

        <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setStep(2)}>
          <SlidersHorizontal size={18} /> Idade, peso e vitais (opcional)
        </button>

        {analysis && <AnalysisResult a={analysis} />}
        {analysis && <MensagemBlock value={aiMessage} onChange={setAiMessage} />}

        {/* FOOTER STICKY: ações sempre na thumb-zone (em 360px o CTA caía abaixo da dobra) */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: "var(--surface)",
            margin: "0 -16px -16px",
            padding: "10px 16px calc(10px + env(safe-area-inset-bottom))",
            borderTop: "1px solid var(--hairline)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            zIndex: 5,
          }}
        >
          {/* UM sólido por tela: enviar é o primário; analisar é etapa intermediária (outline) */}
          {!analysis && (
            <button
              className="btn btn-ghost"
              style={{ border: "1.5px solid var(--border-strong)", minHeight: 50 }}
              disabled={analyzing || (!photo && !summary.trim())}
              onClick={() => analyze(false)}
            >
              {analyzing ? <><Loader2 size={20} className="spin" /> Analisando…</> : <><Sparkles size={20} /> Analisar com IA</>}
            </button>
          )}
          {/* vermelho fica reservado à variante URGENTE; o fluxo normal envia em navy */}
          <button className="btn btn-primary" disabled={sending || (!photo && !summary.trim())} onClick={submit}>
            <Send size={20} /> {sending ? "Enviando…" : "Enviar ao plantonista"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function NewCasePage() {
  const fallback = useMemo(
    () => (
      <div className="app-main" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="muted">Carregando…</div>
      </div>
    ),
    []
  );
  return (
    <Suspense fallback={fallback}>
      <NewCaseInner />
    </Suspense>
  );
}
