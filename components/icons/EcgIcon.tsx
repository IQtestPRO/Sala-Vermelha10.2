// Traçado de ECG vermelho — ícone da STAT IA (acento único da marca: vermelho = ECG/urgência).
export default function EcgIcon({ size = 24, stroke = 2.2 }: { size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M2 12h4.5L9 6.5 12.5 17.5 15 12h7" stroke="#E11D2A" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
