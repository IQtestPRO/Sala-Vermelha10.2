"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import HfIcon from "@/components/icons/HfIcon";
import type { Me } from "@/lib/client";

type Item = { href: string; label: string; icon: React.ReactNode };

// Abas únicas. "Fila" foi fundida em "Casos"; "Ação rápida" foi fundida em "Condutas"
// (ambas abriam o mesmo detalhe de conduta). + avatar de Perfil no fim.
const items: Item[] = [
  { href: "/feed", label: "Casos", icon: <HfIcon name="nav-casos" size={26} /> },
  { href: "/new-case", label: "Novo", icon: <HfIcon name="nav-novo" size={26} /> },
  { href: "/chat", label: "STAT IA", icon: <Sparkles size={24} /> },
  { href: "/condutas", label: "Condutas", icon: <HfIcon name="nav-condutas" size={26} /> },
];

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}

export default function BottomNav({ me }: { me: Me }) {
  const pathname = usePathname();
  const onPerfil = pathname === "/perfil";

  return (
    <nav className="bottom-nav">
      {items.map((it) => {
        const on = pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link key={it.href} href={it.href} className={`nav-item ${on ? "nav-item-on" : ""}`}>
            <span className="nav-ic">{it.icon}</span>
            <span>{it.label}</span>
          </Link>
        );
      })}
      <Link href="/perfil" className={`nav-item ${onPerfil ? "nav-item-on" : ""}`}>
        <span className={`nav-avatar ${onPerfil ? "on" : ""}`}>
          {me.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={me.avatar_url} alt="" />
          ) : (
            <span className="nav-avatar-ini">{initials(me.name)}</span>
          )}
        </span>
        <span>Perfil</span>
      </Link>
    </nav>
  );
}
