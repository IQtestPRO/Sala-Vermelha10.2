"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Activity } from "lucide-react";
import { apiPost, friendlyError, ApiError, Me } from "@/lib/client";

export default function LoginPage() {
  const router = useRouter();
  const [crm, setCrm] = useState("");
  const [password, setPassword] = useState("");
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
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", paddingBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: "var(--red)", display: "grid", placeItems: "center" }}>
          <Activity size={26} color="white" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>Emergência em 10</h1>
          <p className="faint" style={{ margin: 0, fontSize: 13 }}>Sala vermelha • resposta em até 10 min</p>
        </div>
      </div>

      <form onSubmit={submit} className="card" style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
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
          <label className="label">Senha</label>
          <input
            className="field"
            type="password"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="muted" style={{ textAlign: "center", marginTop: 18, fontSize: 14 }}>
        Não tem conta?{" "}
        <Link href="/register" style={{ color: "var(--blue)", fontWeight: 700 }}>
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
