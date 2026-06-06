"use client";

import Link from "next/link";
import { PlusCircle, Zap } from "lucide-react";
import TopBar, { LogoutButton } from "@/components/TopBar";
import { useMe } from "@/components/AppShell";
import { usePoll } from "@/lib/usePoll";
import CaseCard from "@/components/CaseCard";
import EmptyState from "@/components/EmptyState";
import type { PublicCase } from "@/lib/cases";

type Resp = { cases: PublicCase[]; serverNow: number };

export default function FeedPage() {
  const me = useMe();
  const { data } = usePoll<Resp>("/api/cases/mine", 4000);
  const cases = data?.cases ?? [];
  const serverNow = data?.serverNow ?? Date.now();

  return (
    <>
      <TopBar brand title="Meus casos" subtitle={`${me.name} • ${me.crm}`} right={<LogoutButton />} />
      <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="welcome-banner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/stat-hero.jpg" alt="" className="welcome-banner-bg" />
          <div className="welcome-banner-text">
            <div className="welcome-eyebrow">Sala vermelha</div>
            <div className="welcome-title">Olá, {me.name}</div>
          </div>
        </div>

        <Link href="/new-case?mode=urgencia" className="btn btn-emergency pulse" style={{ minHeight: 60, fontSize: 17 }}>
          <Zap size={24} /> Urgência — leitura imediata
        </Link>
        <Link href="/new-case" className="btn btn-primary" style={{ minHeight: 54, fontSize: 16 }}>
          <PlusCircle size={22} /> Novo caso
        </Link>

        {cases.length === 0 ? (
          <EmptyState title="Nenhum caso ainda" subtitle="Toque em Novo caso para enviar um ECG ou uma dúvida de conduta." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cases.map((c) => (
              <CaseCard key={c.id} c={c} serverNow={serverNow} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
