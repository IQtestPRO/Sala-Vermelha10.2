"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Save, Stethoscope, BrainCircuit, Lock, User, Phone, Mail, BadgeCheck, ChevronDown, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { ESPECIALIDADES } from "@/lib/especialidades";
import { formatCpf } from "@/lib/cpf";
import TopBar, { LogoutButton } from "@/components/TopBar";
import { useMe, useUpdateMe } from "@/components/AppShell";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { resizeToJpegBase64 } from "@/lib/image";
import VoiceButton from "@/components/VoiceButton";
import type { Me } from "@/lib/client";

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}

function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }}>{icon}</span>
        <input
          className="field"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ paddingLeft: 38, minHeight: 48 }}
        />
      </div>
    </div>
  );
}

export default function PerfilPage() {
  const me = useMe();
  const updateMe = useUpdateMe();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(me.name);
  const [phone, setPhone] = useState(me.phone ?? "");
  const [email, setEmail] = useState(me.email ?? "");
  const [specialty, setSpecialty] = useState(me.specialty ?? "");
  const [perfil, setPerfil] = useState(me.perfil_medico ?? "");
  const [avatarUrl, setAvatarUrl] = useState(me.avatar_url ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAv, setUploadingAv] = useState(false);

  async function pickAvatar(files: FileList | null) {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploadingAv(true);
    try {
      const b = await resizeToJpegBase64(file);
      setAvatarPreview(b);
      const res = await fetch("/api/upload", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ base64: b }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.url) {
        setAvatarUrl(d.url);
        // Salva NA HORA — a foto fica no perfil mesmo sem clicar em "Salvar perfil".
        try {
          const pr = await fetch("/api/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ avatar_url: d.url }) });
          const pd = await pr.json().catch(() => ({}));
          if (pr.ok && pd.user) {
            updateMe(pd.user as Me);
            toast.success("Foto de perfil salva!");
          } else {
            toast.error("Subi a foto, mas não consegui salvar. Toque em Salvar perfil.");
          }
        } catch {
          toast.error("Subi a foto, mas não consegui salvar. Toque em Salvar perfil.");
        }
      } else {
        toast.error("Não consegui subir a imagem.");
      }
    } catch {
      toast.error("Não consegui ler a imagem.");
    } finally {
      setUploadingAv(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function salvar() {
    if (newPass && newPass.length < 6) {
      toast.error("A nova senha precisa de ao menos 6 caracteres.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          specialty,
          perfil_medico: perfil,
          avatar_url: avatarUrl || null,
          currentPassword: curPass || undefined,
          newPassword: newPass || undefined,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (d.error === "wrong_password") toast.error("Senha atual incorreta.");
        else if (d.error === "weak_password") toast.error("Senha muito curta.");
        else toast.error("Não consegui salvar. Tente de novo.");
        return;
      }
      updateMe(d.user as Me);
      setCurPass("");
      setNewPass("");
      setAvatarPreview(null);
      toast.success("Perfil atualizado!");
    } catch {
      toast.error("Falha de conexão.");
    } finally {
      setSaving(false);
    }
  }

  const avatarSrc = avatarPreview ? `data:image/jpeg;base64,${avatarPreview}` : avatarUrl || "";
  // Inclui a especialidade atual (se vier de cadastro antigo, fora da lista) p/ não perder o valor.
  const opcoesEsp = specialty && !ESPECIALIDADES.includes(specialty) ? [specialty, ...ESPECIALIDADES] : ESPECIALIDADES;
  const isAcad = me.doc_type === "cpf"; // acadêmico (login por CPF) — sem CRM/especialidade médica

  return (
    <>
      <TopBar brand title="Perfil" subtitle={`${me.name}${me.crm ? " • " + me.crm : isAcad ? " • Acadêmico" : ""}`} right={<LogoutButton />} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 18, paddingBottom: 28 }}>
        {/* Avatar (Aceternity BackgroundGradient) */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <BackgroundGradient containerClassName="rounded-full" className="rounded-full p-[3px]">
            <div className="perfil-avatar" onClick={() => fileRef.current?.click()}>
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt="avatar" />
              ) : (
                <span className="perfil-avatar-ini">{initials(me.name)}</span>
              )}
              <span className="perfil-avatar-edit">{uploadingAv ? <Loader2 size={15} className="spin" /> : <Camera size={15} />}</span>
            </div>
          </BackgroundGradient>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 17 }}>{me.name}</div>
            <div className="faint" style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
              <BadgeCheck size={13} color="var(--primary)" /> {isAcad ? "Estudante / Acadêmico" : `${me.crm} · ${me.role === "responder" ? "Plantonista" : "Solicitante"}`}
            </div>
          </div>
        </div>

        {/* Dados */}
        <div>
          <div className="label">Dados</div>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <Field label="Nome" icon={<User size={16} />} value={name} onChange={setName} placeholder="Seu nome" />
            <Field label="Telefone / WhatsApp" icon={<Phone size={16} />} value={phone} onChange={setPhone} placeholder="(00) 00000-0000" type="tel" />
            <Field label="Email" icon={<Mail size={16} />} value={email} onChange={setEmail} placeholder="você@exemplo.com" type="email" />

            {isAcad ? (
              <Field label="Faculdade / período" icon={<GraduationCap size={16} />} value={specialty} onChange={setSpecialty} placeholder="Ex.: USP — 9º período" />
            ) : (
              <div>
                <label className="label">Especialidade</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)", pointerEvents: "none" }}>
                    <Stethoscope size={16} />
                  </span>
                  <select
                    className="field"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    style={{ paddingLeft: 38, paddingRight: 38, minHeight: 48, appearance: "none", WebkitAppearance: "none", MozAppearance: "none", background: "var(--surface)", cursor: "pointer" }}
                  >
                    <option value="">Selecione a especialidade…</option>
                    {opcoesEsp.map((esp) => (
                      <option key={esp} value={esp}>{esp}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)", pointerEvents: "none" }} />
                </div>
                <div className="faint" style={{ fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>
                  A IA adapta as respostas à sua especialidade (profundidade, linguagem e diretrizes da área).
                </div>
              </div>
            )}

            <div>
              <label className="label">{isAcad ? "Documento" : "CRM"}</label>
              <input className="field" value={isAcad ? (me.cpf ? formatCpf(me.cpf) + " · CPF" : "CPF") : me.crm} disabled style={{ minHeight: 48, opacity: 0.7 }} />
              <div className="faint" style={{ fontSize: 11, marginTop: 4 }}>
                {isAcad ? "Você entra pelo CPF. Adicione um CRM futuramente para atuar como plantonista." : "O CRM é seu login e não pode ser alterado aqui."}
              </div>
            </div>
          </div>
        </div>

        {/* Memória do médico */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 900, fontSize: 11, letterSpacing: "0.06em", color: "#fff", background: "var(--primary)", borderRadius: 6, padding: "2px 7px" }}>IA</span>
            <span className="label" style={{ margin: 0 }}>Memória do médico</span>
          </div>
          <div className="card-2" style={{ boxShadow: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.45 }}>
              <BrainCircuit size={16} color="var(--primary)" style={{ flex: "0 0 auto", marginTop: 1 }} />
              <span>Conte como você trabalha. A IA usa isso pra adaptar as respostas ao seu contexto (local, recursos, preferências).</span>
            </div>
            <div style={{ position: "relative" }}>
              <textarea
                className="field"
                value={perfil}
                onChange={(e) => setPerfil(e.target.value)}
                placeholder="Ex.: Trabalho em UPA do SUS (recursos limitados), atendo adultos. Prefiro condutas adaptadas à realidade, doses em ampolas e mL/h na BIC. Já aciono a regulação cedo nos casos graves. (ou toque no microfone e fale)"
                style={{ minHeight: 110, lineHeight: 1.5, paddingRight: 52 }}
              />
              <VoiceButton value={perfil} onChange={setPerfil} className="voice-in-area" />
            </div>
          </div>
        </div>

        {/* Segurança */}
        <div>
          <div className="label">Segurança</div>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <Field label="Senha atual" icon={<Lock size={16} />} value={curPass} onChange={setCurPass} placeholder="Só p/ trocar a senha" type="password" />
            <Field label="Nova senha" icon={<Lock size={16} />} value={newPass} onChange={setNewPass} placeholder="Mín. 6 caracteres" type="password" />
          </div>
        </div>

        <button className="btn btn-primary" disabled={saving} onClick={salvar} style={{ minHeight: 52 }}>
          {saving ? <><Loader2 size={20} className="spin" /> Salvando…</> : <><Save size={20} /> Salvar perfil</>}
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickAvatar(e.target.files)} />
    </>
  );
}
