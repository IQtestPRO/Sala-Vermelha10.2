"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Stethoscope, Lock, Eye, EyeOff } from "lucide-react";
import { apiPost, friendlyError, ApiError, Me } from "@/lib/client";
import StatLogo from "@/components/StatLogo";
import EcgLine from "@/components/EcgLine";
import StatPreview from "@/components/StatPreview";

const PILARES = [
  { k: "Modo PCR", v: "Ciclos, adrenalina e metrônomo conduzindo a parada." },
  { k: "Calculadoras", v: "Escores, gasometria e as diluições do seu serviço." },
  { k: "STAT IA", v: "Lê o ECG, discute o caso e redige com você." },
  { k: "Plantão", v: "Agenda com financeiro e passagem pelo WhatsApp." },
];

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
      <div className="auth-wrap" style={{ paddingTop: "clamp(34px, 7vh, 72px)" }}>
        {/* ===== Hero editorial: logo · headline Code Pro Light · linha vital · autoridade ===== */}
        <StatLogo size={32} tone="onLight" animated={false} />
        <h1 className="auth-h1" style={{ maxWidth: 820 }}>
          O copiloto clínico
          <br />
          do seu plantão.
        </h1>
        {/* a linha vital atravessa a composição (sangra além do container) */}
        <div style={{ margin: "20px -22px 0" }}>
          <EcgLine variant="run" height={36} stroke={2} opacity={0.9} glow />
        </div>
        <div className="microlabel" style={{ marginTop: 14, display: "flex", flexWrap: "wrap", columnGap: 14, rowGap: 4 }}>
          <span style={{ color: "var(--text-dim)" }}>Apoio à decisão clínica</span>
          <span>AHA</span>
          <span>ESC</span>
          <span>SBC</span>
          <span>ACLS</span>
          <span>Surviving Sepsis</span>
        </div>

        {/* ===== Assimétrico: pilares à esquerda, formulário à direita (form primeiro no mobile) ===== */}
        <div className="login-grid">
          <div className="login-form card" style={{ borderRadius: "var(--r-xl)", padding: "22px 20px", boxShadow: "var(--shadow-md)" }}>
            <div className="label" style={{ marginBottom: 14 }}>Acesso</div>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label className="auth-label" htmlFor="login-doc">CRM ou CPF</label>
                <div style={{ position: "relative", marginTop: 7 }}>
                  <Stethoscope size={18} className="auth-ic" />
                  <input
                    id="login-doc"
                    className="auth-field data"
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
                  <Link href="/esqueci" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-faint)" }}>
                    Esqueci minha senha
                  </Link>
                </div>
                <div style={{ position: "relative", marginTop: 7 }}>
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

              <button className="auth-btn" disabled={loading} type="submit" style={{ marginTop: 4 }}>
                {loading ? "Entrando…" : "Entrar"}
              </button>
            </form>
            <p style={{ margin: "16px 0 0", fontSize: 14, color: "var(--text-dim)" }}>
              Não tem conta?{" "}
              <Link href="/register" className="auth-link">Cadastre-se</Link>
            </p>
          </div>

          <div>
            {PILARES.map((p) => (
              <div key={p.k} className="login-pilar">
                <span className="microlabel">{p.k}</span>
                <span style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--text-dim)" }}>{p.v}</span>
              </div>
            ))}
            <p className="auth-foot" style={{ marginTop: 18 }}>
              Para médicos e estudantes de medicina.{" "}
              <a href="#conteudo" style={{ color: "var(--text-faint)", fontWeight: 700, textDecoration: "none" }}>O que tem dentro ↓</a>
            </p>
          </div>
        </div>
      </div>
      <StatPreview />
    </div>
  );
}
