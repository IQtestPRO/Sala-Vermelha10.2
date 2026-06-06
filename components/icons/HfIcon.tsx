// Ícone gerado no Higgsfield (Nano Banana Pro) — PNG navy transparente em public/icons.
// .hf-icon adapta ao dark mode via filtro (vira silhueta clara).
export default function HfIcon({
  name,
  size = 24,
  style,
}: {
  name: string;
  size?: number;
  style?: React.CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/icons/${name}.png`}
      alt=""
      width={size}
      height={size}
      className="hf-icon"
      draggable={false}
      style={{ width: size, height: size, ...style }}
    />
  );
}
