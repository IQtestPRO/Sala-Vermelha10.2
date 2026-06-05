"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Check, X, Users, ClipboardList } from "lucide-react";
import SlaCountdown from "@/components/SlaCountdown";
import { statusLabel, statusBadgeClass } from "@/lib/labels";
import { questionMeta } from "@/lib/types/case";
import type { PublicCase } from "@/lib/cases";

const PW_KEY = "e10_admin_pw";

type AdminUser = {
  id: string;
  name: string;
  crm: string;
  specialty: string;
  role: string;
  status: string;
  created_at: number;
};

export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"users" | "cases">("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [cases, setCases] = useState<PublicCase[]>([]);
  const [serverNow, setServerNow] = useState(Date.now());
  const [checking, setChecking] = useState(false);

  const headers = useCallback((p?: string) => ({ "x-admin-password": p ?? pw }), [pw]);

  const loadUsers = useCallback(
    async (p?: string) => {
      const res = await fetch("/api/admin/users?status=pending", { headers: headers(p), cache: "no-store" });
      if (res.status === 401) throw new Error("unauthorized");
      const data = await res.json();
      setUsers(data.users || []);
    },
    [headers]
  );

  const loadCases = useCallback(async () => {
    const res = await fetch("/api/admin/cases", { headers: headers(), cache: "no-store" });
    const data = await res.json();
    setCases(data.cases || []);
    setServerNow(data.serverNow || Date.now());
  }, [headers]);

  async function tryLogin(p: string, silent = false) {
    setChecking(true);
    try {
      await loadUsers(p);
      localStorage.setItem(PW_KEY, p);
      setPw(p);
      setAuthed(true);
    } catch {
      localStorage.removeItem(PW_KEY);
      if (!silent) toast.error("Senha de admin incorreta.");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem(PW_KEY);
    if (saved) tryLogin(saved, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authed) return;
    if (tab === "users") loadUsers();
    else loadCases();
    const t = setInterval(() => {
      if (tab === "users") loadUsers().catch(() => {});
      else loadCases().catch(() => {});
    }, 6000);
    return () => clearInterval(t);
  }, [authed, tab, loadUsers, loadCases]);

  async function act(id: string, action: "approve" | "reject") {
    try {
      await fetch(`/api/admin/users/${id}/${action}`, { method: "POST", headers: headers() });
      toast.success(action === "approve" ? "Plantonista aprovado." : "Cadastro rejeitado.");
      loadUsers();
    } catch {
      toast.error("Falha na ação.");
    }
  }

  if (!authed) {
    return (
      <div className="app-main" style={{ padding: "0 20px", justifyContent: "center" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <ShieldCheck size={28} color="var(--red)" />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Admin</h1>
          </div>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              className="field"
              type="password"
              placeholder="Senha de administrador"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && tryLogin(pw)}
            />
            <button className="btn btn-primary" disabled={checking} onClick={() => tryLogin(pw)}>
              {checking ? "Verificando…" : "Entrar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pendentes = users.filter((u) => u.status === "pending");

  return (
    <div className="app-main">
      <header className="topbar">
        <div className="topbar-inner">
          <ShieldCheck size={20} color="var(--red)" />
          <div style={{ flex: 1, fontWeight: 900 }}>Admin — Emergência em 10</div>
          <button
            className="chip"
            style={{ minHeight: 36 }}
            onClick={() => {
              localStorage.removeItem(PW_KEY);
              setAuthed(false);
              setPw("");
            }}
          >
            Sair
          </button>
        </div>
      </header>

      <div style={{ display: "flex", gap: 8, padding: "12px 16px 0" }}>
        <button className={`chip ${tab === "users" ? "chip-on" : ""}`} onClick={() => setTab("users")}>
          <Users size={15} /> Aprovações ({pendentes.length})
        </button>
        <button className={`chip ${tab === "cases" ? "chip-on" : ""}`} onClick={() => setTab("cases")}>
          <ClipboardList size={15} /> Casos
        </button>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {tab === "users" &&
          (pendentes.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 28 }}>
              <div className="muted">Nenhum plantonista aguardando aprovação.</div>
            </div>
          ) : (
            pendentes.map((u) => (
              <div key={u.id} className="card-2">
                <div style={{ fontWeight: 800 }}>{u.name}</div>
                <div className="faint" style={{ fontSize: 13, marginTop: 2 }}>
                  {u.crm} • {u.specialty}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => act(u.id, "approve")}>
                    <Check size={16} /> Aprovar
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => act(u.id, "reject")}>
                    <X size={16} /> Rejeitar
                  </button>
                </div>
              </div>
            ))
          ))}

        {tab === "cases" &&
          (cases.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 28 }}>
              <div className="muted">Nenhum caso registrado.</div>
            </div>
          ) : (
            cases.map((c) => (
              <div key={c.id} className="card-2">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: "var(--red)" }}>
                    {questionMeta(c.question_type).short.toUpperCase()}
                  </span>
                  {c.status === "open" ? (
                    <SlaCountdown expiresAt={c.sla_expires_at} serverNow={serverNow} size={13} />
                  ) : (
                    <span className={statusBadgeClass(c.status)}>{statusLabel(c.status)}</span>
                  )}
                </div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{c.clinical_summary || c.question_text}</div>
              </div>
            ))
          ))}
      </div>
    </div>
  );
}
