"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Stethoscope, Lock, Eye, EyeOff } from "lucide-react";
import { apiPost, friendlyError, ApiError, Me } from "@/lib/client";
import AuthIllustration from "@/components/AuthIllustration";
import StatLogo from "@/components/StatLogo";
import StatPreview from "@/components/StatPreview";

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
      const next = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("next") : null;
      const destino = next && next.startsWith("/") ? next : "/condutas";
      if (user.role === "responder" && user.status !== "approved") {
        router.replace("/pending");
      } else {
        router.replace(destino);
      }
    } catch (err) {
      toast.error(friendlyError(err instanceof ApiError ? err.code : "internal_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page" style={{ display: "block" }}>
      <div className="auth-wrap" style={{ minHeight: "100dvh", display: "flex", alignItems: "center" }}>
        <div className="auth-grid">
          {/* Coluna do formulário */}
          <div>
            <StatLogo size={40} tone="onLight" animated={false} />
            <h1 className="auth-h1">O copiloto clínico do seu plantão.</h1>
            <p className="auth-sub">
              Protocolos de emergência, calculadoras validadas, IA para discutir casos e gestão de plantões — em um só
              lugar.
            </p>

            <form onSubmit={submit} style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 18, maxWidth: 440 }}>
              <div>
                <label className="auth-label" htmlFor="login-doc">CRM ou CPF</label>
                <div style={{ position: "relative", marginTop: 8 }}>
                  <Stethoscope size={18} className="auth-ic" />
                  <input
                    id="login-doc"
                    className="auth-field"
                    placeholder="CRM/UF 123456 ou CPF"
                    value={crm}
                    onChange={(e) => setCrm(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <label className="auth-label" htmlFor="login-pw">Senha</label>
                  <Link href="/esqueci" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-faint)" }}>
                    Esqueci minha senha
                  </Link>
                </div>
                <div style={{ position: "relative", marginTop: 8 }}>
                  <Lock size={18} className="auth-ic" />
                  <input
                    id="login-pw"
                    className="auth-field"
                    type={showPw ? "text" : "password"}
                    style={{ paddingRight: 46 }}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" className="auth-eye" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}>
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button className="auth-btn" disabled={loading} type="submit" style={{ marginTop: 6 }}>
                {loading ? "Entrando…" : "Entrar"}
              </button>
            </form>

            <p style={{ marginTop: 22, fontSize: 14.5, color: "var(--text-dim)" }}>
              Não tem conta?{" "}
              <Link href="/register" className="auth-link">
                Cadastre-se
              </Link>
            </p>

            <p className="auth-foot" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span>Para médicos e estudantes de medicina.</span>
              <a href="#conteudo" style={{ color: "var(--text-faint)", fontWeight: 700, textDecoration: "none" }}>
                O que tem dentro ↓
              </a>
            </p>
          </div>

          {/* Coluna ilustrativa */}
          <AuthIllustration />
        </div>
      </div>
      <StatPreview />
    </div>
  );
}
