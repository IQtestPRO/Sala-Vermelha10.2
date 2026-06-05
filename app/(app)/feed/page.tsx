"use client";

import Link from "next/link";
import { PlusCircle } from "lucide-react";
import TopBar, { LogoutButton } from "@/components/TopBar";
import { useMe } from "@/components/AppShell";
import { usePoll } from "@/lib/usePoll";
import CaseCard from "@/components/CaseCard";
import type { PublicCase } from "@/lib/cases";

type Resp = { cases: PublicCase[]; serverNow: number };

export default function FeedPage() {
  const me = useMe();
  const { data } = usePoll<Resp>("/api/cases/mine", 4000);
  const cases = data?.cases ?? [];
  const serverNow = data?.serverNow ?? Date.now();

  return (
    <>
      <TopBar title="Meus casos" subtitle={`${me.name} • ${me.crm}`} right={<LogoutButton />} />
      <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        <Link href="/new-case" className="btn btn-emergency" style={{ minHeight: 58, fontSize: 17 }}>
          <PlusCircle size={24} /> Novo caso de emergência
        </Link>

        {cases.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 28 }}>
            <div className="muted">Nenhum caso ainda.</div>
            <div className="faint" style={{ fontSize: 13, marginTop: 6 }}>
              Toque em “Novo caso” para enviar um ECG ou uma dúvida de conduta.
            </div>
          </div>
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
