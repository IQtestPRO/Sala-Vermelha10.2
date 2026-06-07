"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/* ============================================================================
   MODO PCR (ACLS) — esqueleto: timers por TIMESTAMP ABSOLUTO (zero drift) +
   persistência em localStorage (retomar após recarregar) + Wake Lock.
   Tela cheia, fundo escuro, vermelho liberado (é O caso de urgência).
   ========================================================================== */

const LS_KEY = "stat_pcr_ativa";
const CICLO_SEG = 120; // 2:00 de massagem entre checagens de ritmo

type PcrState = {
  startedAt: number;
  cicloStart: number;
  adrenalinaStart: number | null;
  adrenalinaIntervalSec: number; // 180–300 (default 240)
  ciclos: number;
  finalizado: boolean;
};

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
function save(s: PcrState | null) {
  try {
    if (s) localStorage.setItem(LS_KEY, JSON.stringify(s));
    else localStorage.removeItem(LS_KEY);
  } catch {
    /* noop */
  }
}

const mmss = (totalSeg: number) => {
  const s = Math.max(0, Math.round(totalSeg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// Mostrador circular (anel SVG + dígitos enormes no centro).
function Dial({ label, restante, total, cor, alerta }: { label: string; restante: number; total: number; cor: string; alerta: boolean }) {
  const R = 78, C = 2 * Math.PI * R;
  const frac = total > 0 ? Math.max(0, Math.min(1, restante / total)) : 0;
  return (
    <div style={{ position: "relative", width: 176, height: 176, display: "grid", placeItems: "center" }}>
      <svg width="176" height="176" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="88" cy="88" r={R} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="11" />
        <circle cx="88" cy="88" r={R} fill="none" stroke={alerta ? "#ff2d3f" : cor} strokeWidth="11" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} style={{ transition: "stroke-dashoffset .25s linear" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: alerta ? "#ff6b76" : "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>{label}</div>
        <div className="data" style={{ fontSize: 44, fontWeight: 800, color: alerta ? "#ff2d3f" : "#fff", lineHeight: 1 }}>{mmss(restante)}</div>
      </div>
    </div>
  );
}

export default function PcrPage() {
  const router = useRouter();
  const [pcr, setPcr] = useState<PcrState | null>(null);
  const [retomavel, setRetomavel] = useState<PcrState | null>(null);
  const [, tick] = useReducer((x) => x + 1, 0);
  const wakeRef = useRef<WakeLockSentinel | null>(null);

  // Re-render 4x/s (o TEMPO vem sempre dos timestamps, nunca acumulado → zero drift).
  useEffect(() => {
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, []);

  // Ao montar: oferecer retomar PCR em andamento.
  useEffect(() => {
    const s = load();
    if (s) setRetomavel(s);
  }, []);

  // Wake Lock — tela nunca apaga durante a PCR; re-request ao voltar visibilidade.
  const pedirWakeLock = useCallback(async () => {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLockSentinel> } };
      if (nav.wakeLock) wakeRef.current = await nav.wakeLock.request("screen");
    } catch {
      /* sem suporte — segue */
    }
  }, []);
  useEffect(() => {
    if (!pcr || pcr.finalizado) return;
    pedirWakeLock();
    const onVis = () => {
      if (document.visibilityState === "visible") pedirWakeLock();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      wakeRef.current?.release().catch(() => {});
      wakeRef.current = null;
    };
  }, [pcr, pedirWakeLock]);

  function update(patch: Partial<PcrState>) {
    setPcr((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }

  function iniciar() {
    const now = Date.now();
    const s: PcrState = { startedAt: now, cicloStart: now, adrenalinaStart: null, adrenalinaIntervalSec: 240, ciclos: 1, finalizado: false };
    setPcr(s);
    save(s);
    setRetomavel(null);
  }
  function retomar() {
    if (retomavel) {
      setPcr(retomavel);
      setRetomavel(null);
    }
  }
  function checouRitmo() {
    // (Esqueleto) zera o ciclo e começa nova massagem de 2:00.
    update({ cicloStart: Date.now(), ciclos: (pcr?.ciclos ?? 1) + 1 });
  }
  function adrenalina() {
    update({ adrenalinaStart: Date.now() });
    toast.success("Adrenalina registrada.");
  }
  function finalizar() {
    if (!confirm("Finalizar a PCR?")) return;
    save(null);
    setPcr(null);
    router.push("/condutas");
  }

  // ----- Telas -----
  if (!pcr) {
    return (
      <div style={shell}>
        {retomavel && (
          <button onClick={retomar} style={{ ...bigBtn, background: "#b8860b", marginBottom: 18 }}>
            ▶ Retomar PCR em andamento
            <span style={{ display: "block", fontSize: 13, fontWeight: 600, opacity: 0.85, marginTop: 4 }}>
              {mmss((Date.now() - retomavel.startedAt) / 1000)} decorridos
            </span>
          </button>
        )}
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 26, marginBottom: 6 }}>Modo PCR · ACLS</div>
        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, textAlign: "center", maxWidth: 320, marginBottom: 30, lineHeight: 1.5 }}>
          Cronômetro de ciclo, adrenalina e metrônomo para conduzir a parada. Mantenha o aparelho com você.
        </div>
        <button onClick={iniciar} style={{ ...bigBtn, background: "#E11D2A", fontSize: 26 }}>INICIAR PCR</button>
        <button onClick={() => router.push("/condutas")} style={ghostBtn}>Voltar</button>
      </div>
    );
  }

  const now = Date.now();
  const total = (now - pcr.startedAt) / 1000;
  const cicloRest = CICLO_SEG - (now - pcr.cicloStart) / 1000;
  const cicloAlerta = cicloRest <= 0;
  const adrRest = pcr.adrenalinaStart != null ? pcr.adrenalinaIntervalSec - (now - pcr.adrenalinaStart) / 1000 : null;
  const adrAlerta = adrRest != null && adrRest <= 0;

  return (
    <div style={{ ...shell, justifyContent: "flex-start", paddingTop: "calc(env(safe-area-inset-top) + 14px)", animation: cicloAlerta ? "pcrflash 0.8s steps(1) infinite" : undefined }}>
      {/* Tempo total sempre visível */}
      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em" }}>TEMPO TOTAL</div>
      <div className="data" style={{ color: "#fff", fontSize: 30, fontWeight: 800, marginBottom: 12 }}>{mmss(total)}</div>

      {/* Dois mostradores: Ciclo | Adrenalina */}
      <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
        <Dial label="Ciclo" restante={Math.max(0, cicloRest)} total={CICLO_SEG} cor="#3b82f6" alerta={cicloAlerta} />
        <Dial label="Adrenalina" restante={Math.max(0, adrRest ?? 0)} total={pcr.adrenalinaIntervalSec} cor="#f59e0b" alerta={adrAlerta} />
      </div>

      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Diagnóstico: {pcr.ciclos}º ciclo</div>

      {cicloAlerta && (
        <button onClick={checouRitmo} style={{ ...bigBtn, background: "#E11D2A", fontSize: 22, marginBottom: 10 }}>
          ⚠ CHEQUE O RITMO
          <span style={{ display: "block", fontSize: 13, fontWeight: 600, opacity: 0.9, marginTop: 3 }}>toque ao reavaliar e reiniciar a massagem</span>
        </button>
      )}

      <button onClick={adrenalina} style={{ ...bigBtn, background: adrAlerta ? "#E11D2A" : "#1f2a3d", fontSize: 20, marginBottom: 10 }}>
        {adrAlerta ? "💉 ADRENALINA AGORA?" : "Adrenalina 1 mg"}
      </button>

      <div style={{ flex: 1 }} />
      <button onClick={finalizar} style={{ ...ghostBtn, borderColor: "rgba(255,255,255,0.25)", color: "#fff", minHeight: 52, width: "100%", maxWidth: 380 }}>Finalizar</button>

      <style>{`@keyframes pcrflash { 0% { background:#10131b } 50% { background:#3a0c10 } }`}</style>
    </div>
  );
}

const shell: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 200,
  background: "#0a0e16",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 18,
  paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)",
  overflowY: "auto",
};
const bigBtn: React.CSSProperties = {
  width: "100%",
  maxWidth: 380,
  minHeight: 64,
  borderRadius: 16,
  border: "none",
  color: "#fff",
  fontWeight: 800,
  fontSize: 18,
  cursor: "pointer",
  padding: "12px 16px",
};
const ghostBtn: React.CSSProperties = {
  marginTop: 16,
  background: "none",
  border: "1.5px solid rgba(255,255,255,0.2)",
  color: "rgba(255,255,255,0.7)",
  borderRadius: 14,
  minHeight: 48,
  padding: "0 22px",
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
};
