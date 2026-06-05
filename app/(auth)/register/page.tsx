"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Stethoscope, Radio } from "lucide-react";
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

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [crm, setCrm] = useState("");
  const [specialty, setSpecialty] = useState("Emergencista");
  const [role, setRole] = useState<Role>("requester");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await apiPost<{ role: Role; status: string }>("/api/auth/register", {
        name,
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
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "28px 0 40px" }}>
      <h1 style={{ margin: "0 0 4px", fontSize: 23, fontWeight: 900 }}>Criar conta</h1>
      <p className="faint" style={{ margin: "0 0 18px", fontSize: 14 }}>Profissionais de saúde habilitados.</p>

      <form onSubmit={submit} className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button
            type="button"
            onClick={() => setRole("requester")}
            className={`card-2 ${role === "requester" ? "" : ""}`}
            style={{
              textAlign: "left",
              cursor: "pointer",
              borderColor: role === "requester" ? "var(--red)" : "var(--border)",
              background: role === "requester" ? "color-mix(in srgb, var(--red) 14%, var(--surface-2))" : "var(--surface-2)",
            }}
          >
            <Stethoscope size={20} color="var(--red)" />
            <div style={{ fontWeight: 800, marginTop: 6 }}>Solicitante</div>
            <div className="faint" style={{ fontSize: 12 }}>Envio casos da sala vermelha</div>
          </button>
          <button
            type="button"
            onClick={() => setRole("responder")}
            style={{
              textAlign: "left",
              cursor: "pointer",
              borderRadius: 14,
              padding: 14,
              border: "1px solid",
              borderColor: role === "responder" ? "var(--blue)" : "var(--border)",
              background: role === "responder" ? "color-mix(in srgb, var(--blue) 14%, var(--surface-2))" : "var(--surface-2)",
            }}
          >
            <Radio size={20} color="var(--blue)" />
            <div style={{ fontWeight: 800, marginTop: 6 }}>Plantonista</div>
            <div className="faint" style={{ fontSize: 12 }}>Respondo casos (precisa aprovação)</div>
          </button>
        </div>

        <div>
          <label className="label">Nome completo</label>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">CRM</label>
          <input
            className="field"
            placeholder="CRM/UF 123456"
            value={crm}
            onChange={(e) => setCrm(e.target.value)}
            autoCapitalize="characters"
            required
          />
        </div>
        <div>
          <label className="label">Especialidade / atuação</label>
          <select className="field" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
            {SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Senha (mín. 6)</label>
          <input
            className="field"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>

        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? "Enviando…" : "Criar conta"}
        </button>
      </form>

      <p className="muted" style={{ textAlign: "center", marginTop: 18, fontSize: 14 }}>
        Já tem conta?{" "}
        <Link href="/login" style={{ color: "var(--blue)", fontWeight: 700 }}>
          Entrar
        </Link>
      </p>
    </div>
  );
}
