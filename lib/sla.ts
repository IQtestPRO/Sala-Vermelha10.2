import { SLA_MS } from "./constants";

// Janela de SLA: 10 minutos para responder o caso.
export { SLA_MS };

export function computeSlaExpiry(createdAt: number): number {
  return createdAt + SLA_MS;
}

export type SlaPhase = "ok" | "warn" | "danger" | "expired";

// Fase visual do contador a partir do tempo restante (ms).
export function slaPhase(remainingMs: number): SlaPhase {
  if (remainingMs <= 0) return "expired";
  if (remainingMs <= 2 * 60 * 1000) return "danger";
  if (remainingMs <= 5 * 60 * 1000) return "warn";
  return "ok";
}

// Formata mm:ss (nunca negativo).
export function formatCountdown(remainingMs: number): string {
  const total = Math.max(0, Math.floor(remainingMs / 1000));
  const mm = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const ss = (total % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}
