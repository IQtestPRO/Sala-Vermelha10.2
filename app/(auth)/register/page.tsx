"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Phone, Stethoscope, Lock, Eye, EyeOff, Radio } from "lucide-react";
import { apiPost, friendlyError, ApiError } from "@/lib/client";
import type { Role } from "@/lib/db";

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

function FieldIcon({ children }: { children: React.ReactNode }) {
  return <span className="faint" style={{ position: "absolute", left: 14, top: 17, pointerEvents: "none" }}>{children}</span>;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [crm, setCrm] = useState("");
  const [specialty, setSpecialty] = useState("Emergencista");
  const [role, setRole] = useState<Role>("requester");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await apiPost<{ role: Role; status: string }>("/api/auth/register", {
        name,
        phone,
        crm,
        specialty,
        role,
        password,
      });
      if (r.role === "responder") {
        toast.success("Cadastro enviado! Aguarde aprovação do administrador.");
        router.replace("/pending");
      } else {
        toast.success("Conta criada!");
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
      <div className="login-hero" style={{ padding: "26px 22px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/stat-logo.png" alt="STAT" style={{ width: "72%", maxWidth: 300, display: "block", margin: "0 auto" }} />
      </div>

      <form onSubmit={submit} className="card" style={{ display: "flex", flexDirection: "column", gap: 14, padding: 22 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: "-0.01em" }}>Criar conta</h1>
          <p className="faint" style={{ margin: "5px 0 0", fontSize: 13, lineHeight: 1.45 }}>Para profissionais de saúde habilitados.</p>
        </div>

        {/* Papel */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button
            type="button"
            onClick={() => setRole("requester")}
            style={{
              textAlign: "left", cursor: "pointer", borderRadius: 14, padding: 13, border: "1.5px solid",
              borderColor: role === "requester" ? "var(--red)" : "var(--border)",
              background: role === "requester" ? "var(--red-tint)" : "var(--surface-2)",
            }}
          >
            <Stethoscope size={19} color="var(--red)" />
            <div style={{ fontWeight: 800, marginTop: 6, fontSize: 14 }}>Solicitante</div>
            <div className="faint" style={{ fontSize: 11.5, lineHeight: 1.35 }}>Envio casos da sala vermelha</div>
          </button>
          <button
            type="button"
            onClick={() => setRole("responder")}
            style={{
              textAlign: "left", cursor: "pointer", borderRadius: 14, padding: 13, border: "1.5px solid",
              borderColor: role === "responder" ? "var(--primary)" : "var(--border)",
              background: role === "responder" ? "color-mix(in srgb, var(--primary) 12%, var(--surface-2))" : "var(--surface-2)",
            }}
          >
            <Radio size={19} color="var(--primary)" />
            <div style={{ fontWeight: 800, marginTop: 6, fontSize: 14 }}>Plantonista</div>
            <div className="faint" style={{ fontSize: 11.5, lineHeight: 1.35 }}>Respondo casos (precisa aprovação)</div>
          </button>
        </div>

        <div>
          <label className="label">Nome completo</label>
          <div style={{ position: "relative" }}>
            <FieldIcon><User size={18} /></FieldIcon>
            <input className="field" style={{ paddingLeft: 42 }} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </div>
        </div>

        <div>
          <label className="label">Telefone (WhatsApp)</label>
          <div style={{ position: "relative" }}>
            <FieldIcon><Phone size={18} /></FieldIcon>
            <input className="field" style={{ paddingLeft: 42 }} type="tel" inputMode="tel" placeholder="(11) 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" required />
          </div>
        </div>

        <div>
          <label className="label">CRM</label>
          <div style={{ position: "relative" }}>
            <FieldIcon><Stethoscope size={18} /></FieldIcon>
            <input className="field" style={{ paddingLeft: 42 }} placeholder="CRM/UF 123456" value={crm} onChange={(e) => setCrm(e.target.value)} autoCapitalize="characters" required />
          </div>
        </div>

        <div>
          <label className="label">Especialidade / atuação</label>
          <select className="field" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Senha (mín. 6)</label>
          <div style={{ position: "relative" }}>
            <FieldIcon><Lock size={18} /></FieldIcon>
            <input
              className="field"
              type={showPw ? "text" : "password"}
              style={{ paddingLeft: 42, paddingRight: 46 }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              autoComplete="new-password"
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
          {loading ? "Enviando…" : "Criar conta"}
        </button>
      </form>

      <p className="muted" style={{ textAlign: "center", fontSize: 14 }}>
        Já tem conta?{" "}
        <Link href="/login" style={{ color: "var(--primary)", fontWeight: 700 }}>
          Entrar
        </Link>
      </p>
    </div>
  );
}
