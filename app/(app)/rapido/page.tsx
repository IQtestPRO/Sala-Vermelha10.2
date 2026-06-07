import { redirect } from "next/navigation";

// "Ação rápida" foi fundida em "Condutas" (mesma base, mesmo detalhe).
// Abre direto no filtro de ação rápida.
export default function RapidoPage() {
  redirect("/condutas?rapida=1");
}
