"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IcRapida, IcFila, IcCasos, IcNovo, IcCondutas } from "@/components/icons/StatIcons";
import type { Role } from "@/lib/db";

type Item = { href: string; label: string; icon: React.ReactNode };

const RAPIDO: Item = { href: "/rapido", label: "Rápida", icon: <IcRapida size={23} /> };

export default function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();

  const items: Item[] =
    role === "responder"
      ? [
          RAPIDO,
          { href: "/queue", label: "Fila", icon: <IcFila size={23} /> },
          { href: "/feed", label: "Casos", icon: <IcCasos size={23} /> },
          { href: "/new-case", label: "Novo", icon: <IcNovo size={23} /> },
          { href: "/condutas", label: "Condutas", icon: <IcCondutas size={23} /> },
        ]
      : [
          RAPIDO,
          { href: "/feed", label: "Casos", icon: <IcCasos size={23} /> },
          { href: "/new-case", label: "Novo", icon: <IcNovo size={23} /> },
          { href: "/condutas", label: "Condutas", icon: <IcCondutas size={23} /> },
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
