"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Droplet, FlaskConical, Trash2, Plus, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { DROGAS_INFUSAO, type DrogaInfusao } from "@/lib/drogasInfusao";
import type { Infusao } from "@/lib/condutas";
import { calcInfusao } from "@/lib/doseCalculator";
import { apiGet, apiPost } from "@/lib/client";

type Dilution = { id: string; droga_nome: string; label: string; qty: number; qty_unit: string; volume_final_ml: number; conc: number; conc_unit: string; is_active: boolean };

const num = (v: string): number | undefined => {
  const x = Number(String(v).replace(",", "."));
  return Number.isFinite(x) && x > 0 ? x : undefined;
};
const fmt = (x: number, d = 1) => {
  const r = Math.round(x * 10 ** d) / 10 ** d;
  return String(r).replace(".", ",");
};

// Unidades por droga (derivadas da diluição padrão).
const concUnit = (d: DrogaInfusao): "mcg/mL" | "UI/mL" | "mg/mL" =>
  d.infusao.concMcgMl != null ? "mcg/mL" : d.infusao.concUiMl != null ? "UI/mL" : "mg/mL";
const qtyUnit = (d: DrogaInfusao): "mg" | "UI" => (d.infusao.concUiMl != null ? "UI" : "mg");
const defaultConc = (d: DrogaInfusao): number => d.infusao.concMcgMl ?? d.infusao.concUiMl ?? d.infusao.concMgMl ?? 0;
// Concentração resultante: mcg/mL precisa converter mg→mcg; UI/mL e mg/mL são diretos.
function calcConc(d: DrogaInfusao, qty: number, volume: number): number {
  return concUnit(d) === "mcg/mL" ? (qty * 1000) / volume : qty / volume;
}
function infComConc(d: DrogaInfusao, conc: number): Infusao {
  const inf: Infusao = { ...d.infusao };
  const u = concUnit(d);
  if (u === "mcg/mL") inf.concMcgMl = conc;
  else if (u === "UI/mL") inf.concUiMl = conc;
  else inf.concMgMl = conc;
  inf.concentracao = `${fmt(conc)} ${u}`;
  return inf;
}
// Guard-rail: taxa fora do plausível p/ adulto.
function foraDoUsual(mlh: string): boolean {
  const nums = (mlh.match(/[\d.,]+/g) || []).map((s) => Number(s.replace(".", "").replace(",", ".")));
  if (!nums.length) return false;
  const min = Math.min(...nums), max = Math.max(...nums);
  return min < 0.5 || max > 100;
}

export default function CalcInfusao() {
  const [peso, setPeso] = useState("");
  const [aberto, setAberto] = useState<string | null>(null);
  const [dils, setDils] = useState<Dilution[]>([]);
  const [form, setForm] = useState<{ droga: string; qty: string; volume: string; label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const p = num(peso);

  const load = useCallback(async () => {
    try {
      const r = await apiGet<{ dilutions: Dilution[] }>("/api/dilutions");
      setDils(r.dilutions);
    } catch {
      /* offline / sem login — usa padrão */
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const ativaDe = (nome: string) => dils.find((x) => x.droga_nome === nome && x.is_active);
  const presetsDe = (nome: string) => dils.filter((x) => x.droga_nome === nome);

  async function ativar(droga: string, id: string) {
    setDils((arr) => arr.map((x) => (x.droga_nome === droga ? { ...x, is_active: x.id === id } : x)));
    await fetch("/api/dilutions", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ droga_nome: droga, id }) });
  }
  async function remover(d: Dilution) {
    setDils((arr) => arr.filter((x) => x.id !== d.id));
    await fetch(`/api/dilutions?id=${d.id}`, { method: "DELETE" });
  }
  async function salvar(drug: DrogaInfusao) {
    if (!form) return;
    const qty = num(form.qty), volume = num(form.volume);
    if (!qty || !volume) return toast.error("Preencha quantidade e volume.");
    if (volume < 1) return toast.error("Volume final muito baixo.");
    const conc = calcConc(drug, qty, volume);
    setSaving(true);
    try {
      await apiPost("/api/dilutions", {
        droga_nome: drug.nome,
        label: form.label.trim() || "Minha diluição",
        qty,
        qty_unit: qtyUnit(drug),
        volume_final_ml: volume,
        conc,
        conc_unit: concUnit(drug),
      });
      toast.success("Diluição salva e ativada.");
      setForm(null);
      load();
    } catch {
      toast.error("Não consegui salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card-2" style={{ display: "flex", alignItems: "center", gap: 10, boxShadow: "none" }}>
        <Droplet size={18} color="var(--primary)" />
        <span className="muted" style={{ fontSize: 13, fontWeight: 700 }}>Peso</span>
        <div style={{ position: "relative", width: 110 }}>
          <input className="field" inputMode="decimal" placeholder="kg" value={peso} onChange={(e) => setPeso(e.target.value)} style={{ minHeight: 44, paddingRight: 32 }} />
          <span className="faint" style={{ position: "absolute", right: 12, top: 13, fontSize: 12 }}>kg</span>
        </div>
        <span className="faint" style={{ fontSize: 11.5, flex: 1 }}>Calcula o mL/h dos fármacos conforme o peso.</span>
      </div>

      <div className="card" style={{ padding: "2px 14px" }}>
        {DROGAS_INFUSAO.map((d) => {
          const ativa = ativaDe(d.nome);
          const conc = ativa ? ativa.conc : defaultConc(d);
          const effInf = ativa ? infComConc(d, ativa.conc) : d.infusao;
          const inf = calcInfusao(effInf, p);
          const open = aberto === d.nome;
          const alerta = !!(p && inf && foraDoUsual(inf.mlh));
          return (
            <div key={d.nome} style={{ borderBottom: "1px solid var(--border)" }}>
              <button className="list-row" style={{ borderBottom: "none" }} onClick={() => { setAberto(open ? null : d.nome); setForm(null); }}>
                <span style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <span style={{ display: "block", fontWeight: 800, fontSize: 15 }}>{d.nome}</span>
                  <span className="faint" style={{ display: "block", fontSize: 12 }}>{d.classe} · {fmt(conc)} {concUnit(d)}</span>
                </span>
                {inf ? (
                  <span className="data" style={{ flex: "0 0 auto", color: "var(--primary-press)", fontWeight: 800, fontSize: 14 }}>{inf.mlh}</span>
                ) : (
                  <ChevronRight size={18} className="faint" style={{ flex: "0 0 auto", transform: open ? "rotate(90deg)" : "none" }} />
                )}
              </button>

              {/* Badge: SEMPRE diz com qual diluição calculou */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 2px 6px", fontSize: 11.5 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, fontWeight: 700, background: ativa ? "color-mix(in srgb, var(--primary) 12%, var(--surface))" : "var(--surface-sunken)", color: ativa ? "var(--primary-press)" : "var(--text-dim)" }}>
                  {ativa ? `Sua diluição: ${fmt(ativa.qty)} ${ativa.qty_unit}/${fmt(ativa.volume_final_ml, 0)} mL (${fmt(ativa.conc)} ${ativa.conc_unit})` : `Diluição padrão STAT (${fmt(defaultConc(d))} ${concUnit(d)})`}
                </span>
              </div>

              {alerta && (
                <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "0 2px 8px", fontSize: 11.5, color: "var(--red)", fontWeight: 700 }}>
                  <AlertTriangle size={13} /> Confira a diluição — taxa fora do usual.
                </div>
              )}

              {open && (
                <div style={{ padding: "0 2px 12px", display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                  <div>Diluição padrão: <b>{d.infusao.diluicao}</b></div>
                  {d.infusao.inicio && <div className="faint">Início: {d.infusao.inicio}</div>}
                  {inf ? (
                    <div className="data" style={{ color: "var(--primary-press)", fontWeight: 800, fontSize: 15 }}>{inf.faixaLabel} → {inf.mlh}</div>
                  ) : (
                    <div className="faint" style={{ fontSize: 11.5 }}>Informe o peso acima para ver os mL/h.</div>
                  )}

                  {/* Minha diluição: presets */}
                  <div className="label" style={{ margin: "4px 0 0" }}>Diluições</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    <button className={`chip ${!ativa ? "chip-on" : ""}`} onClick={() => ativar(d.nome, "padrao")} style={{ flex: "0 0 auto" }}>Padrão STAT</button>
                    {presetsDe(d.nome).map((x) => (
                      <span key={x.id} className={`chip ${x.is_active ? "chip-on" : ""}`} style={{ flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <button onClick={() => ativar(d.nome, x.id)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: 700, padding: 0 }}>
                          {x.is_active && <Check size={11} style={{ marginRight: 3, verticalAlign: "-1px" }} />}{x.label}
                        </button>
                        <Trash2 size={12} onClick={() => remover(x)} style={{ opacity: 0.55, cursor: "pointer" }} />
                      </span>
                    ))}
                  </div>

                  {form?.droga === d.nome ? (
                    <div className="z-sunken" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <label className="label">Quantidade da droga</label>
                          <div style={{ position: "relative" }}>
                            <input className="field" inputMode="decimal" placeholder="ex.: 20" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} style={{ minHeight: 44, paddingRight: 38 }} />
                            <span className="faint" style={{ position: "absolute", right: 12, top: 13, fontSize: 12 }}>{qtyUnit(d)}</span>
                          </div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label className="label">Volume final da solução</label>
                          <div style={{ position: "relative" }}>
                            <input className="field" inputMode="decimal" placeholder="ex.: 100" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} style={{ minHeight: 44, paddingRight: 38 }} />
                            <span className="faint" style={{ position: "absolute", right: 12, top: 13, fontSize: 12 }}>mL</span>
                          </div>
                        </div>
                      </div>
                      <div className="faint" style={{ fontSize: 11, lineHeight: 1.4 }}>Volume da solução PRONTA (droga + diluente), não o volume do diluente.</div>
                      {(() => {
                        const q = num(form.qty), v = num(form.volume);
                        return q && v ? (
                          <div className="data" style={{ fontWeight: 800, fontSize: 15, color: "var(--primary-press)" }}>{fmt(q)} {qtyUnit(d)} / {fmt(v, 0)} mL = {fmt(calcConc(d, q, v))} {concUnit(d)}</div>
                        ) : (
                          <div className="faint" style={{ fontSize: 12 }}>A concentração aparece aqui ao preencher.</div>
                        );
                      })()}
                      <input className="field" placeholder="Rótulo (ex.: Hospital São Lucas)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} style={{ minHeight: 44 }} />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setForm(null)}>Cancelar</button>
                        <button className="btn btn-primary btn-sm" disabled={saving} onClick={() => salvar(d)} style={{ flex: 1 }}>{saving ? "Salvando…" : "Salvar diluição"}</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={() => setForm({ droga: d.nome, qty: "", volume: "", label: "" })} style={{ alignSelf: "flex-start" }}>
                      <Plus size={14} /> Nova diluição
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="faint" style={{ fontSize: 11, lineHeight: 1.4 }}>
        <FlaskConical size={12} style={{ verticalAlign: "-2px", marginRight: 3 }} />
        Cada serviço dilui diferente — cadastre a SUA diluição. Sempre confira o protocolo local antes de programar a bomba.
      </div>
    </div>
  );
}
