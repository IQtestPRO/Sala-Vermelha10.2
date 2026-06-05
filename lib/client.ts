import type { Role, UserStatus } from "./db";

export type Me = {
  id: string;
  name: string;
  crm: string;
  specialty: string;
  role: Role;
  status: UserStatus;
};

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data?.error || "error");
  return data as T;
}

export async function apiPost<T>(url: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...(headers || {}) },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data?.error || "error");
  return data as T;
}

// Mensagens amigaveis para codigos de erro do servidor.
export function friendlyError(code: string): string {
  const map: Record<string, string> = {
    invalid_input: "Confira os campos e tente de novo.",
    crm_taken: "Ja existe cadastro com esse CRM.",
    invalid_credentials: "CRM ou senha incorretos.",
    unauthorized: "Sessao expirada. Entre novamente.",
    forbidden: "Voce nao tem permissao para isso.",
    not_approved: "Seu cadastro ainda nao foi aprovado.",
    already_claimed: "Outro plantonista ja assumiu este caso.",
    disabled: "Conta desativada. Fale com o administrador.",
    internal_error: "Erro no servidor. Tente novamente.",
  };
  return map[code] || "Algo deu errado. Tente novamente.";
}
