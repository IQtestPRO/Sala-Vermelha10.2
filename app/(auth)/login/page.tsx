"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Stethoscope, Lock, Eye, EyeOff } from "lucide-react";
import { apiPost, friendlyError, ApiError, Me } from "@/lib/client";
import AuthIllustration from "@/components/AuthIllustration";
import { LayoutTextFlip } from "@/components/ui/layout-text-flip";
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
    <div className="auth-page" style={{ display: "block" }}>
      <div className="auth-wrap" style={{ minHeight: "100dvh", display: "flex", alignItems: "center" }}>
        <div className="auth-grid">
          {/* Coluna do formulário */}
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/stat-logo.svg" alt="STAT" style={{ height: 58, width: "auto", display: "block", marginBottom: 14 }} />
            <div className="login-flip">
              <LayoutTextFlip
                text=""
                words={["Leitura de ECG por IA", "Resultado em menos de 2 min", "Conduta com evidência", "Apoio na sala vermelha"]}
                duration={2600}
              />
            </div>
            <p className="login-sub">Bem-vindo de volta · análise de ECG por IA em menos de 2 minutos</p>

            <form onSubmit={submit} style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 18, maxWidth: 460 }}>
              <div>
                <label className="auth-label">CRM</label>
                <div style={{ position: "relative", marginTop: 8 }}>
                  <Stethoscope size={18} className="auth-ic" />
                  <input
                    className="auth-field"
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
                <label className="auth-label">Senha</label>
                <div style={{ position: "relative", marginTop: 8 }}>
                  <Lock size={18} className="auth-ic" />
                  <input
                    className="auth-field"
                    type={showPw ? "text" : "password"}
                    style={{ paddingRight: 46 }}
                    placeholder="••••••"
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

            <p style={{ marginTop: 22, fontSize: 14, color: "#9bacc6" }}>
              Não tem conta?{" "}
              <Link href="/register" className="auth-link">
                Cadastre-se
              </Link>
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
