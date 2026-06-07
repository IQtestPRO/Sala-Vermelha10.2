// Validação de CPF — LOCAL e gratuita (dígitos verificadores).
// FUTURO: trocar por verificação via API (Serpro/etc.) mantendo ESTA assinatura.
// Toda validação de CPF do app passa por aqui — nunca validar inline.

export function normalizeCpf(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

export function validateCpf(raw: string): boolean {
  const cpf = normalizeCpf(raw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // 111.111.111-11 etc.

  const dv = (base: string, pesoInicial: number): number => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (pesoInicial - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const d1 = dv(cpf.slice(0, 9), 10);
  if (d1 !== Number(cpf[9])) return false;
  const d2 = dv(cpf.slice(0, 10), 11);
  if (d2 !== Number(cpf[10])) return false;
  return true;
}

// Formata 11 dígitos como 000.000.000-00 (cosmético).
export function formatCpf(raw: string): string {
  const c = normalizeCpf(raw).slice(0, 11);
  return c.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
}
