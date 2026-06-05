"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Activity,
  HeartPulse,
  Zap,
  HeartCrack,
  Wind,
  Droplet,
  Brain,
  FlaskConical,
  Bone,
  Heart,
  CircleHelp,
  ChevronLeft,
  Send,
  SlidersHorizontal,
} from "lucide-react";
import TopBar from "@/components/TopBar";
import ImageUpload, { UploadedImage } from "@/components/ImageUpload";
import { apiPost } from "@/lib/client";
import {
  QUESTION_TYPES,
  questionMeta,
  QuestionType,
  RITMOS,
  RitmoMonitor,
  Sexo,
  Vitais,
} from "@/lib/types/case";
import { LGPD_NOTA } from "@/lib/legal/disclaimer";

const ICONS: Record<string, React.ReactNode> = {
  Activity: <Activity size={24} />,
  HeartPulse: <HeartPulse size={24} />,
  Zap: <Zap size={24} />,
  HeartCrack: <HeartCrack size={24} />,
  Wind: <Wind size={24} />,
  Droplet: <Droplet size={24} />,
  Brain: <Brain size={24} />,
  FlaskConical: <FlaskConical size={24} />,
  Bone: <Bone size={24} />,
  Heart: <Heart size={24} />,
  CircleHelp: <CircleHelp size={24} />,
};

function NumField({
  label,
  value,
  onChange,
  suffix,
  width,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  suffix?: string;
  width?: number;
}) {
  return (
    <div style={{ flex: width ? `0 0 ${width}px` : 1 }}>
      <label className="label" style={{ marginBottom: 4 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          className="field"
          inputMode="numeric"
          value={value ?? ""}
          onChange={(e) => {
            const n = e.target.value === "" ? undefined : Number(e.target.value.replace(",", "."));
            onChange(Number.isNaN(n as number) ? undefined : n);
          }}
          style={{ minHeight: 46, paddingRight: suffix ? 38 : 15 }}
        />
        {suffix && (
          <span className="faint" style={{ position: "absolute", right: 12, top: 13, fontSize: 13 }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function NewCaseInner() {
  const router = useRouter();
  const params = useSearchParams();
  const initialType = (params.get("type") as QuestionType) || null;

  const [step, setStep] = useState(1);
  const [qtype, setQtype] = useState<QuestionType | null>(
    initialType && QUESTION_TYPES.some((q) => q.key === initialType) ? initialType : null
  );
  const [summary, setSummary] = useState("");
  const [question, setQuestion] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);

  const [age, setAge] = useState<number | undefined>(undefined);
  const [sexo, setSexo] = useState<Sexo | undefined>(undefined);
  const [weight, setWeight] = useState<number | undefined>(undefined);
  const [vitals, setVitals] = useState<Vitais>({});
  const [sending, setSending] = useState(false);

  const meta = qtype ? questionMeta(qtype) : null;
  const canSubmit = !!qtype && (question.trim() !== "" || summary.trim() !== "" || images.length > 0);

  const setV = (patch: Partial<Vitais>) => setVitals((p) => ({ ...p, ...patch }));

  async function submit() {
    if (!qtype) {
      toast.error("Escolha o tipo de caso.");
      return;
    }
    setSending(true);
    try {
      const { id } = await apiPost<{ id: string }>("/api/cases", {
        question_type: qtype,
        question_text: question.trim() || summary.trim(),
        clinical_summary: summary.trim() || question.trim(),
        patient_age: age,
        patient_sex: sexo,
        patient_weight_kg: weight,
        vitals,
        image_urls: images.map((im) => ({ url: im.url, kind: "ecg" as const })),
      });
      toast.success("Caso enviado! Plantonistas notificados.");
      router.replace(`/case/${id}`);
    } catch {
      toast.error("Não consegui enviar o caso. Tente novamente.");
      setSending(false);
    }
  }

  // ---- Passo 1 ----
  if (step === 1) {
    return (
      <>
        <TopBar
          title="Novo caso"
          subtitle="Sala vermelha • resposta em 10 min"
          right={
            <button className="chip" style={{ minHeight: 38 }} onClick={() => router.back()}>
              <ChevronLeft size={16} /> Sair
            </button>
          }
        />
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16, paddingBottom: 28 }}>
          {!qtype ? (
            <div>
              <div className="label">Sobre o que é o caso?</div>
              <div className="grid-tiles">
                {QUESTION_TYPES.map((q) => (
                  <button
                    key={q.key}
                    onClick={() => {
                      setQtype(q.key);
                      setQuestion(q.presets[0] ?? "");
                    }}
                    className="card-2"
                    style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, cursor: "pointer", minHeight: 92 }}
                  >
                    <span style={{ color: "var(--red)" }}>{ICONS[q.icon]}</span>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>{q.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "var(--red)" }}>{meta && ICONS[meta.icon]}</span>
                <div style={{ fontWeight: 800, fontSize: 17, flex: 1 }}>{meta?.label}</div>
                <button className="chip" style={{ minHeight: 36 }} onClick={() => setQtype(null)}>
                  Trocar
                </button>
              </div>

              <div>
                <label className="label">Foto do ECG / monitor</label>
                <ImageUpload images={images} onChange={setImages} />
                <div className="faint" style={{ fontSize: 11, marginTop: 8 }}>
                  {LGPD_NOTA}
                </div>
              </div>

              <div>
                <label className="label">Resumo clínico (curto)</label>
                <input
                  className="field"
                  placeholder="Ex.: FA aguda, instável, FC 180, PA 80/50"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Pergunta ao plantonista</label>
                <div className="scroll-x" style={{ marginBottom: 8 }}>
                  {meta?.presets.map((p) => (
                    <button key={p} className={`chip ${question === p ? "chip-on" : ""}`} onClick={() => setQuestion(p)} style={{ flex: "0 0 auto" }}>
                      {p}
                    </button>
                  ))}
                </div>
                <textarea
                  className="field"
                  placeholder="Descreva a dúvida de conduta…"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>

              <button className="btn" onClick={() => setStep(2)}>
                <SlidersHorizontal size={20} /> Adicionar idade, peso e vitais (opcional)
              </button>
              <button className="btn btn-emergency" disabled={!canSubmit || sending} onClick={submit}>
                <Send size={20} /> {sending ? "Enviando…" : "Enviar agora"}
              </button>
            </>
          )}
        </div>
      </>
    );
  }

  // ---- Passo 2 ----
  return (
    <>
      <TopBar
        title="Dados do paciente"
        subtitle="Tudo opcional — peso libera doses"
        right={
          <button className="chip" style={{ minHeight: 38 }} onClick={() => setStep(1)}>
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

        <div className="label">Sinais vitais</div>
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
                className={`chip ${vitals.paSys === s && vitals.paDia === d ? "chip-on" : ""}`}
                onClick={() => setV({ paSys: s, paDia: d })}
                style={{ flex: "0 0 auto" }}
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

        <button className="btn btn-emergency" disabled={!canSubmit || sending} onClick={submit}>
          <Send size={20} /> {sending ? "Enviando…" : "Enviar caso"}
        </button>
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
