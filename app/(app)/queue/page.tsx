"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { Wifi } from "lucide-react";
import TopBar, { LogoutButton } from "@/components/TopBar";
import EmptyState from "@/components/EmptyState";
import { useMe } from "@/components/AppShell";
import { usePoll } from "@/lib/usePoll";
import CaseCard from "@/components/CaseCard";
import PushSetup from "@/components/PushSetup";
import type { PublicCase } from "@/lib/cases";
import { ApiError } from "@/lib/client";

type Resp = { open: PublicCase[]; mine: PublicCase[]; serverNow: number };

export default function QueuePage() {
  const me = useMe();
  const seen = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  const { data, error, isStale } = usePoll<Resp>("/api/cases", 4000, {
    onData: (d) => {
      // Alerta in-app quando chega caso novo (fallback do push com app aberto).
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

  const notApproved = error instanceof Error && (error as unknown as ApiError)?.message === "HTTP 403";

  const open = data?.open ?? [];
  const mine = data?.mine ?? [];
  const serverNow = data?.serverNow ?? Date.now();

  return (
    <>
      <TopBar
        brand
        title="Fila de casos"
        subtitle={`${me.name} • plantonista`}
        right={<LogoutButton />}
      />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        <PushSetup />
        {isStale && (
          <div className="card-2" style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--amber)", fontSize: 13 }}>
            <Wifi size={16} /> Reconectando…
          </div>
        )}

        {mine.length > 0 && (
          <div>
            <div className="label">Em andamento com você</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {mine.map((c) => (
                <CaseCard key={c.id} c={c} serverNow={serverNow} />
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="label">Aguardando resposta ({open.length})</div>
          {open.length === 0 ? (
            <EmptyState title="Nenhum caso na fila agora" subtitle="Você será avisado quando chegar um novo." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {open.map((c) => (
                <CaseCard key={c.id} c={c} serverNow={serverNow} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
