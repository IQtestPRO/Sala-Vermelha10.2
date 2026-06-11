"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/* ============================================================================
   MODO PCR (ACLS) — ferramenta usada DURANTE a parada (luva, estresse).
   Timers por TIMESTAMP ABSOLUTO (zero drift) · persistência (retomar) ·
   Wake Lock · metrônomo Web Audio · alertas bipe/vibra/flash · relatório.
   Tela cheia, fundo escuro, vermelho liberado (é O caso de urgência).
   ========================================================================== */

const LS_KEY = "stat_pcr_ativa";
const CICLO_SEG = 120;

type Ritmo = "FV/TV" | "AESP" | "ASSISTOLIA";
type Evento = { tipo: "inicio" | "ritmo" | "choque" | "droga" | "rce"; label: string; t: number };
type PcrState = {
  startedAt: number;
  cicloStart: number;
  adrenalinaStart: number | null;
  adrenalinaIntervalSec: number;
  ciclos: number;
  ritmos: { ciclo: number; ritmo: Ritmo; t: number }[];
  eventos: Evento[];
  choques: number;
  amiodaronas: number;
  causas: Record<string, boolean>;
  posRce: Record<string, boolean>;
  emRce: boolean;
  metronomo: boolean;
  bpm: number;
  vibrar: boolean;
  finalizado: boolean;
};

const CAUSAS = ["Hipovolemia", "Hipóxia", "H⁺ (acidose)", "Hipo/Hipercalemia", "Hipotermia", "Pneumotórax hipertensivo", "Tamponamento cardíaco", "Toxinas", "TEP", "Trombose coronária (IAM)"];
const POS_RCE = ["Via aérea / capnografia", "PAM ≥ 65 mmHg", "SatO₂ 92–98%", "ECG 12 derivações", "Controle de temperatura (TTM)", "Buscar e tratar a causa"];
const MEDS: { k: string; label: string; dose: string; destaque?: boolean }[] = [
  { k: "adr", label: "Adrenalina", dose: "1 mg", destaque: true },
  { k: "ami", label: "Amiodarona", dose: "300 mg" },
  { k: "lid", label: "Lidocaína", dose: "1–1,5 mg/kg" },
  { k: "bic", label: "Bic. de sódio", dose: "1 mEq/kg" },
  { k: "cal", label: "Cálcio", dose: "1 g" },
  { k: "mag", label: "Magnésio", dose: "1–2 g" },
  { k: "pot", label: "Potássio", dose: "—" },
  { k: "vol", label: "Volume", dose: "SF 0,9%" },
];

const mmss = (seg: number) => {
  const s = Math.max(0, Math.round(seg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
const hhmm = (t: number) => new Date(t).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

function load(): PcrState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as PcrState;
    return s && !s.finalizado && s.startedAt ? s : null;
  } catch {
    return null;
  }
}
function persist(s: PcrState | null) {
  try {
    if (s) localStorage.setItem(LS_KEY, JSON.stringify(s));
    else localStorage.removeItem(LS_KEY);
  } catch {
    /* noop */
  }
}

// Outbox: o relatório finalizado OFFLINE nunca se perde — fica na fila e sincroniza ao voltar a rede.
const OUTBOX_KEY = "stat_pcr_outbox";
function enqueueOutbox(payload: unknown) {
  try {
    const q = JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]");
    q.push(payload);
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(q.slice(-20)));
  } catch {
    /* noop */
  }
}
async function flushOutbox() {
  let q: unknown[];
  try {
    q = JSON.parse(localStorage.getItem(OUTBOX_KEY) || "[]");
  } catch {
    return;
  }
  if (!Array.isArray(q) || !q.length) return;
  const restantes: unknown[] = [];
  for (const item of q) {
    try {
      const r = await fetch("/api/pcr", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(item) });
      if (!r.ok) restantes.push(item);
    } catch {
      restantes.push(item);
    }
  }
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(restantes));
  } catch {
    /* noop */
  }
}

function Dial({ label, restante, total, cor, alerta }: { label: string; restante: number; total: number; cor: string; alerta: boolean }) {
  const R = 70, C = 2 * Math.PI * R;
  const frac = total > 0 ? Math.max(0, Math.min(1, restante / total)) : 0;
  return (
    <div style={{ position: "relative", width: 158, height: 158, display: "grid", placeItems: "center" }}>
      <svg width="158" height="158" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="79" cy="79" r={R} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="10" />
        <circle cx="79" cy="79" r={R} fill="none" stroke={alerta ? "#ff2d3f" : cor} strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} style={{ transition: "stroke-dashoffset .25s linear" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.08em", color: alerta ? "#ff6b76" : "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>{label}</div>
        <div className="data" style={{ fontSize: 40, fontWeight: 800, color: alerta ? "#ff2d3f" : "#fff", lineHeight: 1 }}>{mmss(restante)}</div>
      </div>
    </div>
  );
}

export default function PcrPage() {
  const router = useRouter();
  const [pcr, setPcr] = useState<PcrState | null>(null);
  const [retomavel, setRetomavel] = useState<PcrState | null>(null);
  const [painel, setPainel] = useState<"" | "causas" | "rce" | "relatorio">("");
  const [finalizando, setFinalizando] = useState(false);
  const [, tick] = useReducer((x) => x + 1, 0);
  const wakeRef = useRef<WakeLockSentinel | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const nextBeatRef = useRef(0);

  useEffect(() => {
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, []);
  // Modo PCR é tela cheia: esconde a barra de navegação enquanto estiver aberto.
  useEffect(() => {
    document.body.classList.add("rcp-open");
    return () => document.body.classList.remove("rcp-open");
  }, []);
  useEffect(() => {
    const s = load();
    if (s) setRetomavel(s);
  }, []);
  // Sincroniza relatórios pendentes (finalizados offline) ao montar e ao voltar a rede/visibilidade.
  useEffect(() => {
    flushOutbox();
    const on = () => flushOutbox();
    window.addEventListener("online", on);
    document.addEventListener("visibilitychange", on);
    return () => {
      window.removeEventListener("online", on);
      document.removeEventListener("visibilitychange", on);
    };
  }, []);

  // ---- Áudio (Web Audio, sem arquivos; unlock no 1º gesto p/ iOS) ----
  const ensureAudio = useCallback(() => {
    try {
      if (!audioRef.current) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioRef.current = new AC();
      }
      if (audioRef.current.state === "suspended") audioRef.current.resume();
      return audioRef.current;
    } catch {
      return null;
    }
  }, []);
  const beep = useCallback((freq = 900, dur = 45, vol = 0.5) => {
    const ac = ensureAudio();
    if (!ac) return;
    try {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = "sine";
      o.frequency.value = freq;
      o.connect(g);
      g.connect(ac.destination);
      const t = ac.currentTime;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur / 1000);
      o.start(t);
      o.stop(t + dur / 1000);
    } catch {
      /* noop */
    }
  }, [ensureAudio]);
  const alertaSom = useCallback(() => {
    beep(520, 200, 0.6);
    setTimeout(() => beep(760, 220, 0.6), 230);
    try {
      navigator.vibrate?.([300, 120, 300]);
    } catch {
      /* noop */
    }
  }, [beep]);

  // ---- Wake Lock ----
  const pedirWake = useCallback(async () => {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLockSentinel> } };
      if (nav.wakeLock) wakeRef.current = await nav.wakeLock.request("screen");
    } catch {
      /* noop */
    }
  }, []);
  const ativa = pcr && !pcr.finalizado;
  useEffect(() => {
    if (!ativa) return;
    pedirWake();
    const onVis = () => document.visibilityState === "visible" && pedirWake();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      wakeRef.current?.release().catch(() => {});
      wakeRef.current = null;
    };
  }, [ativa, pedirWake]);

  // ---- derivados (sempre dos timestamps) ----
  const now = Date.now();
  const total = pcr ? (now - pcr.startedAt) / 1000 : 0;
  const cicloRest = pcr ? CICLO_SEG - (now - pcr.cicloStart) / 1000 : CICLO_SEG;
  // RCE = paciente com pulso: silencia alertas de ciclo/adrenalina e pausa o metrônomo.
  const cicloAlerta = !!ativa && !pcr?.emRce && cicloRest <= 0;
  const adrRest = pcr?.adrenalinaStart != null ? pcr.adrenalinaIntervalSec - (now - pcr.adrenalinaStart) / 1000 : null;
  const adrAlerta = !!ativa && !pcr?.emRce && adrRest != null && adrRest <= 0;
  const ultimoRitmo = pcr?.ritmos[pcr.ritmos.length - 1]?.ritmo;
  const nAdr = pcr ? pcr.eventos.filter((e) => e.tipo === "droga" && e.label.startsWith("Adrenalina")).length : 0;
  const naoChocavel = ultimoRitmo === "AESP" || ultimoRitmo === "ASSISTOLIA";

  // ---- Metrônomo SAMPLE-ACCURATE (agenda os cliques pelo relógio do AudioContext → sem drift) ----
  useEffect(() => {
    if (!ativa || !pcr?.metronomo || pcr?.emRce) return;
    const ac = ensureAudio();
    if (!ac) return;
    const spb = 60 / (pcr.bpm || 110);
    nextBeatRef.current = Math.max(ac.currentTime + 0.06, nextBeatRef.current || 0);
    const click = (t: number) => {
      try {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = "square";
        o.frequency.value = 1000;
        o.connect(g);
        g.connect(ac.destination);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.5, t + 0.001);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
        o.start(t);
        o.stop(t + 0.06);
      } catch {
        /* noop */
      }
    };
    const lookahead = setInterval(() => {
      const ahead = ac.currentTime + 0.15;
      while (nextBeatRef.current < ahead) {
        click(nextBeatRef.current);
        if (pcr.vibrar) {
          try {
            navigator.vibrate?.(16);
          } catch {
            /* noop */
          }
        }
        nextBeatRef.current += spb;
      }
    }, 25);
    return () => clearInterval(lookahead);
  }, [ativa, pcr?.metronomo, pcr?.emRce, pcr?.bpm, pcr?.vibrar, ensureAudio]);

  // ---- Alertas (bipe periódico enquanto em alerta) ----
  useEffect(() => {
    if (!cicloAlerta) return;
    alertaSom();
    const id = setInterval(alertaSom, 2600);
    return () => clearInterval(id);
  }, [cicloAlerta, alertaSom]);
  useEffect(() => {
    if (!adrAlerta) return;
    alertaSom();
    const id = setInterval(alertaSom, 3000);
    return () => clearInterval(id);
  }, [adrAlerta, alertaSom]);

  // ---- mutadores ----
  function upd(patch: Partial<PcrState> | ((p: PcrState) => Partial<PcrState>)) {
    setPcr((prev) => {
      if (!prev) return prev;
      const p = typeof patch === "function" ? patch(prev) : patch;
      const next = { ...prev, ...p };
      persist(next);
      return next;
    });
  }
  function ev(prev: PcrState, e: Omit<Evento, "t">): Evento[] {
    return [...prev.eventos, { ...e, t: Date.now() }];
  }

  function iniciar() {
    ensureAudio();
    try { navigator.vibrate?.(50); } catch { /* noop */ }
    const t = Date.now();
    const s: PcrState = {
      startedAt: t, cicloStart: t, adrenalinaStart: null, adrenalinaIntervalSec: 240,
      ciclos: 1, ritmos: [], eventos: [{ tipo: "inicio", label: "Início da PCR", t }], choques: 0, amiodaronas: 0,
      causas: {}, posRce: {}, emRce: false, metronomo: true, bpm: 110, vibrar: false, finalizado: false,
    };
    setPcr(s);
    persist(s);
    setRetomavel(null);
  }
  function selecionarRitmo(r: Ritmo) {
    ensureAudio();
    upd((p) => ({
      ritmos: [...p.ritmos, { ciclo: p.ciclos, ritmo: r, t: Date.now() }],
      eventos: ev(p, { tipo: "ritmo", label: p.ritmos.length === 0 ? `Ritmo inicial: ${r}` : `Ritmo: ${r}` }),
      cicloStart: Date.now(),
      // Ritmo INICIAL ainda é o 1º ciclo (não avança); só as checagens de 2 min avançam.
      ciclos: p.ritmos.length === 0 ? p.ciclos : p.ciclos + 1,
    }));
  }
  function registrarChoque() {
    upd((p) => ({ choques: p.choques + 1, eventos: ev(p, { tipo: "choque", label: `Choque (${p.choques + 1}º)` }) }));
    toast.success("Choque registrado.");
  }
  function registrarDroga(m: { k: string; label: string; dose: string }) {
    ensureAudio();
    upd((p) => {
      let label = `${m.label} ${m.dose}`;
      const patch: Partial<PcrState> = {};
      if (m.k === "adr") patch.adrenalinaStart = Date.now();
      if (m.k === "ami") {
        const n = p.amiodaronas + 1;
        label = `Amiodarona ${n === 1 ? "300 mg" : "150 mg"}`;
        patch.amiodaronas = n;
      }
      patch.eventos = ev(p, { tipo: "droga", label });
      return patch;
    });
    toast.success(`${m.label} registrada.`);
  }
  function retomar() {
    ensureAudio();
    if (retomavel) {
      setPcr(retomavel);
      setRetomavel(null);
    }
  }
  function entrarRce() {
    upd((p) => ({ emRce: true, eventos: ev(p, { tipo: "rce", label: "RCE — retorno de circulação" }) }));
    setPainel("rce");
  }

  function montarRelatorio(s: PcrState, desfecho: "RCE" | "Óbito"): string {
    const dur = mmss((Date.now() - s.startedAt) / 1000);
    const linhas: string[] = [];
    linhas.push("RELATÓRIO DE PCR — STAT");
    linhas.push(`Início ${hhmm(s.startedAt)} · Duração ${dur} · Desfecho: ${desfecho}`);
    linhas.push(`Ciclos: ${s.ritmos.length || s.ciclos} · Choques: ${s.choques}`);
    if (s.ritmos.length) linhas.push(`Ritmos: ${s.ritmos.map((r, i) => `${i + 1}º ${r.ritmo}`).join(" · ")}`);
    linhas.push("");
    linhas.push("Linha do tempo:");
    s.eventos.forEach((e) => linhas.push(`  ${mmss((e.t - s.startedAt) / 1000)}  ${e.label}`));
    const causas = Object.keys(s.causas).filter((c) => s.causas[c]);
    if (causas.length) linhas.push("", `Causas (5H/5T) investigadas: ${causas.join(", ")}`);
    if (desfecho === "RCE") {
      const pos = Object.keys(s.posRce).filter((c) => s.posRce[c]);
      if (pos.length) linhas.push("", `Pós-RCE: ${pos.join(", ")}`);
    }
    linhas.push("", "Registro de apoio — confirmar com prontuário.");
    return linhas.join("\n");
  }
  const [relatorioTxt, setRelatorioTxt] = useState("");

  function finalizar(desfecho: "RCE" | "Óbito") {
    if (!pcr) return;
    const txt = montarRelatorio(pcr, desfecho);
    setRelatorioTxt(txt);
    enqueueOutbox({
      started_at: pcr.startedAt,
      duracao_seg: Math.round((Date.now() - pcr.startedAt) / 1000),
      ciclos: pcr.ritmos.length || pcr.ciclos,
      choques: pcr.choques,
      desfecho,
      eventos: pcr.eventos,
      ritmos: pcr.ritmos,
      causas: Object.keys(pcr.causas).filter((c) => pcr.causas[c]),
      relatorio: txt,
    }); // nunca se perde: vai p/ a fila e sincroniza quando houver rede
    persist(null);
    setFinalizando(false);
    setPcr((p) => (p ? { ...p, finalizado: true } : p));
    setPainel("relatorio");
    flushOutbox(); // tenta enviar agora (se online)
  }

  async function compartilhar() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Relatório de PCR", text: relatorioTxt });
        return;
      }
    } catch {
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(relatorioTxt)}`, "_blank");
  }

  // ===================== Telas =====================
  if (painel === "relatorio") {
    return (
      <div style={{ ...shell, justifyContent: "flex-start", paddingTop: "calc(env(safe-area-inset-top) + 18px)" }}>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 22, marginBottom: 12 }}>Relatório da PCR</div>
        <pre className="data" style={{ width: "100%", maxWidth: 440, whiteSpace: "pre-wrap", fontSize: 12.5, lineHeight: 1.5, color: "#cdd6e6", background: "#10131b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 14, overflowY: "auto", flex: 1 }}>{relatorioTxt}</pre>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(relatorioTxt).then(
              () => toast.success("Relatório copiado — cole no prontuário."),
              () => toast.error("Não consegui copiar.")
            );
          }}
          style={{ ...bigBtn, background: "#1f2a3d", marginTop: 12, minHeight: 52, fontSize: 16 }}
        >
          Copiar relatório
        </button>
        <button onClick={compartilhar} style={{ ...bigBtn, background: "#1f8f4f", marginTop: 8, minHeight: 52, fontSize: 16 }}>Compartilhar no WhatsApp</button>
        <button onClick={() => router.push("/condutas")} style={ghostBtn}>Concluir</button>
      </div>
    );
  }

  if (!pcr) {
    return (
      <div style={shell}>
        {retomavel && (
          <button onClick={retomar} style={{ ...bigBtn, background: "#b8860b", marginBottom: 18 }}>
            ▶ Retomar PCR em andamento
            <span style={{ display: "block", fontSize: 13, fontWeight: 600, opacity: 0.85, marginTop: 4 }}>{mmss((Date.now() - retomavel.startedAt) / 1000)} decorridos</span>
          </button>
        )}
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 26, marginBottom: 6 }}>Modo PCR · ACLS</div>
        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, textAlign: "center", maxWidth: 320, marginBottom: 30, lineHeight: 1.5 }}>Ciclo, adrenalina, metrônomo e registro para conduzir a parada.</div>
        <button onClick={iniciar} style={{ ...bigBtn, background: "#E11D2A", fontSize: 26 }}>INICIAR PCR</button>
        <button onClick={() => router.push("/condutas")} style={ghostBtn}>Voltar</button>
      </div>
    );
  }

  return (
    <div style={{ ...shell, padding: 0, paddingBottom: 0, alignItems: "stretch", justifyContent: "flex-start", overflowY: "hidden", animation: cicloAlerta || adrAlerta ? "pcrflash 0.8s steps(1) infinite" : undefined }}>
      {/* ZONA 1 — cronômetros: SEMPRE visível no topo */}
      <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "calc(env(safe-area-inset-top) + 12px) 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>TOTAL</span>
          <span className="data" style={{ color: "#fff", fontSize: 26, fontWeight: 800 }}>{mmss(total)}</span>
        </div>
        <div style={{ display: "flex", gap: 10, margin: "8px 0 6px" }}>
          <Dial label="Ciclo" restante={Math.max(0, cicloRest)} total={CICLO_SEG} cor="#3b82f6" alerta={cicloAlerta} />
          <Dial label="Adrenalina" restante={adrRest != null ? Math.max(0, adrRest) : pcr.adrenalinaIntervalSec} total={pcr.adrenalinaIntervalSec} cor="#f59e0b" alerta={adrAlerta} />
        </div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13.5, fontWeight: 700, marginBottom: 3 }}>
          Diagnóstico: {pcr.ciclos}º ciclo{ultimoRitmo ? ` · ${ultimoRitmo}` : ""}
        </div>
        <div className="data" style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
          <span>Adrenalina ×{nAdr} · Choques {pcr.choques}</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            Adr
            <button onClick={() => upd({ adrenalinaIntervalSec: Math.max(180, pcr.adrenalinaIntervalSec - 60) })} aria-label="Diminuir intervalo de adrenalina" style={{ ...miniBtn, fontSize: 16 }}>−</button>
            {Math.round(pcr.adrenalinaIntervalSec / 60)} min
            <button onClick={() => upd({ adrenalinaIntervalSec: Math.min(300, pcr.adrenalinaIntervalSec + 60) })} aria-label="Aumentar intervalo de adrenalina" style={{ ...miniBtn, fontSize: 16 }}>+</button>
          </span>
        </div>
      </div>

      {/* ZONA 2 — ritmos / medicações: ROLA se precisar */}
      <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 16px", gap: 8 }}>
        {adrAlerta && !cicloAlerta && <div style={{ textAlign: "center", color: "#ffb020", fontWeight: 800, fontSize: 16 }}>💉 ADRENALINA AGORA?</div>}

        {cicloAlerta || pcr.ritmos.length === 0 ? (
          /* ritmos vazio = início da PCR: permite registrar o ritmo inicial já no 1º minuto (FV presenciada → choque imediato) */
          <div style={{ width: "100%", maxWidth: 440 }}>
            <div style={{ textAlign: "center", color: "#ff5b64", fontWeight: 800, fontSize: 17, marginBottom: 8 }}>{pcr.ritmos.length === 0 && !cicloAlerta ? "Ritmo inicial?" : "⚠ CHEQUE O RITMO"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <button onClick={() => selecionarRitmo("FV/TV")} style={{ ...ritmoBtn, background: "#7a1620" }}>FV/TV<span style={blk}>chocável</span></button>
              <button onClick={() => selecionarRitmo("AESP")} style={{ ...ritmoBtn, background: "#1f2a3d" }}>AESP<span style={blk}>adrenalina</span></button>
              <button onClick={() => selecionarRitmo("ASSISTOLIA")} style={{ ...ritmoBtn, background: "#1f2a3d", fontSize: 14 }}>Assistolia<span style={blk}>adrenalina</span></button>
            </div>
          </div>
        ) : (
          <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 8 }}>
            {naoChocavel && <div style={{ textAlign: "center", color: "rgba(255,255,255,0.72)", fontSize: 13, fontWeight: 600 }}>Não chocável → Adrenalina + reiniciar massagem</div>}
            {ultimoRitmo === "FV/TV" && (
              <button onClick={registrarChoque} style={{ ...bigBtn, background: "#E11D2A", minHeight: 56 }}>
                ⚡ Registrar choque{pcr.choques >= 2 ? " · Amiodarona após o 3º" : ""}
              </button>
            )}
            {/* Grade de medicações */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {MEDS.map((m) => (
                <button
                  key={m.k}
                  onClick={() => registrarDroga(m)}
                  style={{
                    minHeight: 56, borderRadius: 13, border: "none", color: "#fff", cursor: "pointer", padding: "8px 10px",
                    background: m.destaque ? (adrAlerta ? "#E11D2A" : "#9a1b24") : "#1f2a3d",
                    fontWeight: 800, fontSize: 15, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1.2,
                  }}
                >
                  {m.label}
                  <span style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.8, marginTop: 2 }}>{m.k === "ami" ? (pcr.amiodaronas === 0 ? "300 mg" : "150 mg") : m.dose}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ZONA 3 — causas · metrônomo · ações: SEMPRE visível no rodapé */}
      <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: "100%", padding: "10px 16px calc(env(safe-area-inset-bottom) + 12px)", borderTop: "1px solid rgba(255,255,255,0.08)", background: "#0b1019" }}>
        <div style={{ width: "100%", maxWidth: 440, display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setPainel("causas")} style={barBtn}>Causas 5H/5T</button>
          <div style={{ ...barBtn, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "default" }}>
            <button onClick={() => upd({ bpm: Math.max(100, pcr.bpm - 5) })} style={miniBtn}>−</button>
            <button onClick={() => { ensureAudio(); upd({ metronomo: !pcr.metronomo }); }} style={{ background: "none", border: "none", color: pcr.metronomo ? "#4ade80" : "rgba(255,255,255,0.7)", fontWeight: 800, fontSize: 13, cursor: "pointer", minWidth: 64 }}>
              {pcr.metronomo ? "🔊" : "🔇"} {pcr.bpm} bpm
            </button>
            <button onClick={() => upd({ bpm: Math.min(120, pcr.bpm + 5) })} style={miniBtn}>+</button>
          </div>
        </div>
        <div style={{ width: "100%", maxWidth: 440, display: "flex", gap: 8 }}>
          {!pcr.emRce ? (
            <button onClick={entrarRce} style={{ ...bigBtn, background: "#1f8f4f", minHeight: 52, fontSize: 17 }}>RCE</button>
          ) : (
            <button onClick={() => setPainel("rce")} style={{ ...bigBtn, background: "#1f8f4f", minHeight: 52, fontSize: 17 }}>Pós-RCE</button>
          )}
          <button onClick={() => setFinalizando(true)} style={{ ...ghostBtn, marginTop: 0, borderColor: "rgba(255,255,255,0.25)", color: "#fff", minHeight: 52, flex: 1 }}>Finalizar</button>
        </div>
      </div>

      {finalizando && (
        <div style={{ position: "fixed", inset: 0, zIndex: 220, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setFinalizando(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 360, background: "#12161f", borderRadius: 18, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 18, textAlign: "center" }}>Encerrar a PCR?</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center", marginBottom: 4 }}>Escolha o desfecho — gera o relatório.</div>
            <button onClick={() => finalizar("RCE")} style={{ ...bigBtn, background: "#1f8f4f", minHeight: 54 }}>RCE (retorno de circulação)</button>
            <button onClick={() => finalizar("Óbito")} style={{ ...bigBtn, background: "#7a1620", minHeight: 54 }}>Óbito</button>
            <button onClick={() => setFinalizando(false)} style={{ ...ghostBtn, marginTop: 2, color: "#fff", minHeight: 46 }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Painel: Causas */}
      {painel === "causas" && (
        <Sheet titulo="Causas reversíveis (5H/5T)" onClose={() => setPainel("")}>
          {CAUSAS.map((c) => (
            <button key={c} onClick={() => upd((p) => ({ causas: { ...p.causas, [c]: !p.causas[c] } }))} style={{ ...checkRow, borderColor: pcr.causas[c] ? "#4ade80" : "rgba(255,255,255,0.14)" }}>
              <span style={{ ...checkBox, background: pcr.causas[c] ? "#4ade80" : "transparent", borderColor: pcr.causas[c] ? "#4ade80" : "rgba(255,255,255,0.3)" }}>{pcr.causas[c] ? "✓" : ""}</span>
              {c}
            </button>
          ))}
        </Sheet>
      )}
      {/* Painel: pós-RCE */}
      {painel === "rce" && (
        <Sheet titulo="Cuidados pós-RCE" onClose={() => setPainel("")}>
          {POS_RCE.map((c) => (
            <button key={c} onClick={() => upd((p) => ({ posRce: { ...p.posRce, [c]: !p.posRce[c] } }))} style={{ ...checkRow, borderColor: pcr.posRce[c] ? "#4ade80" : "rgba(255,255,255,0.14)" }}>
              <span style={{ ...checkBox, background: pcr.posRce[c] ? "#4ade80" : "transparent", borderColor: pcr.posRce[c] ? "#4ade80" : "rgba(255,255,255,0.3)" }}>{pcr.posRce[c] ? "✓" : ""}</span>
              {c}
            </button>
          ))}
        </Sheet>
      )}

      <style>{`@keyframes pcrflash { 0% { background:#0a0e16 } 50% { background:#37090d } }`}</style>
    </div>
  );
}

function Sheet({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 210, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", background: "#12161f", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: "18px 16px calc(env(safe-area-inset-bottom) + 18px)", maxHeight: "82vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>{titulo}</span>
          <button onClick={onClose} aria-label="Fechar painel" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 22, cursor: "pointer", width: 44, height: 44, display: "grid", placeItems: "center", margin: -10 }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
      </div>
    </div>
  );
}

const shell: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 200, background: "#0a0e16", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, paddingBottom: "calc(env(safe-area-inset-bottom) + 14px)", overflowY: "auto" };
const bigBtn: React.CSSProperties = { width: "100%", maxWidth: 440, minHeight: 60, borderRadius: 16, border: "none", color: "#fff", fontWeight: 800, fontSize: 18, cursor: "pointer", padding: "12px 16px" };
const ghostBtn: React.CSSProperties = { marginTop: 16, background: "none", border: "1.5px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)", borderRadius: 14, minHeight: 48, padding: "0 22px", fontWeight: 700, fontSize: 15, cursor: "pointer" };
const ritmoBtn: React.CSSProperties = { minHeight: 72, borderRadius: 14, border: "none", color: "#fff", fontWeight: 800, fontSize: 17, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1.1 };
const blk: React.CSSProperties = { fontSize: 10.5, fontWeight: 600, opacity: 0.8, marginTop: 3 };
const barBtn: React.CSSProperties = { flex: 1, minHeight: 46, borderRadius: 12, border: "1px solid rgba(255,255,255,0.14)", background: "#141a26", color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: 13.5, cursor: "pointer" };
// 40×40: alvo de toque mínimo p/ uso com luva durante a massagem.
const miniBtn: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, border: "1px solid rgba(255,255,255,0.18)", background: "none", color: "#fff", fontSize: 19, cursor: "pointer", lineHeight: 1 };
const checkRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", padding: "12px 14px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.14)", background: "#171c27", color: "#e7ecf5", fontWeight: 600, fontSize: 14.5, cursor: "pointer" };
const checkBox: React.CSSProperties = { flex: "0 0 auto", width: 22, height: 22, borderRadius: 6, border: "2px solid", display: "grid", placeItems: "center", color: "#0a0e16", fontWeight: 900, fontSize: 13 };
