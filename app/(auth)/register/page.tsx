"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Phone, Stethoscope, Lock, Eye, EyeOff, Mail, IdCard, GraduationCap } from "lucide-react";
import { apiPost, friendlyError, ApiError } from "@/lib/client";
import { ESPECIALIDADES } from "@/lib/especialidades";
import { formatCpf, validateCpf } from "@/lib/cpf";
import StatLogo from "@/components/StatLogo";

type Tipo = "medico" | "estudante";

export default function RegisterPage() {
  const router = useRouter();
  const [tipo, setTipo] = useState<Tipo>("medico");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [crm, setCrm] = useState("");
  const [specialty, setSpecialty] = useState("Medicina de Emergência");
  const [cpf, setCpf] = useState("");
  const [faculdade, setFaculdade] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const cpfOk = validateCpf(cpf);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (tipo === "estudante" && !cpfOk) {
      toast.error("CPF inválido. Confira os números.");
      return;
    }
    setLoading(true);
    try {
      const body =
        tipo === "medico"
          ? { docType: "crm", name, phone, email, crm, specialty, password }
          : { docType: "cpf", name, phone, email, cpf, faculdade, password };
      await apiPost("/api/auth/register", body);
      toast.success("Conta criada!");
      router.replace("/condutas");
    } catch (err) {
      toast.error(friendlyError(err instanceof ApiError ? err.code : "internal_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-wrap" style={{ maxWidth: 620 }}>
        <div>
          {/* Formulário */}
          <div>
            <StatLogo size={32} tone="onLight" animated={false} />
            <h1 className="auth-h1" style={{ fontSize: "clamp(26px, 4.6vw, 36px)" }}>Criar conta</h1>
            <p className="auth-sub">Médicos e estudantes de medicina — um único cadastro para usar a plataforma.</p>

            {/* Toggle tipo (thumb-zone) */}
            <div style={{ display: "flex", gap: 10, marginTop: 20, maxWidth: 480 }}>
              <button type="button" onClick={() => setTipo("medico")} className={`auth-toggle ${tipo === "medico" ? "on" : ""}`}>
                <Stethoscope size={18} /> Sou médico
              </button>
              <button type="button" onClick={() => setTipo("estudante")} className={`auth-toggle ${tipo === "estudante" ? "on" : ""}`}>
                <GraduationCap size={18} /> Estudante / outro
              </button>
            </div>

            <form onSubmit={submit} style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
              <div>
                <label className="auth-label">Nome completo</label>
                <div style={{ position: "relative", marginTop: 8 }}>
                  <User size={18} className="auth-ic" />
                  <input className="auth-field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
                </div>
              </div>

              {tipo === "medico" ? (
                <>
                  <div>
                    <label className="auth-label">CRM</label>
                    <div style={{ position: "relative", marginTop: 8 }}>
                      <Stethoscope size={18} className="auth-ic" />
                      <input className="auth-field" placeholder="CRM/UF 123456" value={crm} onChange={(e) => setCrm(e.target.value)} autoCapitalize="characters" required />
                    </div>
                  </div>
                  <div>
                    <label className="auth-label">Especialidade / atuação</label>
                    <div style={{ marginTop: 8 }}>
                      <select className="auth-field" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                        {ESPECIALIDADES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="auth-label">CPF</label>
                    <div style={{ position: "relative", marginTop: 8 }}>
                      <IdCard size={18} className="auth-ic" />
                      <input className="auth-field" inputMode="numeric" placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(formatCpf(e.target.value))} required />
                    </div>
                    {cpf.length >= 14 && !cpfOk && <div style={{ fontSize: 12, color: "#ff8a8a", marginTop: 6 }}>CPF inválido.</div>}
                  </div>
                  <div>
                    <label className="auth-label">Faculdade / período (opcional)</label>
                    <div style={{ position: "relative", marginTop: 8 }}>
                      <GraduationCap size={18} className="auth-ic" />
                      <input className="auth-field" placeholder="Ex.: USP — 9º período" value={faculdade} onChange={(e) => setFaculdade(e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="auth-label">Email</label>
                <div style={{ position: "relative", marginTop: 8 }}>
                  <Mail size={18} className="auth-ic" />
                  <input className="auth-field" type="email" inputMode="email" placeholder="voce@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                </div>
              </div>

              <div>
                <label className="auth-label">Telefone (WhatsApp)</label>
                <div style={{ position: "relative", marginTop: 8 }}>
                  <Phone size={18} className="auth-ic" />
                  <input className="auth-field" type="tel" inputMode="tel" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" required />
                </div>
                <p style={{ fontSize: 11.5, color: "var(--text-faint)", margin: "6px 0 0" }}>Usado para avisos do plantão — nunca para marketing.</p>
              </div>

              <div>
                <label className="auth-label">Senha (mín. 8)</label>
                <div style={{ position: "relative", marginTop: 8 }}>
                  <Lock size={18} className="auth-ic" />
                  <input
                    className="auth-field"
                    type={showPw ? "text" : "password"}
                    style={{ paddingRight: 46 }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    autoComplete="new-password"
                    required
                  />
                  <button type="button" className="auth-eye" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}>
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {tipo === "estudante" && (
                <p style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.5, margin: 0 }}>
                  Conteúdo de apoio educacional e à decisão clínica. Toda conduta deve ser confirmada por médico responsável.
                </p>
              )}

              <p style={{ fontSize: 12, color: "var(--text-faint)", lineHeight: 1.55, margin: 0 }}>
                Ao criar conta, você concorda com os{" "}
                <Link href="/termos" className="auth-link" style={{ fontWeight: 700 }}>Termos de Uso</Link> e a{" "}
                <Link href="/privacidade" className="auth-link" style={{ fontWeight: 700 }}>Política de Privacidade</Link>.
              </p>

              <button className="auth-btn" disabled={loading} type="submit" style={{ marginTop: 6 }}>
                {loading ? "Enviando…" : "Criar conta"}
              </button>
            </form>

            <p style={{ marginTop: 20, fontSize: 14.5, color: "var(--text-dim)" }}>
              Já tem conta?{" "}
              <Link href="/login" className="auth-link">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
