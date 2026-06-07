import { redirect } from "next/navigation";

// A calculadora virou a aba "Calculadoras" (escores + medicações + pediatria + renal).
export default function CalculadoraPage() {
  redirect("/calculadoras");
}
