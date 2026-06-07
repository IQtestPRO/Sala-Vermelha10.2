"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import HfIcon from "@/components/icons/HfIcon";
import type { Role } from "@/lib/db";

type Item = { href: string; label: string; icon: React.ReactNode };

const RAPIDO: Item = { href: "/rapido", label: "Rápida", icon: <HfIcon name="nav-rapida" size={26} /> };

export default function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();

  const items: Item[] =
    role === "responder"
      ? [
          RAPIDO,
          { href: "/queue", label: "Fila", icon: <HfIcon name="nav-fila" size={26} /> },
          { href: "/feed", label: "Casos", icon: <HfIcon name="nav-casos" size={26} /> },
          { href: "/new-case", label: "Novo", icon: <HfIcon name="nav-novo" size={26} /> },
          { href: "/condutas", label: "Especialidades", icon: <HfIcon name="nav-condutas" size={26} /> },
        ]
      : [
          RAPIDO,
          { href: "/feed", label: "Casos", icon: <HfIcon name="nav-casos" size={26} /> },
          { href: "/new-case", label: "Novo", icon: <HfIcon name="nav-novo" size={26} /> },
          { href: "/condutas", label: "Especialidades", icon: <HfIcon name="nav-condutas" size={26} /> },
        ];

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
