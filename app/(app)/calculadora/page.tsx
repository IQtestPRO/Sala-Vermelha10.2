import { redirect } from "next/navigation";

// A calculadora deixou de ser uma página solta: agora vive DENTRO da calculadora
// de dose de cada conduta (idade/peso → doses adaptadas + painel pediátrico + renal do idoso).
export default function CalculadoraPage() {
  redirect("/condutas");
}
