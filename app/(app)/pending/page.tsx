"use client";

import Link from "next/link";
import { Clock3, BookOpenText } from "lucide-react";
import TopBar, { LogoutButton } from "@/components/TopBar";
import { useMe } from "@/components/AppShell";

export default function PendingPage() {
  const me = useMe();

  return (
    <>
      <TopBar title="Cadastro em análise" right={<LogoutButton />} />
      <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="card" style={{ textAlign: "center", padding: 28 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "color-mix(in srgb, var(--amber) 18%, var(--surface-2))", display: "grid", placeItems: "center", margin: "0 auto 14px" }}>
            <Clock3 size={32} color="var(--amber)" />
          </div>
          <h2 style={{ margin: "0 0 8px", fontSize: 19, fontWeight: 900 }}>Aguardando aprovação</h2>
          <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
            Olá, {me.name.split(" ")[0]}. Seu cadastro como plantonista ({me.specialty}, {me.crm}) foi recebido.
            Um administrador vai liberar seu acesso para responder casos. Você será avisado.
          </p>
        </div>

        <Link href="/condutas" className="btn">
          <BookOpenText size={20} /> Ver condutas enquanto isso
        </Link>
      </div>
    </>
  );
}
