"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Phone, Stethoscope, Lock, Eye, EyeOff } from "lucide-react";
import { apiPost, friendlyError, ApiError } from "@/lib/client";
import AuthIllustration from "@/components/AuthIllustration";

const SPECIALTIES = [
  "Emergencista",
  "Clínica médica",
  "Cardiologia",
  "Intensivista",
  "Anestesiologia",
  "Cirurgia",
  "Neurologia",
  "Outra",
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [crm, setCrm] = useState("");
  const [specialty, setSpecialty] = useState("Emergencista");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiPost("/api/auth/register", { name, phone, crm, specialty, password });
      toast.success("Conta criada!");
      router.replace("/rapido");
    } catch (err) {
      toast.error(friendlyError(err instanceof ApiError ? err.code : "internal_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <div className="auth-grid">
          {/* Formulário */}
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/stat-logo.png" alt="STAT" style={{ height: 46, width: "auto", display: "block" }} />
            <h1 className="auth-h1" style={{ fontSize: "clamp(28px, 5vw, 40px)" }}>Criar conta</h1>
            <p className="auth-sub">Para médicos. Um único cadastro para acessar a plataforma.</p>

            <form onSubmit={submit} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
              <div>
                <label className="auth-label">Nome completo</label>
                <div style={{ position: "relative", marginTop: 8 }}>
                  <User size={18} className="auth-ic" />
                  <input className="auth-field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
                </div>
              </div>

              <div>
                <label className="auth-label">CRM</label>
                <div style={{ position: "relative", marginTop: 8 }}>
                  <Stethoscope size={18} className="auth-ic" />
                  <input className="auth-field" placeholder="CRM/UF 123456" value={crm} onChange={(e) => setCrm(e.target.value)} autoCapitalize="characters" required />
                </div>
              </div>

              <div>
                <label className="auth-label">Telefone (WhatsApp)</label>
                <div style={{ position: "relative", marginTop: 8 }}>
                  <Phone size={18} className="auth-ic" />
                  <input className="auth-field" type="tel" inputMode="tel" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" required />
                </div>
              </div>

              <div>
                <label className="auth-label">Especialidade / atuação</label>
                <div style={{ marginTop: 8 }}>
                  <select className="auth-field" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="auth-label">Senha (mín. 6)</label>
                <div style={{ position: "relative", marginTop: 8 }}>
                  <Lock size={18} className="auth-ic" />
                  <input
                    className="auth-field"
                    type={showPw ? "text" : "password"}
                    style={{ paddingRight: 46 }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    autoComplete="new-password"
                    required
                  />
                  <button type="button" className="auth-eye" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}>
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button className="auth-btn" disabled={loading} type="submit" style={{ marginTop: 6 }}>
                {loading ? "Enviando…" : "Criar conta"}
              </button>
            </form>

            <p style={{ marginTop: 20, fontSize: 14, color: "#9bacc6" }}>
              Já tem conta?{" "}
              <Link href="/login" className="auth-link">
                Entrar
              </Link>
            </p>
          </div>

          {/* Ilustração */}
          <AuthIllustration />
        </div>
      </div>
    </div>
  );
}
