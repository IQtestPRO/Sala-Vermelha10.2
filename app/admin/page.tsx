"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Check, X, Users, ClipboardList, Lightbulb } from "lucide-react";
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
type FB = { id: string; user_name: string | null; tipo: string; texto: string; app_ref: string | null; status: string; created_at: number };
const fbTipoLabel = (t: string) => (t === "problema" ? "Problema" : t === "melhoria" ? "Melhoria" : "Ideia");
const fbWhen = (ts: number) => new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });

export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"users" | "cases" | "feedback">("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [cases, setCases] = useState<PublicCase[]>([]);
  const [feedback, setFeedback] = useState<FB[]>([]);
  const [fbTipo, setFbTipo] = useState("");
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

  const loadFeedback = useCallback(async () => {
    const res = await fetch("/api/admin/feedback" + (fbTipo ? `?tipo=${fbTipo}` : ""), { headers: headers(), cache: "no-store" });
    const data = await res.json();
    setFeedback(data.feedback || []);
  }, [headers, fbTipo]);

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
    const run = () => (tab === "users" ? loadUsers() : tab === "cases" ? loadCases() : loadFeedback());
    run().catch(() => {});
    const t = setInterval(() => run().catch(() => {}), 6000);
    return () => clearInterval(t);
  }, [authed, tab, loadUsers, loadCases, loadFeedback]);

  async function act(id: string, action: "approve" | "reject") {
    try {
      await fetch(`/api/admin/users/${id}/${action}`, { method: "POST", headers: headers() });
      toast.success(action === "approve" ? "Plantonista aprovado." : "Cadastro rejeitado.");
      loadUsers();
    } catch {
      toast.error("Falha na ação.");
    }
  }
  async function setFbStatus(id: string, status: string) {
    setFeedback((arr) => arr.map((x) => (x.id === id ? { ...x, status } : x)));
    await fetch("/api/admin/feedback", { method: "PATCH", headers: { ...headers(), "content-type": "application/json" }, body: JSON.stringify({ id, status }) }).catch(() => {});
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
          <div style={{ flex: 1, fontWeight: 900 }}>Admin — STAT</div>
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

      <div className="scroll-x" style={{ gap: 8, padding: "12px 16px 0" }}>
        <button className={`chip ${tab === "users" ? "chip-on" : ""}`} onClick={() => setTab("users")} style={{ flex: "0 0 auto" }}>
          <Users size={15} /> Aprovações ({pendentes.length})
        </button>
        <button className={`chip ${tab === "cases" ? "chip-on" : ""}`} onClick={() => setTab("cases")} style={{ flex: "0 0 auto" }}>
          <ClipboardList size={15} /> Casos
        </button>
        <button className={`chip ${tab === "feedback" ? "chip-on" : ""}`} onClick={() => setTab("feedback")} style={{ flex: "0 0 auto" }}>
          <Lightbulb size={15} /> Ideias ({feedback.filter((f) => f.status === "novo").length})
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

        {tab === "feedback" && (
          <>
            <div className="scroll-x" style={{ gap: 6, marginBottom: 2 }}>
              {([["", "Todos"], ["ideia", "Ideias"], ["problema", "Problemas"], ["melhoria", "Melhorias"]] as const).map(([k, lbl]) => (
                <button key={k} className={`chip ${fbTipo === k ? "chip-on" : ""}`} onClick={() => setFbTipo(k)} style={{ flex: "0 0 auto" }}>{lbl}</button>
              ))}
            </div>
            {feedback.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: 28 }}><div className="muted">Nenhuma mensagem ainda.</div></div>
            ) : (
              feedback.map((m) => (
                <div key={m.id} className="card-2" style={{ opacity: m.status === "feito" ? 0.6 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <span style={{ fontWeight: 800, fontSize: 12.5, color: m.tipo === "problema" ? "var(--red)" : "var(--primary)" }}>{fbTipoLabel(m.tipo)}</span>
                    <span className="faint" style={{ fontSize: 11 }}>{m.user_name || "—"} · {fbWhen(m.created_at)}</span>
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.45, marginTop: 5, whiteSpace: "pre-wrap" }}>{m.texto}</div>
                  {m.app_ref && <div className="faint" style={{ fontSize: 12, marginTop: 4 }}>Ref.: {m.app_ref}</div>}
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    {(["novo", "visto", "feito"] as const).map((s) => (
                      <button key={s} className={`chip ${m.status === s ? "chip-on" : ""}`} onClick={() => setFbStatus(m.id, s)} style={{ flex: 1, minHeight: 34, fontSize: 12 }}>
                        {s === "novo" ? "Novo" : s === "visto" ? "Em análise" : "Feito"}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
