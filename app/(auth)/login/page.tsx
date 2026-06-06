"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Stethoscope, Lock, Eye, EyeOff } from "lucide-react";
import { apiPost, friendlyError, ApiError, Me } from "@/lib/client";

export default function LoginPage() {
  const router = useRouter();
  const [crm, setCrm] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await apiPost<{ user: Me }>("/api/auth/login", { crm, password });
      toast.success(`Bem-vindo, ${user.name.split(" ")[0]}`);
      if (user.role === "responder") {
        router.replace(user.status === "approved" ? "/queue" : "/pending");
      } else {
        router.replace("/feed");
      }
    } catch (err) {
      toast.error(friendlyError(err instanceof ApiError ? err.code : "internal_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 18, padding: "26px 0 40px" }}>
      {/* Hero da marca: gradiente navy + logo exata */}
      <div className="login-hero" style={{ padding: "32px 22px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/stat-logo.png" alt="STAT" style={{ width: "82%", maxWidth: 360, display: "block", margin: "0 auto" }} />
      </div>

      {/* Acesso */}
      <form onSubmit={submit} className="card" style={{ display: "flex", flexDirection: "column", gap: 16, padding: 22 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: "-0.01em" }}>Bem-vindo de volta</h1>
          <p className="faint" style={{ margin: "5px 0 0", fontSize: 13, lineHeight: 1.45 }}>
            Sala vermelha: análise de ECG por IA e resposta de plantonistas em até 10 minutos.
          </p>
        </div>

        <div>
          <label className="label">CRM</label>
          <div style={{ position: "relative" }}>
            <Stethoscope size={18} className="faint" style={{ position: "absolute", left: 14, top: 17, pointerEvents: "none" }} />
            <input
              className="field"
              style={{ paddingLeft: 42 }}
              placeholder="CRM/UF 123456"
              value={crm}
              onChange={(e) => setCrm(e.target.value)}
              autoCapitalize="characters"
              autoComplete="username"
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Senha</label>
          <div style={{ position: "relative" }}>
            <Lock size={18} className="faint" style={{ position: "absolute", left: 14, top: 17, pointerEvents: "none" }} />
            <input
              className="field"
              type={showPw ? "text" : "password"}
              style={{ paddingLeft: 42, paddingRight: 46 }}
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
              style={{ position: "absolute", right: 6, top: 6, width: 40, height: 40, border: "none", background: "none", color: "var(--text-dim)", display: "grid", placeItems: "center", cursor: "pointer" }}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button className="btn btn-primary" disabled={loading} type="submit" style={{ marginTop: 4 }}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="muted" style={{ textAlign: "center", fontSize: 14 }}>
        Não tem conta?{" "}
        <Link href="/register" style={{ color: "var(--primary)", fontWeight: 700 }}>
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
