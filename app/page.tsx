import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const c = await cookies();
  if (c.get(SESSION_COOKIE)?.value) {
    redirect("/feed");
  }
  redirect("/login");
}
