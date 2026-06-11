import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { ensureTables, getDb } from "@/lib/db";
import { requireUser, errorResponse } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Card 9:16 (1080×1920) do resumo do mês — identidade STAT, pronto p/ stories.
// SEM dados de paciente: só agregados do próprio médico.
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    await ensureTables();
    const db = getDb();
    const q = new URL(req.url).searchParams.get("month");
    const month = q && /^\d{4}-\d{2}$/.test(q) ? q : new Date().toISOString().slice(0, 7);
    const [y, m] = month.split("-").map(Number);
    const ini = Date.UTC(y, m - 1, 1) - 3 * 3600_000;
    const fim = Date.UTC(y, m, 1) - 3 * 3600_000;

    const casos = await db.execute({ sql: "SELECT COUNT(*) AS n FROM cases WHERE requester_id=? AND created_at>=? AND created_at<?", args: [user.id, ini, fim] });
    const resps = await db.execute({ sql: "SELECT COUNT(*) AS n FROM cases WHERE claimed_by=? AND answered_at>=? AND answered_at<?", args: [user.id, ini, fim] });
    const pcrs = await db.execute({ sql: "SELECT COUNT(*) AS n FROM pcr_reports WHERE user_id=? AND created_at>=? AND created_at<?", args: [user.id, ini, fim] });
    const fin = await db.execute({ sql: "SELECT COALESCE(SUM(CASE WHEN pago=1 THEN valor ELSE 0 END),0) AS r FROM shifts WHERE user_id=? AND data LIKE ?", args: [user.id, month + "%"] });

    const metricas = [
      { n: Number(casos.rows[0]?.n ?? 0), l: "CASOS CONDUZIDOS" },
      { n: Number(resps.rows[0]?.n ?? 0), l: "CASOS RESPONDIDOS" },
      { n: Number(pcrs.rows[0]?.n ?? 0), l: "PCRs CONDUZIDAS" },
    ];
    const recebido = Number(fin.rows[0]?.r ?? 0);

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "#101e3a",
            color: "#fff",
            padding: "110px 90px",
            fontFamily: "sans-serif",
          }}
        >
          {/* wordmark + linha vital */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 110, fontWeight: 900, letterSpacing: -4 }}>STAT</div>
            <svg width="900" height="70" viewBox="0 0 900 70">
              <path
                d="M0 35 H310 L340 35 L365 12 L395 62 L425 22 L450 35 H560 L585 28 L605 44 L625 35 H900"
                fill="none"
                stroke="#ff4d5a"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div style={{ display: "flex", fontSize: 40, color: "#9fb0cc", marginTop: 60, letterSpacing: 6 }}>
            {`RESUMO DO PLANTÃO — ${MES[m - 1].toUpperCase()} ${y}`}
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 90, gap: 70, flex: 1 }}>
            {metricas.map((x) => (
              <div key={x.l} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", fontSize: 150, fontWeight: 800, lineHeight: 1 }}>{String(x.n)}</div>
                <div style={{ display: "flex", fontSize: 34, color: "#8fa1bd", letterSpacing: 8, marginTop: 10 }}>{x.l}</div>
              </div>
            ))}
            {recebido > 0 && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", fontSize: 96, fontWeight: 800, lineHeight: 1 }}>
                  {`R$ ${recebido.toLocaleString("pt-BR")}`}
                </div>
                <div style={{ display: "flex", fontSize: 34, color: "#8fa1bd", letterSpacing: 8, marginTop: 10 }}>RECEBIDO NO MÊS</div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontSize: 44, fontWeight: 800 }}>
              Do it <span style={{ color: "#ff4d5a", marginLeft: 14 }}>stat</span>.
            </div>
            <div style={{ display: "flex", fontSize: 30, color: "#6f80a0" }}>statanalysis.vercel.app</div>
          </div>
        </div>
      ),
      { width: 1080, height: 1920 }
    );
  } catch (err) {
    return errorResponse(err);
  }
}
