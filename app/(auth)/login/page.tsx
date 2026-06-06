"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Stethoscope, Lock, Eye, EyeOff } from "lucide-react";
import { apiPost, friendlyError, ApiError, Me } from "@/lib/client";
import StatLogo from "@/components/StatLogo";

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
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 18, paddingBottom: 40 }}>
      {/* Hero da marca (branco no navy, como o logo) */}
      <div
        style={{
          background: "var(--navy)",
          borderRadius: 24,
          padding: "36px 20px 30px",
          display: "flex",
          justifyContent: "center",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <StatLogo size={60} tone="onNavy" animated tagline />
      </div>

      {/* Card de acesso */}
      <form onSubmit={submit} className="card" style={{ display: "flex", flexDirection: "column", gap: 16, padding: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 2 }}>
          <div style={{ fontWeight: 800, fontSize: 17 }}>Entrar</div>
          <div className="faint" style={{ fontSize: 12.5, marginTop: 2 }}>Acesso para médicos</div>
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
