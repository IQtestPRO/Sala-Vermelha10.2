// Gerador de id curto, ordenavel por tempo — mesmo padrao usado nos outros projetos.
export function newId(prefix = ""): string {
  const core = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  return prefix ? `${prefix}_${core}` : core;
}
