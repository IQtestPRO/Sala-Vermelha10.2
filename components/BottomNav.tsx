"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import HfIcon from "@/components/icons/HfIcon";

type Item = { href: string; label: string; icon: React.ReactNode };

// Abas únicas (Fila foi fundida em "Casos", que adapta por papel).
const items: Item[] = [
  { href: "/rapido", label: "Rápida", icon: <HfIcon name="nav-rapida" size={26} /> },
  { href: "/feed", label: "Casos", icon: <HfIcon name="nav-casos" size={26} /> },
  { href: "/chat", label: "STAT IA", icon: <Sparkles size={24} /> },
  { href: "/new-case", label: "Novo", icon: <HfIcon name="nav-novo" size={26} /> },
  { href: "/condutas", label: "Especialidades", icon: <HfIcon name="nav-condutas" size={26} /> },
];

export default function BottomNav() {
  const pathname = usePathname();

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
    </nav>
  );
}
