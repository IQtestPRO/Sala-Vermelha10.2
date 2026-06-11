"use client";

import { useRef } from "react";
import Link from "next/link";
import { PlusCircle, Zap, Wifi } from "lucide-react";
import { toast } from "sonner";
import TopBar, { LogoutButton } from "@/components/TopBar";
import { useMe } from "@/components/AppShell";
import { usePoll } from "@/lib/usePoll";
import CaseCard from "@/components/CaseCard";
import EmptyState from "@/components/EmptyState";
import PushSetup from "@/components/PushSetup";
import type { PublicCase } from "@/lib/cases";

type Mine = { cases: PublicCase[]; serverNow: number };
type Fila = { open: PublicCase[]; mine: PublicCase[]; serverNow: number };

export default function FeedPage() {
  const me = useMe();
  const isResponder = me.role === "responder";
  const seen = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  // Casos que EU criei (sempre).
  const minha = usePoll<Mine>("/api/cases/mine", 4000);

  // Fila de plantão (só para plantonistas) — casos a responder + em andamento comigo.
  const fila = usePoll<Fila>("/api/cases", 4000, {
    enabled: isResponder,
    onData: (d) => {
      if (firstLoad.current) {
        d.open.forEach((c) => seen.current.add(c.id));
        firstLoad.current = false;
        return;
      }
      for (const c of d.open) {
        if (!seen.current.has(c.id)) {
          seen.current.add(c.id);
          toast.warning("Novo caso na fila!");
          if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(200);
        }
      }
    },
  });

  const meusCasos = minha.data?.cases ?? [];
  const open = fila.data?.open ?? [];
  const emAndamento = fila.data?.mine ?? [];
  const serverNow = fila.data?.serverNow ?? minha.data?.serverNow ?? Date.now();

  return (
    <>
      <TopBar brand title="Casos" subtitle={`${me.name} • ${isResponder ? "plantonista" : me.crm || "acadêmico"}`} right={<LogoutButton />} />
      <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="welcome-banner navy-material">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={isResponder ? "/hero-fila.jpg" : "/stat-hero.jpg"} alt="" className="welcome-banner-bg" />
          <div className="welcome-banner-text">
            <div className="welcome-eyebrow">{isResponder ? "Plantão" : "Sala vermelha"}</div>
            <div className="welcome-title">Olá, {me.name}</div>
          </div>
        </div>

        {/* ===== Plantão: fila de casos a responder ===== */}
        {isResponder && (
          <>
            <PushSetup />
            {fila.isStale && (
              <div className="card-2" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--amber)", fontSize: 13 }}>
                <Wifi size={16} /> Reconectando…
              </div>
            )}

            {emAndamento.length > 0 && (
              <div>
                <div className="label">Em andamento com você</div>
                <div className="stagger-in" style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {emAndamento.map((c) => (
                    <CaseCard key={c.id} c={c} serverNow={serverNow} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="label">Aguardando resposta ({open.length})</div>
              {open.length === 0 ? (
                <EmptyState title="Sem casos na fila. Bom sinal." subtitle="Você será avisado assim que chegar um novo." />
              ) : (
                <div className="stagger-in" style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {open.map((c) => (
                    <CaseCard key={c.id} c={c} serverNow={serverNow} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== Criar caso — hierarquia real: UM sólido (urgência), secundário em outline ===== */}
        <Link
          href="/new-case?mode=urgencia"
          className="btn btn-emergency pulse"
          style={{ minHeight: 64, fontSize: 16.5, justifyContent: "flex-start", padding: "0 18px", gap: 14, borderRadius: "var(--r-lg)" }}
          onClick={() => { try { navigator.vibrate?.(50); } catch { /* noop */ } }}
        >
          <Zap size={24} style={{ flex: "0 0 auto" }} />
          <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.2 }}>
            <span style={{ fontWeight: 800 }}>Urgência</span>
            <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.85 }}>Foto do ECG → leitura imediata</span>
          </span>
        </Link>
        <Link
          href="/new-case"
          className="btn btn-ghost"
          style={{ minHeight: 50, fontSize: 15.5, border: "1.5px solid var(--border-strong)", borderRadius: "var(--r-md)" }}
        >
          <PlusCircle size={19} /> Novo caso
        </Link>

        {/* ===== Casos que eu criei ===== */}
        <div>
          <div className="label">Meus casos</div>
          {meusCasos.length === 0 ? (
            <EmptyState title="Nenhum caso aberto." subtitle="Toque em Novo caso para enviar um ECG ou uma dúvida de conduta." />
          ) : (
            <div className="stagger-in" style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {meusCasos.map((c) => (
                <CaseCard key={c.id} c={c} serverNow={serverNow} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
