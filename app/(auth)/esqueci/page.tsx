"use client";

import { useState } from "react";
import Link from "next/link";
import { Stethoscope, MailCheck } from "lucide-react";
import StatLogo from "@/components/StatLogo";

export default function EsqueciPage() {
  const [doc, setDoc] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/reset-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier: doc }),
      });
    } catch {
      /* resposta é genérica de qualquer forma */
    } finally {
      setLoading(false);
      setEnviado(true);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-wrap" style={{ maxWidth: 560 }}>
        <StatLogo size={36} tone="onLight" animated={false} />
        {enviado ? (
          <div style={{ marginTop: 26 }}>
            <span style={{ width: 52, height: 52, borderRadius: 14, background: "var(--green-tint)", color: "var(--green)", display: "grid", placeItems: "center" }}>
              <MailCheck size={26} />
            </span>
            <h1 className="auth-h1" style={{ fontSize: 26, marginTop: 16 }}>Pedido registrado.</h1>
            <p className="auth-sub">
              Se existir uma conta com esse CRM/CPF, você vai receber o link de redefinição pelo contato cadastrado
              (WhatsApp ou e-mail) em alguns minutos. O link vale por 1 hora.
            </p>
            <Link href="/login" className="auth-link" style={{ display: "inline-block", marginTop: 20, fontSize: 14.5 }}>
              ← Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="auth-h1" style={{ fontSize: 26 }}>Esqueceu a senha?</h1>
            <p className="auth-sub">Informe seu CRM ou CPF — enviaremos o link de redefinição pelo contato cadastrado.</p>
            <form onSubmit={submit} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16, maxWidth: 440 }}>
              <div>
                <label className="auth-label" htmlFor="esq-doc">CRM ou CPF</label>
                <div style={{ position: "relative", marginTop: 8 }}>
                  <Stethoscope size={18} className="auth-ic" />
                  <input
                    id="esq-doc"
                    className="auth-field"
                    placeholder="CRM/UF 123456 ou CPF"
                    value={doc}
                    onChange={(e) => setDoc(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button className="auth-btn" disabled={loading} type="submit">
                {loading ? "Enviando…" : "Enviar link de redefinição"}
              </button>
            </form>
            <p style={{ marginTop: 20, fontSize: 14, color: "var(--text-dim)" }}>
              Lembrou?{" "}
              <Link href="/login" className="auth-link">Entrar</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
