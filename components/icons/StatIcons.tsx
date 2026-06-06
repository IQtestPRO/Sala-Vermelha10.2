import type { SVGProps } from "react";

// Ícones próprios do STAT — estilo linha consistente (24px, traço 2, cantos redondos),
// com assinatura de ECG na ação principal. currentColor herda a cor do contexto.
type P = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 24, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Ação rápida — a linha de ECG (assinatura da marca). */
export function IcRapida(p: P) {
  return (
    <Base {...p}>
      <path d="M2 12h4l1.8-6 3 12 2.2-9 1.6 5H22" />
    </Base>
  );
}

/** Fila — casos empilhados aguardando (lista). */
export function IcFila(p: P) {
  return (
    <Base {...p}>
      <rect x="3" y="4.5" width="18" height="15" rx="3" />
      <path d="M3 10.5h5l1.4 2.4h5.2L21 10.5" />
    </Base>
  );
}

/** Casos — documento clínico com um pulso. */
export function IcCasos(p: P) {
  return (
    <Base {...p}>
      <path d="M6 3h7.5L19 8.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M13.5 3v5H19" />
      <path d="M7.5 15h2l1-2 1.6 3.2 1-1.7h2.4" />
    </Base>
  );
}

/** Novo caso — criar (squircle + cruz médica). */
export function IcNovo(p: P) {
  return (
    <Base {...p}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5.5" />
      <path d="M12 8.2v7.6M8.2 12h7.6" />
    </Base>
  );
}

/** Condutas — livro/protocolo aberto. */
export function IcCondutas(p: P) {
  return (
    <Base {...p}>
      <path d="M12 6.5C10.5 5.2 8.4 4.5 6 4.5c-1.1 0-2.1.1-3 .4v13.2c.9-.3 1.9-.4 3-.4 2.4 0 4.5.7 6 2 1.5-1.3 3.6-2 6-2 1.1 0 2.1.1 3 .4V4.9c-.9-.3-1.9-.4-3-.4-2.4 0-4.5.7-6 2z" />
      <path d="M12 6.5v13.6" />
    </Base>
  );
}
