"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, ClipboardList, Plus, ChevronLeft, ChevronRight, Trash2, Share2, Check, MapPin } from "lucide-react";
import TopBar, { LogoutButton } from "@/components/TopBar";
import VoiceButton from "@/components/VoiceButton";
import { apiGet, apiPost } from "@/lib/client";
import { toast } from "sonner";

type Seg = "plantoes" | "passagem";

type Shift = { id: string; data: string; inicio: string | null; fim: string | null; local: string | null; valor: number | null; pago: boolean; cor: string | null; nota: string | null };
type Handoff = { token: string; paciente: string; idade: string | null; leito: string | null; situacao: string | null; status: string; author_name: string | null; updated_at: number };

const CORES = ["#15294C", "#E11D2A", "#1a8f4f", "#c77d11", "#6d28d9"];
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const ddmm = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.slice(8, 10) + "/" + iso.slice(5, 7) : iso);
const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function curMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function shiftMonth(m: string, delta: number): string {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ---------------- Plantões (agenda + financeiro) ----------------
function Plantoes() {
  const [month, setMonth] = useState(curMonth());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ data: "", inicio: "", fim: "", local: "", valor: "", cor: CORES[0], recorrencia: "unica" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await apiGet<{ shifts: Shift[] }>(`/api/shifts?month=${month}`);
      setShifts(r.shifts);
    } catch {
      /* noop */
    }
  }, [month]);
  useEffect(() => {
    load();
  }, [load]);

  const recebido = shifts.filter((s) => s.pago).reduce((a, s) => a + (s.valor || 0), 0);
  const aReceber = shifts.filter((s) => !s.pago).reduce((a, s) => a + (s.valor || 0), 0);

  async function salvar() {
    if (!f.data) return toast.error("Informe a data.");
    setSaving(true);
    try {
      await apiPost("/api/shifts", { ...f, valor: f.valor ? Number(f.valor.replace(",", ".")) : null });
      setShowForm(false);
      setF({ data: "", inicio: "", fim: "", local: "", valor: "", cor: CORES[0], recorrencia: "unica" });
      toast.success("Plantão salvo.");
      load();
    } catch {
      toast.error("Não consegui salvar.");
    } finally {
      setSaving(false);
    }
  }
  async function togglePago(s: Shift) {
    setShifts((arr) => arr.map((x) => (x.id === s.id ? { ...x, pago: !x.pago } : x)));
    await fetch("/api/shifts", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: s.id, pago: !s.pago }) });
  }
  async function remover(s: Shift) {
    setShifts((arr) => arr.filter((x) => x.id !== s.id));
    await fetch(`/api/shifts?id=${s.id}`, { method: "DELETE" });
  }

  const [y, mo] = month.split("-").map(Number);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Resumo financeiro */}
      <div style={{ display: "flex", gap: 10 }}>
        <div className="card" style={{ flex: 1, padding: "12px 14px" }}>
          <div className="faint" style={{ fontSize: 11.5, fontWeight: 700 }}>Recebido</div>
          <div className="data" style={{ fontSize: 18, fontWeight: 800, color: "var(--green)" }}>{brl(recebido)}</div>
        </div>
        <div className="card" style={{ flex: 1, padding: "12px 14px" }}>
          <div className="faint" style={{ fontSize: 11.5, fontWeight: 700 }}>A receber</div>
          <div className="data" style={{ fontSize: 18, fontWeight: 800, color: "var(--amber)" }}>{brl(aReceber)}</div>
        </div>
      </div>

      {/* Navegação de mês */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setMonth(shiftMonth(month, -1))}><ChevronLeft size={18} /></button>
        <span style={{ fontWeight: 800, fontSize: 15 }}>{MES[mo - 1]} {y}</span>
        <button className="btn btn-ghost btn-sm" onClick={() => setMonth(shiftMonth(month, 1))}><ChevronRight size={18} /></button>
      </div>

      <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)} style={{ minHeight: 46 }}>
        <Plus size={18} /> Novo plantão
      </button>

      {showForm && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label className="label">Data</label>
              <input type="date" className="field" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} style={{ minHeight: 46 }} />
            </div>
            <div style={{ width: 110 }}>
              <label className="label">Valor</label>
              <input className="field" inputMode="decimal" placeholder="R$" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} style={{ minHeight: 46 }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label className="label">Início</label>
              <input type="time" className="field" value={f.inicio} onChange={(e) => setF({ ...f, inicio: e.target.value })} style={{ minHeight: 46 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Fim</label>
              <input type="time" className="field" value={f.fim} onChange={(e) => setF({ ...f, fim: e.target.value })} style={{ minHeight: 46 }} />
            </div>
          </div>
          <div>
            <label className="label">Local</label>
            <input className="field" placeholder="Hospital / UPA / unidade" value={f.local} onChange={(e) => setF({ ...f, local: e.target.value })} style={{ minHeight: 46 }} />
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="label" style={{ margin: 0 }}>Cor</span>
            {CORES.map((c) => (
              <button key={c} onClick={() => setF({ ...f, cor: c })} style={{ width: 26, height: 26, borderRadius: 8, background: c, border: f.cor === c ? "3px solid var(--text)" : "2px solid var(--border)" }} aria-label="cor" />
            ))}
          </div>
          <div>
            <label className="label">Repetir</label>
            <div className="scroll-x">
              {([["unica", "Única"], ["semanal", "Semanal (12x)"], ["mensal", "Mensal (6x)"]] as const).map(([k, lbl]) => (
                <button key={k} className={`chip ${f.recorrencia === k ? "chip-on" : ""}`} onClick={() => setF({ ...f, recorrencia: k })} style={{ flex: "0 0 auto" }}>{lbl}</button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" disabled={saving} onClick={salvar} style={{ minHeight: 48 }}>{saving ? "Salvando…" : "Salvar plantão"}</button>
        </div>
      )}

      {shifts.length === 0 ? (
        <div className="muted" style={{ textAlign: "center", padding: 24 }}>Nenhum plantão neste mês.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {shifts.map((s) => (
            <div key={s.id} className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
              <div style={{ width: 6, alignSelf: "stretch", borderRadius: 4, background: s.cor || CORES[0] }} />
              <div style={{ textAlign: "center", minWidth: 40 }}>
                <div className="data" style={{ fontSize: 18, fontWeight: 800 }}>{ddmm(s.data).slice(0, 2)}</div>
                <div className="faint" style={{ fontSize: 10 }}>{ddmm(s.data).slice(3)}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.local || "Plantão"}</div>
                <div className="faint" style={{ fontSize: 12 }}>{[s.inicio && s.fim ? `${s.inicio}–${s.fim}` : s.inicio, s.valor != null ? brl(s.valor) : null].filter(Boolean).join(" · ")}</div>
              </div>
              <button onClick={() => togglePago(s)} className="chip" style={{ flex: "0 0 auto", background: s.pago ? "color-mix(in srgb, var(--green) 16%, var(--surface))" : "var(--surface-sunken)", color: s.pago ? "var(--green)" : "var(--text-dim)", fontWeight: 700 }}>
                {s.pago ? <><Check size={13} /> Pago</> : "A receber"}
              </button>
              <button onClick={() => remover(s)} className="btn btn-ghost btn-sm" style={{ flex: "0 0 auto", padding: 6 }}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Passagem de plantão ----------------
function Passagem() {
  const [list, setList] = useState<Handoff[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ paciente: "", idade: "", leito: "", situacao: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await apiGet<{ handoffs: Handoff[] }>("/api/handoffs");
      setList(r.handoffs);
    } catch {
      /* noop */
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function salvar() {
    if (!f.paciente.trim()) return toast.error("Informe o paciente.");
    setSaving(true);
    try {
      await apiPost<{ token: string }>("/api/handoffs", f);
      setShowForm(false);
      setF({ paciente: "", idade: "", leito: "", situacao: "" });
      toast.success("Passagem criada.");
      load();
    } catch {
      toast.error("Não consegui criar.");
    } finally {
      setSaving(false);
    }
  }

  async function compartilhar(h: Handoff) {
    const url = `${window.location.origin}/plantao/p/${h.token}`;
    const texto = `Passagem de plantão — ${h.paciente}${h.idade ? ", " + h.idade : ""}${h.leito ? " (leito " + h.leito + ")" : ""}\nAbra e continue: ${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Passagem de plantão", text: texto, url });
        return;
      }
    } catch {
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card-2" style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.45, boxShadow: "none" }}>
        Registre o paciente e o que ficou pendente. Compartilhe pelo WhatsApp: quem entra no plantão abre o link e <b>continua de onde você parou</b> (tudo fica salvo).
      </div>

      <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)} style={{ minHeight: 46 }}>
        <Plus size={18} /> Nova passagem
      </button>

      {showForm && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 2 }}>
              <label className="label">Paciente</label>
              <input className="field" placeholder="Nome / iniciais" value={f.paciente} onChange={(e) => setF({ ...f, paciente: e.target.value })} style={{ minHeight: 46 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Idade</label>
              <input className="field" placeholder="ex.: 64a" value={f.idade} onChange={(e) => setF({ ...f, idade: e.target.value })} style={{ minHeight: 46 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Leito</label>
              <input className="field" placeholder="nº" value={f.leito} onChange={(e) => setF({ ...f, leito: e.target.value })} style={{ minHeight: 46 }} />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="label">Situação, exames, condutas e pendências</label>
              <VoiceButton value={f.situacao} onChange={(v) => setF({ ...f, situacao: v })} />
            </div>
            <textarea className="field" rows={5} placeholder="HD, o que foi feito, o que falta…" value={f.situacao} onChange={(e) => setF({ ...f, situacao: e.target.value })} style={{ resize: "vertical", lineHeight: 1.5 }} />
          </div>
          <button className="btn btn-primary" disabled={saving} onClick={salvar} style={{ minHeight: 48 }}>{saving ? "Salvando…" : "Criar passagem"}</button>
        </div>
      )}

      {list.length === 0 ? (
        <div className="muted" style={{ textAlign: "center", padding: 24 }}>Nenhuma passagem ativa.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {list.map((h) => (
            <div key={h.token} className="card" style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              <Link href={`/plantao/p/${h.token}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 15.5 }}>{h.paciente}</span>
                  {h.idade && <span className="faint" style={{ fontSize: 12.5 }}>{h.idade}</span>}
                  {h.leito && <span className="faint" style={{ fontSize: 12.5 }}>· leito {h.leito}</span>}
                </div>
                {h.situacao && <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4 }}>{h.situacao}</div>}
                <div className="faint" style={{ fontSize: 11, marginTop: 4 }}>deixado por {h.author_name || "—"}</div>
              </Link>
              <div style={{ display: "flex", gap: 8 }}>
                <Link href={`/plantao/p/${h.token}`} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>Abrir / continuar</Link>
                <button className="btn btn-ghost btn-sm" onClick={() => compartilhar(h)} style={{ flex: "0 0 auto", color: "var(--green)" }}><Share2 size={15} /> WhatsApp</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PlantaoPage() {
  const [seg, setSeg] = useState<Seg>("passagem");
  return (
    <>
      <TopBar brand title="Plantão" subtitle="Passagem de plantão e sua agenda" right={<LogoutButton />} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, paddingBottom: 28 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={`btn ${seg === "passagem" ? "btn-primary" : "btn-ghost"}`} onClick={() => setSeg("passagem")} style={{ flex: 1, minHeight: 46 }}>
            <ClipboardList size={18} /> Passagem
          </button>
          <button className={`btn ${seg === "plantoes" ? "btn-primary" : "btn-ghost"}`} onClick={() => setSeg("plantoes")} style={{ flex: 1, minHeight: 46 }}>
            <CalendarClock size={18} /> Plantões
          </button>
        </div>
        {seg === "passagem" ? <Passagem /> : <Plantoes />}
      </div>
    </>
  );
}
