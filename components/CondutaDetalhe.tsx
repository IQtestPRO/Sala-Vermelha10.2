"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Copy, Calculator, Camera, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIAS, CondutaCard } from "@/lib/condutas";
import { calcDose } from "@/lib/doseCalculator";
import { DISCLAIMER_CURTO } from "@/lib/legal/disclaimer";
import { resizeToJpegBase64 } from "@/lib/image";
import AcaoRapidaCard from "./AcaoRapidaCard";
import AnalysisResult, { Analysis } from "./AnalysisResult";

const ulStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: "flex",
  flexDirection: "column",
  gap: 5,
  fontSize: 14.5,
  lineHeight: 1.45,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label">{title}</div>
      {children}
    </div>
  );
}

export function categoriaLabel(card: CondutaCard) {
  return CATEGORIAS.find((c) => c.key === card.categoria)?.label;
}

export default function CondutaDetalhe({ card }: { card: CondutaCard }) {
  const [peso, setPeso] = useState<number | undefined>(undefined);
  const temCalculo = card.doses.some((d) => d.mgPorKg);

  // Análise de imagem por IA — especializada NESTA situação clínica.
  const fileRef = useRef<HTMLInputElement>(null);
  const [img, setImg] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  async function analyze(b: string) {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image_base64: b, area: card.titulo }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 503) {
        toast.error("IA ainda não configurada (defina ANTHROPIC_API_KEY na Vercel).");
        return;
      }
      if (!res.ok) {
        toast.error("A IA não conseguiu analisar agora. Tente de novo.");
        return;
      }
      setAnalysis(data.analysis as Analysis);
    } catch {
      toast.error("Falha de conexão.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function onPick(files: FileList | null) {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const b = await resizeToJpegBase64(file);
      setImg(b);
      setAnalysis(null);
      analyze(b); // analisa automaticamente — rapidez na sala vermelha
    } catch {
      toast.error("Não consegui ler a imagem.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function copiar() {
    const linhas: string[] = [card.titulo, ""];
    if (card.acaoRapida) {
      linhas.push("AÇÃO IMEDIATA:");
      card.acaoRapida.passos.forEach((p) =>
        linhas.push(`• ${p.acao}${p.ampola ? " — " + p.ampola : ""}${p.repetir ? " (" + p.repetir + ")" : ""}`)
      );
      if (card.acaoRapida.seRefratario) linhas.push(`Se não resolver: ${card.acaoRapida.seRefratario}`);
      linhas.push("");
    }
    linhas.push("Indicações:");
    card.indicacoes.forEach((i) => linhas.push("• " + i));
    linhas.push("", "Passos:");
    card.passos.forEach((p) => linhas.push(p));
    if (card.doses.length) {
      linhas.push("", "Doses:");
      card.doses.forEach((d) => linhas.push(`• ${d.farmaco}: ${d.dose}${d.via ? " " + d.via : ""}`));
    }
    navigator.clipboard?.writeText(linhas.join("\n")).then(
      () => toast.success("Conduta copiada."),
      () => toast.error("Não consegui copiar.")
    );
  }

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16, paddingBottom: 28 }}>
      {/* Análise por IA — foto do ECG/monitor deste paciente, especializada nesta situação */}
      <div className="card" style={{ borderColor: "var(--navy)", display: "flex", flexDirection: "column", gap: 12 }}>
        {!img ? (
          <>
            <button
              className="btn"
              onClick={() => fileRef.current?.click()}
              style={{ background: "var(--navy)", borderColor: "var(--navy)", color: "#fff" }}
            >
              <Camera size={20} /> Analisar ECG/monitor com IA
            </button>
            <p className="faint" style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45, textAlign: "center" }}>
              Tire a foto agora ou envie da galeria — a IA faz uma leitura rápida focada em{" "}
              <b style={{ color: "var(--text-dim)" }}>{card.titulo}</b>. Você lê e confirma.
            </p>
          </>
        ) : (
          <>
            <div style={{ position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/jpeg;base64,${img}`}
                alt="ECG/monitor"
                style={{ width: "100%", borderRadius: 12, border: "1px solid var(--border)", display: "block" }}
              />
              <button
                className="chip"
                onClick={() => fileRef.current?.click()}
                style={{ position: "absolute", top: 8, right: 8, minHeight: 34, background: "rgba(255,255,255,0.92)" }}
              >
                <RefreshCw size={14} /> Trocar
              </button>
            </div>
            {analyzing && (
              <div className="muted" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14 }}>
                <Loader2 size={18} className="spin" /> Analisando este paciente…
              </div>
            )}
            {analysis && <AnalysisResult a={analysis} />}
            {!analyzing && !analysis && (
              <button className="btn btn-ghost btn-sm" onClick={() => analyze(img)} style={{ alignSelf: "center" }}>
                <Sparkles size={16} /> Analisar de novo
              </button>
            )}
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onPick(e.target.files)} />
      </div>

      {card.acaoRapida && <AcaoRapidaCard acao={card.acaoRapida} />}

      <div className="card-2" style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 11.5, color: "var(--text-dim)", padding: "10px 12px", boxShadow: "none" }}>
        <AlertTriangle size={15} color="var(--amber)" style={{ flex: "0 0 auto", marginTop: 1 }} />
        <span>{DISCLAIMER_CURTO}</span>
      </div>

      <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }} onClick={copiar}>
        <Copy size={16} /> Copiar conduta
      </button>

      <Section title="Indicações">
        <ul style={ulStyle}>
          {card.indicacoes.map((i, k) => (
            <li key={k}>{i}</li>
          ))}
        </ul>
      </Section>

      {card.contraindicacoes && card.contraindicacoes.length > 0 && (
        <Section title="Contraindicações / não confundir">
          <ul style={ulStyle}>
            {card.contraindicacoes.map((i, k) => (
              <li key={k}>{i}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Passos">
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {card.passos.map((p, k) => (
            <div key={k} style={{ fontSize: 14.5, lineHeight: 1.5 }}>{p}</div>
          ))}
        </div>
      </Section>

      {card.energia && card.energia.length > 0 && (
        <Section title="Energia">
          <div className="card-2" style={{ display: "flex", flexDirection: "column", gap: 6, boxShadow: "none" }}>
            {card.energia.map((e, k) => (
              <div key={k} style={{ fontSize: 14.5, fontWeight: 600 }}>⚡ {e}</div>
            ))}
          </div>
        </Section>
      )}

      {card.doses.length > 0 && (
        <Section title="Doses">
          {temCalculo && (
            <div className="card-2" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, boxShadow: "none" }}>
              <Calculator size={18} color="var(--primary)" />
              <span className="muted" style={{ fontSize: 13 }}>Peso</span>
              <input
                className="field"
                inputMode="numeric"
                placeholder="kg"
                value={peso ?? ""}
                onChange={(e) => {
                  const n = e.target.value === "" ? undefined : Number(e.target.value.replace(",", "."));
                  setPeso(Number.isNaN(n as number) ? undefined : n);
                }}
                style={{ minHeight: 42, width: 90 }}
              />
              <span className="faint" style={{ fontSize: 12 }}>libera as doses</span>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {card.doses.map((d, k) => {
              const calc = peso ? calcDose(d, peso) : null;
              return (
                <div key={k} className="card-2" style={{ boxShadow: "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                    <span style={{ fontWeight: 800 }}>{d.farmaco}</span>
                    <span className="muted" style={{ fontSize: 13 }}>
                      {d.dose}
                      {d.via ? ` · ${d.via}` : ""}
                    </span>
                  </div>
                  {calc && (
                    <div style={{ marginTop: 6, color: "var(--primary-press)", fontWeight: 800, fontSize: 15 }}>
                      {peso} kg → {calc.label}
                    </div>
                  )}
                  {d.obs && <div className="faint" style={{ fontSize: 12.5, marginTop: 5, lineHeight: 1.4 }}>{d.obs}</div>}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <Section title="Alertas">
        <div className="card" style={{ borderColor: "color-mix(in srgb, var(--red) 30%, var(--border))", display: "flex", flexDirection: "column", gap: 7 }}>
          {card.alertas.map((a, k) => (
            <div key={k} style={{ fontSize: 14, lineHeight: 1.45, display: "flex", gap: 7 }}>
              <AlertTriangle size={15} color="var(--red)" style={{ flex: "0 0 auto", marginTop: 2 }} />
              <span>{a}</span>
            </div>
          ))}
        </div>
      </Section>

      <div className="faint" style={{ fontSize: 11.5, lineHeight: 1.5 }}>Referência: {card.referencia}</div>
    </div>
  );
}
