"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CalendarClock, CalendarDays, List, ClipboardList, Plus, Trash2, Share2, Check, CheckCheck, X, Download, Image as ImageIcon } from "lucide-react";
import TopBar, { LogoutButton } from "@/components/TopBar";
import VoiceButton from "@/components/VoiceButton";
import { apiGet, apiPost } from "@/lib/client";
import { resizeToJpegBase64 } from "@/lib/image";
import { toast } from "sonner";

type Seg = "plantoes" | "passagem";

type Shift = { id: string; data: string; inicio: string | null; fim: string | null; local: string | null; valor: number | null; pago: boolean; cor: string | null; nota: string | null };
type Handoff = { token: string; paciente: string; idade: string | null; leito: string | null; situacao: string | null; status: string; author_name: string | null; updated_at: number };
type Modelo = { local: string; inicio: string; fim: string; valor: string; cor: string; diaPag: string };

// Vermelho é SÓ urgência/ECG (DESIGN.md) — petróleo no lugar; plantões antigos com a cor velha seguem renderizando.
const CORES = ["#15294C", "#0e7490", "#1a8f4f", "#c77d11", "#6d28d9"];
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const ddmm = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso.slice(8, 10) + "/" + iso.slice(5, 7) : iso);
const MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const SEM = ["Dom.", "Seg.", "Ter.", "Qua.", "Qui.", "Sex.", "Sáb."];
const pad = (n: number) => String(n).padStart(2, "0");
// Fonte do sistema (no iOS = San Francisco, igual ao print do Plantãozinho).
const SF = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

// --- datas SEM timezone implícito (nunca new Date("YYYY-MM-DD")) ---
function curMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
function shiftMonth(m: string, delta: number): string {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + delta, 1); // construtor local — seguro
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ---------------- Plantões (agenda + financeiro) ----------------
function Plantoes() {
  const [month, setMonth] = useState(curMonth());
  const [view, setView] = useState<"cal" | "lista">("cal");
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selDay, setSelDay] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [f, setF] = useState({ data: "", inicio: "", fim: "", local: "", valor: "", cor: CORES[0], recorrencia: "unica", diaPag: "" });
  const [saving, setSaving] = useState(false);
  const swipeX = useRef<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  // Seleção em bloco (1c)
  const [selMode, setSelMode] = useState(false);
  const [bulkDays, setBulkDays] = useState<string[]>([]);
  const [bulkShifts, setBulkShifts] = useState<string[]>([]);
  const toggleBulkDay = (iso: string) => setBulkDays((a) => (a.includes(iso) ? a.filter((x) => x !== iso) : [...a, iso]));
  const toggleBulkShift = (id: string) => setBulkShifts((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  function sairSelecao() {
    setSelMode(false);
    setBulkDays([]);
    setBulkShifts([]);
  }
  // Modelos de plantão (1d) — locais salvos no aparelho; diaPag alimenta a previsão (1e)
  const [modelos, setModelos] = useState<Modelo[]>([]);
  useEffect(() => {
    try {
      setModelos(JSON.parse(localStorage.getItem("stat_plantao_modelos") || "[]"));
    } catch {
      /* noop */
    }
  }, []);
  function persistModelos(m: Modelo[]) {
    setModelos(m);
    try {
      localStorage.setItem("stat_plantao_modelos", JSON.stringify(m));
    } catch {
      /* noop */
    }
  }
  function salvarModelo() {
    if (!f.local.trim()) return toast.error("Informe o local para salvar o modelo.");
    const m: Modelo = { local: f.local.trim(), inicio: f.inicio, fim: f.fim, valor: f.valor, cor: f.cor, diaPag: f.diaPag };
    persistModelos([...modelos.filter((x) => x.local.toLowerCase() !== m.local.toLowerCase()), m]);
    toast.success("Modelo salvo.");
  }
  const aplicarModelo = (m: Modelo) => setF((p) => ({ ...p, local: m.local, inicio: m.inicio, fim: m.fim, valor: m.valor, cor: m.cor, diaPag: m.diaPag }));
  const removerModelo = (local: string) => persistModelos(modelos.filter((x) => x.local !== local));

  // Foto da escala original do mês (1g) — guardada no aparelho (a URL fica no Blob, permanente)
  const escalaRef = useRef<HTMLInputElement>(null);
  const [escalaUrl, setEscalaUrl] = useState<string | null>(null);
  const [upEscala, setUpEscala] = useState(false);
  useEffect(() => {
    try {
      setEscalaUrl(localStorage.getItem(`stat_escala_${month}`));
    } catch {
      setEscalaUrl(null);
    }
  }, [month]);
  async function anexarEscala(files: FileList | null) {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUpEscala(true);
    try {
      const b = await resizeToJpegBase64(file);
      const res = await fetch("/api/upload", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ base64: b }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.url) {
        localStorage.setItem(`stat_escala_${month}`, d.url);
        setEscalaUrl(d.url);
        toast.success("Escala anexada.");
      } else toast.error("Não consegui subir a imagem.");
    } catch {
      toast.error("Não consegui ler a imagem.");
    } finally {
      setUpEscala(false);
      if (escalaRef.current) escalaRef.current.value = "";
    }
  }
  function removerEscala() {
    localStorage.removeItem(`stat_escala_${month}`);
    setEscalaUrl(null);
  }

  // Exportar .ics (1f) — abre no Google Agenda / Apple Calendário (horário local flutuante)
  function exportarICS() {
    if (!shifts.length) return toast.error("Sem plantões neste mês.");
    const p2 = (n: number) => String(n).padStart(2, "0");
    const esc = (t: string) => t.replace(/([,;\\])/g, "\\$1");
    const dt = (data: string, hm: string | null, nextDay = false) => {
      const [Y, M, D] = data.split("-").map(Number);
      if (!hm) return { allday: true, v: `${Y}${p2(M)}${p2(D)}` };
      const [h, mi] = hm.split(":").map(Number);
      let yy = Y, mm = M, dd = D;
      if (nextDay) {
        const nx = new Date(Y, M - 1, D + 1);
        yy = nx.getFullYear(); mm = nx.getMonth() + 1; dd = nx.getDate();
      }
      return { allday: false, v: `${yy}${p2(mm)}${p2(dd)}T${p2(h)}${p2(mi)}00` };
    };
    const stamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
    const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//STAT//Plantao//PT", "CALSCALE:GREGORIAN"];
    for (const s of shifts) {
      const overnight = !!(s.inicio && s.fim && s.fim < s.inicio);
      const start = dt(s.data, s.inicio);
      const end = s.fim ? dt(s.data, s.fim, overnight) : null;
      L.push("BEGIN:VEVENT", `UID:${s.id}@statanalysis`, `DTSTAMP:${stamp}`);
      L.push(start.allday ? `DTSTART;VALUE=DATE:${start.v}` : `DTSTART:${start.v}`);
      if (end) L.push(end.allday ? `DTEND;VALUE=DATE:${end.v}` : `DTEND:${end.v}`);
      L.push(`SUMMARY:${esc("Plantão" + (s.local ? " — " + s.local : ""))}`);
      if (s.valor != null) L.push(`DESCRIPTION:${esc(brl(s.valor) + (s.pago ? " (pago)" : " (a receber)"))}`);
      L.push("END:VEVENT");
    }
    L.push("END:VCALENDAR");
    const blob = new Blob([L.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plantoes-${month}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo .ics gerado.");
  }

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
  useEffect(() => {
    setSelDay(null);
    setShowForm(false);
  }, [month]);

  const recebido = shifts.filter((s) => s.pago).reduce((a, s) => a + (s.valor || 0), 0);
  const aReceber = shifts.filter((s) => !s.pago).reduce((a, s) => a + (s.valor || 0), 0);
  // Previsão (1e): agrupa o "a receber" pelo dia de pagamento do modelo do local.
  const previsao = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of shifts) {
      if (s.pago || !s.valor) continue;
      const m = modelos.find((x) => x.local.toLowerCase() === (s.local || "").toLowerCase());
      if (m?.diaPag) map[m.diaPag] = (map[m.diaPag] || 0) + s.valor;
    }
    return Object.entries(map).map(([dia, v]) => ({ dia, v })).sort((a, b) => Number(a.dia) - Number(b.dia));
  }, [shifts, modelos]);

  async function salvar() {
    const valor = f.valor ? Number(f.valor.replace(",", ".")) : null;
    // Lançamento em bloco: um plantão em cada dia selecionado.
    if (bulkDays.length) {
      setSaving(true);
      try {
        for (const data of bulkDays) await apiPost("/api/shifts", { ...f, data, recorrencia: "unica", valor });
        setShowForm(false);
        setF({ data: "", inicio: "", fim: "", local: "", valor: "", cor: CORES[0], recorrencia: "unica", diaPag: "" });
        toast.success(`${bulkDays.length} plantões lançados.`);
        sairSelecao();
        load();
      } catch {
        toast.error("Não consegui salvar.");
      } finally {
        setSaving(false);
      }
      return;
    }
    if (!f.data) return toast.error("Informe a data.");
    setSaving(true);
    try {
      await apiPost("/api/shifts", { ...f, valor });
      setShowForm(false);
      setF({ data: "", inicio: "", fim: "", local: "", valor: "", cor: CORES[0], recorrencia: "unica", diaPag: "" });
      toast.success("Plantão salvo.");
      load();
    } catch {
      toast.error("Não consegui salvar.");
    } finally {
      setSaving(false);
    }
  }
  // Falhou a rede? Avisa e recarrega do servidor — financeiro NUNCA diverge em silêncio.
  async function syncFalhou() {
    toast.error("Não consegui sincronizar — tente de novo.");
    await load();
  }
  async function bulkPago(pago: boolean) {
    setShifts((arr) => arr.map((x) => (bulkShifts.includes(x.id) ? { ...x, pago } : x)));
    try {
      for (const id of bulkShifts) {
        const r = await fetch("/api/shifts", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, pago }) });
        if (!r.ok) throw new Error();
      }
      toast.success(pago ? "Marcados como pagos." : "Marcados como a receber.");
    } catch {
      await syncFalhou();
    }
    sairSelecao();
  }
  async function bulkRemover() {
    const ids = bulkShifts;
    setShifts((arr) => arr.filter((x) => !ids.includes(x.id)));
    sairSelecao();
    try {
      for (const id of ids) {
        const r = await fetch(`/api/shifts?id=${id}`, { method: "DELETE" });
        if (!r.ok) throw new Error();
      }
    } catch {
      await syncFalhou();
    }
  }
  async function togglePago(s: Shift) {
    setShifts((arr) => arr.map((x) => (x.id === s.id ? { ...x, pago: !x.pago } : x)));
    try {
      const r = await fetch("/api/shifts", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: s.id, pago: !s.pago }) });
      if (!r.ok) throw new Error();
    } catch {
      await syncFalhou();
    }
  }
  async function remover(s: Shift) {
    setShifts((arr) => arr.filter((x) => x.id !== s.id));
    try {
      const r = await fetch(`/api/shifts?id=${s.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
    } catch {
      await syncFalhou();
    }
  }
  function novoNoDia(iso: string) {
    setF((p) => ({ ...p, data: iso }));
    setShowForm(true);
    // Quem rola é o .app-main (shell), não o window — scrollIntoView acha o form em qualquer container.
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  const [y, mo] = month.split("-").map(Number);
  const firstWeekday = new Date(y, mo - 1, 1).getDay(); // 0=Dom (local, seguro)
  const daysInMonth = new Date(y, mo, 0).getDate();
  const hoje = todayISO();
  const prevDays = new Date(y, mo - 1, 0).getDate(); // dias do mês anterior (local)
  const cells: { d: number; inMonth: boolean }[] = [];
  for (let i = firstWeekday - 1; i >= 0; i--) cells.push({ d: prevDays - i, inMonth: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d, inMonth: true });
  let nd = 1;
  while (cells.length < 42) cells.push({ d: nd++, inMonth: false }); // SEMPRE 6 linhas (altura constante)

  const shiftsDoDia = (iso: string) => shifts.filter((s) => s.data === iso);
  const selShifts = selDay ? shiftsDoDia(selDay) : [];

  function ShiftRow({ s }: { s: Shift }) {
    const checked = bulkShifts.includes(s.id);
    const corpo = (
      <>
        <div style={{ width: 6, alignSelf: "stretch", borderRadius: 4, background: s.cor || CORES[0] }} />
        <div style={{ textAlign: "center", minWidth: 38 }}>
          <div className="data" style={{ fontSize: 18, fontWeight: 800 }}>{ddmm(s.data).slice(0, 2)}</div>
          <div className="faint" style={{ fontSize: 10 }}>{ddmm(s.data).slice(3)}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.local || "Plantão"}</div>
          <div className="faint" style={{ fontSize: 12 }}>{[s.inicio && s.fim ? `${s.inicio}–${s.fim}` : s.inicio, s.valor != null ? brl(s.valor) : null].filter(Boolean).join(" · ")}</div>
        </div>
      </>
    );
    if (selMode) {
      return (
        <button onClick={() => toggleBulkShift(s.id)} className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", width: "100%", textAlign: "left", cursor: "pointer", border: checked ? "1.5px solid var(--primary)" : undefined, background: checked ? "var(--primary-tint)" : undefined }}>
          <span style={{ flex: "0 0 auto", width: 22, height: 22, borderRadius: 999, border: `2px solid ${checked ? "var(--primary)" : "var(--border)"}`, background: checked ? "var(--primary)" : "transparent", display: "grid", placeItems: "center" }}>{checked && <Check size={13} color="#fff" />}</span>
          {corpo}
          <span className="chip" style={{ flex: "0 0 auto", background: s.pago ? "color-mix(in srgb, var(--green) 16%, var(--surface))" : "var(--surface-sunken)", color: s.pago ? "var(--green)" : "var(--text-dim)", fontWeight: 700, pointerEvents: "none" }}>{s.pago ? "Pago" : "A receber"}</span>
        </button>
      );
    }
    return (
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
        {corpo}
        <button onClick={() => togglePago(s)} className="chip" style={{ flex: "0 0 auto", background: s.pago ? "color-mix(in srgb, var(--green) 16%, var(--surface))" : "var(--surface-sunken)", color: s.pago ? "var(--green)" : "var(--text-dim)", fontWeight: 700 }}>
          {s.pago ? <><Check size={13} /> Pago</> : "A receber"}
        </button>
        <button onClick={() => remover(s)} className="btn btn-ghost btn-sm" style={{ flex: "0 0 auto", padding: 12 }} aria-label="Excluir plantão"><Trash2 size={15} /></button>
      </div>
    );
  }

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

      {previsao.length > 0 && (
        <div className="card-2" style={{ padding: "9px 12px", boxShadow: "none", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, fontSize: 12.5 }}>
          <span className="faint" style={{ fontWeight: 700 }}>Previsão de recebimento:</span>
          {previsao.map((p) => (
            <span key={p.dia}>dia {p.dia} · <b style={{ color: "var(--amber)" }}>{brl(p.v)}</b></span>
          ))}
        </div>
      )}

      {/* Toggle de visão + seleção em bloco */}
      <div style={{ display: "flex", gap: 8 }}>
        <button className={`btn btn-sm ${view === "cal" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("cal")} style={{ flex: 1 }}><CalendarDays size={16} /> Calendário</button>
        <button className={`btn btn-sm ${view === "lista" ? "btn-primary" : "btn-ghost"}`} onClick={() => setView("lista")} style={{ flex: 1 }}><List size={16} /> Lista</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: -4 }}>
        <span className="faint" style={{ fontSize: 12 }}>{selMode ? (view === "cal" ? "Toque nos dias para selecionar" : "Toque nos plantões") : ""}</span>
        <button className={`btn btn-sm ${selMode ? "btn-primary" : "btn-ghost"}`} onClick={() => (selMode ? sairSelecao() : setSelMode(true))} style={{ flex: "0 0 auto" }}>
          <CheckCheck size={15} /> {selMode ? "Concluir" : "Selecionar"}
        </button>
      </div>

      {/* Exportar .ics (1f) + foto da escala do mês (1g) */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="btn btn-ghost btn-sm" onClick={exportarICS}><Download size={14} /> Exportar .ics</button>
        {escalaUrl ? (
          <>
            <a href={escalaUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><ImageIcon size={14} /> Ver escala</a>
            <button className="btn btn-ghost btn-sm" onClick={removerEscala} style={{ color: "var(--red)" }} aria-label="remover escala"><Trash2 size={14} /></button>
          </>
        ) : (
          <button className="btn btn-ghost btn-sm" onClick={() => escalaRef.current?.click()} disabled={upEscala}><ImageIcon size={14} /> {upEscala ? "Enviando…" : "Anexar escala"}</button>
        )}
        <input ref={escalaRef} type="file" accept="image/*" hidden onChange={(e) => anexarEscala(e.target.files)} />
      </div>

      {view === "cal" ? (
        <>
          {/* Calendário estilo iOS / Plantãozinho — navega por swipe */}
          <div
            className="card"
            style={{ padding: "14px 12px 20px", fontFamily: SF, touchAction: "pan-y" }}
            onPointerDown={(e) => { swipeX.current = e.clientX; }}
            onPointerUp={(e) => {
              if (swipeX.current == null) return;
              const dx = e.clientX - swipeX.current;
              swipeX.current = null;
              if (Math.abs(dx) > 45) setMonth(shiftMonth(month, dx < 0 ? 1 : -1));
            }}
          >
            {/* Cabeçalho: Hoje | MÊS ANO (centro absoluto) | + */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 14, padding: "0 4px" }}>
              <button onClick={() => { setMonth(curMonth()); setSelDay(todayISO()); }} style={{ justifySelf: "start", background: "none", border: "none", color: "var(--primary)", fontWeight: 600, fontSize: 15, cursor: "pointer", padding: 0, fontFamily: SF }}>Hoje</button>
              <span style={{ gridColumn: 2, justifySelf: "center", fontWeight: 700, fontSize: 16, letterSpacing: "0.01em", whiteSpace: "nowrap" }}>{MES[mo - 1].toUpperCase()} {y}</span>
              <button onClick={() => novoNoDia(selDay || todayISO())} aria-label="novo plantão" style={{ justifySelf: "end", background: "var(--primary)", border: "none", color: "#fff", width: 34, height: 34, borderRadius: 999, display: "grid", placeItems: "center", cursor: "pointer" }}><Plus size={20} strokeWidth={2} /></button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 10 }}>
              {SEM.map((w, i) => (
                <div key={i} style={{ textAlign: "center", fontSize: 12.5, color: "var(--text-faint)", fontWeight: 500 }}>{w}</div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridTemplateRows: "repeat(6, 48px)", alignContent: "start" }}>
              {cells.map((c, i) => {
                if (!c.inMonth)
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 16, color: "var(--text-ghost)", fontVariantNumeric: "tabular-nums" }}>{c.d}</span>
                    </div>
                  );
                const iso = `${month}-${pad(c.d)}`;
                const ds = shiftsDoDia(iso);
                const isToday = iso === hoje;
                const isBulk = selMode && bulkDays.includes(iso);
                const isSel = iso === selDay && !isToday && !isBulk;
                const dark = isBulk || isToday;
                return (
                  // número SEMPRE centralizado; bolinha é overlay absoluto (não consome altura) → linhas idênticas
                  <button key={i} onClick={() => (selMode ? toggleBulkDay(iso) : setSelDay(selDay === iso ? null : iso))} style={{ position: "relative", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SF }}>
                    <span style={{ width: 34, height: 34, borderRadius: 999, display: "grid", placeItems: "center", fontSize: 16, fontWeight: dark ? 700 : 400, fontVariantNumeric: "tabular-nums", background: dark ? "var(--primary)" : isSel ? "var(--navy-tint)" : "transparent", color: dark ? "#fff" : "var(--text)" }}>{c.d}</span>
                    {ds.length > 0 && (
                      <span style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4 }}>
                        {ds.slice(0, 3).map((s, k) => (<span key={k} style={{ width: 6, height: 6, borderRadius: 999, background: s.cor || CORES[0] }} />))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dia selecionado */}
          {selDay && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="eyebrow" style={{ margin: 0 }}>{ddmm(selDay)} — {selShifts.length} {selShifts.length === 1 ? "plantão" : "plantões"}</div>
              {selShifts.map((s) => <ShiftRow key={s.id} s={s} />)}
              <button className="btn btn-ghost btn-sm" onClick={() => novoNoDia(selDay)} style={{ alignSelf: "flex-start" }}>
                <Plus size={15} /> Novo plantão em {ddmm(selDay)}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {shifts.length === 0 ? (
            <div className="muted" style={{ textAlign: "center", padding: 24 }}>Nenhum plantão neste mês.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {shifts.map((s) => <ShiftRow key={s.id} s={s} />)}
            </div>
          )}
        </>
      )}

      {selMode && view === "cal" && bulkDays.length > 0 && (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px" }}>
          <span style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{bulkDays.length} {bulkDays.length === 1 ? "dia" : "dias"}</span>
          <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(true); setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }}><Plus size={15} /> Lançar plantão nos dias</button>
        </div>
      )}
      {selMode && view === "lista" && bulkShifts.length > 0 && (
        <div className="card" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "10px 12px" }}>
          <span style={{ flex: 1, fontWeight: 700, fontSize: 13, minWidth: 70 }}>{bulkShifts.length} selecionado{bulkShifts.length === 1 ? "" : "s"}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => bulkPago(true)} style={{ color: "var(--green)" }}><Check size={14} /> Pagos</button>
          <button className="btn btn-ghost btn-sm" onClick={() => bulkPago(false)}>A receber</button>
          <button className="btn btn-ghost btn-sm" onClick={bulkRemover} style={{ color: "var(--red)" }}><Trash2 size={14} /></button>
        </div>
      )}

      {!selMode && (
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)} style={{ minHeight: 46 }}>
          <Plus size={18} /> Novo plantão
        </button>
      )}

      {showForm && (
        <div ref={formRef} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {modelos.length > 0 && (
            <div>
              <label className="label">Modelos</label>
              <div className="scroll-x">
                {modelos.map((m) => (
                  <button key={m.local} className="chip" onClick={() => aplicarModelo(m)} style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: m.cor }} /> {m.local}
                    <X size={12} onClick={(e) => { e.stopPropagation(); removerModelo(m.local); }} style={{ opacity: 0.5 }} />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label className="label">Data</label>
              {bulkDays.length > 0 ? (
                <div className="field" style={{ minHeight: 46, display: "flex", alignItems: "center", color: "var(--text-dim)", fontWeight: 600 }}>{bulkDays.length} dias selecionados</div>
              ) : (
                <input type="date" className="field" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} style={{ minHeight: 46 }} />
              )}
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
          <div>
            <label className="label">Dia de pagamento (opcional)</label>
            <input className="field" inputMode="numeric" placeholder="ex.: 10 — usado na previsão de recebimento" value={f.diaPag} onChange={(e) => setF({ ...f, diaPag: e.target.value.replace(/\D/g, "").slice(0, 2) })} style={{ minHeight: 46 }} />
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
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={salvarModelo} style={{ flex: "0 0 auto", minHeight: 48 }}>Salvar modelo</button>
            <button className="btn btn-primary" disabled={saving} onClick={salvar} style={{ flex: 1, minHeight: 48 }}>{saving ? "Salvando…" : bulkDays.length ? `Lançar em ${bulkDays.length} dias` : "Salvar plantão"}</button>
          </div>
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
        <div style={{ textAlign: "center", padding: "32px 24px", color: "var(--text-dim)", fontSize: 14, lineHeight: 1.5, maxWidth: "32ch", marginInline: "auto" }}>
          Nenhuma passagem ativa. Toque em <b>+ Nova passagem</b> para registrar o primeiro paciente.
        </div>
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
