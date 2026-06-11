"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import StatLogo from "@/components/StatLogo";

export default function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feito, setFeito] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("A senha precisa de pelo menos 8 caracteres.");
    if (pw !== pw2) return toast.error("As senhas não conferem.");
    setLoading(true);
    try {
      const r = await fetch("/api/auth/reset-confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password: pw }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        toast.error(d.error === "reset_invalid" ? "Link inválido ou expirado — peça um novo." : "Não consegui redefinir. Tente de novo.");
        return;
      }
      setFeito(true);
      setTimeout(() => router.replace("/login"), 2600);
    } catch {
      toast.error("Falha de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-wrap" style={{ maxWidth: 560 }}>
        <StatLogo size={36} tone="onLight" animated={false} />
        {feito ? (
          <div style={{ marginTop: 26 }}>
            <span style={{ width: 52, height: 52, borderRadius: 14, background: "var(--green-tint)", color: "var(--green)", display: "grid", placeItems: "center" }}>
              <CheckCircle2 size={26} />
            </span>
            <h1 className="auth-h1" style={{ fontSize: 26, marginTop: 16 }}>Senha redefinida.</h1>
            <p className="auth-sub">Levando você ao login…</p>
          </div>
        ) : (
          <>
            <h1 className="auth-h1" style={{ fontSize: 26 }}>Criar nova senha</h1>
            <p className="auth-sub">Escolha uma senha nova (mínimo 8 caracteres). O link vale por 1 hora.</p>
            <form onSubmit={submit} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 440 }}>
              <div>
                <label className="auth-label" htmlFor="rs-pw">Nova senha</label>
                <div style={{ position: "relative", marginTop: 8 }}>
                  <Lock size={18} className="auth-ic" />
                  <input
                    id="rs-pw"
                    className="auth-field"
                    type={show ? "text" : "password"}
                    style={{ paddingRight: 46 }}
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    minLength={8}
                    autoComplete="new-password"
                    required
                  />
                  <button type="button" className="auth-eye" onClick={() => setShow((s) => !s)} aria-label={show ? "Ocultar senha" : "Mostrar senha"}>
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="auth-label" htmlFor="rs-pw2">Repita a senha</label>
                <div style={{ position: "relative", marginTop: 8 }}>
                  <Lock size={18} className="auth-ic" />
                  <input
                    id="rs-pw2"
                    className="auth-field"
                    type={show ? "text" : "password"}
                    value={pw2}
                    onChange={(e) => setPw2(e.target.value)}
                    minLength={8}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
              <button className="auth-btn" disabled={loading} type="submit">
                {loading ? "Salvando…" : "Redefinir senha"}
              </button>
            </form>
            <p style={{ marginTop: 20, fontSize: 14, color: "var(--text-dim)" }}>
              <Link href="/login" className="auth-link">← Voltar ao login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
