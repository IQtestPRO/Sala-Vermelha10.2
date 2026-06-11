import { NextRequest } from "next/server";
import { ensureTables, getDb } from "@/lib/db";
import { requireUser, errorResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  caso_criado: "Caso criado",
  caso_respondido: "Caso respondido",
  pcr_conduzida: "PCR conduzida",
  conduta_consultada_aplicada: "Conduta aplicada",
};
const MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// HTML de impressão (window.print) — "Exportar PDF" sem dependência nova.
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();
    const r = await db.execute({
      sql: "SELECT kind, titulo, meta, created_at FROM logbook_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 1000",
      args: [user.id],
    });
    const rows = r.rows as unknown as { kind: string; titulo: string; meta: string | null; created_at: number }[];

    const grupos: { mes: string; itens: typeof rows }[] = [];
    for (const e of rows) {
      const d = new Date(Number(e.created_at));
      const m = `${MES[d.getMonth()]} de ${d.getFullYear()}`;
      const last = grupos[grupos.length - 1];
      if (last && last.mes === m) last.itens.push(e);
      else grupos.push({ mes: m, itens: [e] });
    }
    const tot = (k: string) => rows.filter((e) => e.kind === k).length;
    const fmtData = (ts: number) => new Date(Number(ts)).toLocaleDateString("pt-BR");

    const corpo = grupos
      .map(
        (g) => `
      <h2>${esc(g.mes)}</h2>
      <table>
        <thead><tr><th style="width:90px">Data</th><th style="width:150px">Registro</th><th>Descrição</th></tr></thead>
        <tbody>
          ${g.itens
            .map((e) => {
              let extra = "";
              try {
                const m = e.meta ? JSON.parse(e.meta) : null;
                if (m?.aderencia) extra = ` <span class="tag">aderência ${esc(String(m.aderencia))}</span>`;
              } catch {
                /* noop */
              }
              return `<tr><td>${fmtData(e.created_at)}</td><td>${esc(KIND_LABEL[e.kind] ?? e.kind)}</td><td>${esc(e.titulo)}${extra}</td></tr>`;
            })
            .join("")}
        </tbody>
      </table>`
      )
      .join("");

    const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Logbook — ${esc(user.name)}</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Arial, sans-serif; color: #15294C; margin: 32px; }
  h1 { font-size: 22px; margin: 0; } .sub { color: #5b6b85; font-size: 13px; margin: 4px 0 4px; }
  .tot { font-size: 13px; margin: 10px 0 22px; color: #15294C; font-weight: 600; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.06em; color: #5b6b85; margin: 24px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th { text-align: left; border-bottom: 2px solid #15294C; padding: 6px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  td { border-bottom: 1px solid #e2e6ee; padding: 6px 8px; vertical-align: top; }
  .tag { font-size: 10.5px; color: #5b6b85; border: 1px solid #cdd5e1; border-radius: 8px; padding: 1px 6px; }
  .foot { margin-top: 28px; font-size: 11px; color: #8294a8; }
  @media print { body { margin: 14mm; } }
</style></head>
<body>
  <h1>Logbook clínico — STAT</h1>
  <div class="sub">${esc(user.name)}${user.crm ? ` · CRM ${esc(String(user.crm))}` : ""} · emitido em ${new Date().toLocaleDateString("pt-BR")}</div>
  <div class="tot">Casos criados: ${tot("caso_criado")} · Casos respondidos: ${tot("caso_respondido")} · PCRs conduzidas: ${tot("pcr_conduzida")}</div>
  ${corpo || "<p>Nenhum registro ainda.</p>"}
  <p class="foot">Registro automático gerado pelo STAT. Casos pseudonimizados — este documento não contém dados identificáveis de paciente (LGPD). Apoio à comprovação de experiência; confira com as normas da sua instituição/residência.</p>
  <script>window.print()</script>
</body></html>`;

    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  } catch (err) {
    return errorResponse(err);
  }
}
