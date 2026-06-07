import { redirect } from "next/navigation";

// A "Fila" foi fundida em "Casos" (/feed), que mostra a fila do plantão + os casos do usuário.
export default function QueuePage() {
  redirect("/feed");
}
