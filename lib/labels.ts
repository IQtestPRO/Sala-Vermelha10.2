import type { CaseStatus } from "./db";

export function statusLabel(s: CaseStatus): string {
  const map: Record<string, string> = {
    open: "Aguardando",
    claimed: "Em avaliação",
    answered: "Respondido",
    closed: "Encerrado",
    expired: "Expirado",
  };
  return map[s] || s;
}

export function statusBadgeClass(s: CaseStatus): string {
  return `badge badge-${s}`;
}

export function sexoLabel(s?: string | null): string {
  if (s === "M") return "M";
  if (s === "F") return "F";
  if (s === "O") return "Outro";
  return "—";
}

export function timeAgo(ts: number, now: number): string {
  const diff = Math.max(0, now - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return `há ${d} d`;
}
