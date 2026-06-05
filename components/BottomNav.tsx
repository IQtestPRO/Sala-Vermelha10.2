"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, BookOpenText, Inbox } from "lucide-react";
import type { Role } from "@/lib/db";

type Item = { href: string; label: string; icon: React.ReactNode };

export default function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();

  const items: Item[] =
    role === "responder"
      ? [
          { href: "/queue", label: "Fila", icon: <Inbox size={22} /> },
          { href: "/condutas", label: "Condutas", icon: <BookOpenText size={22} /> },
        ]
      : [
          { href: "/feed", label: "Casos", icon: <Home size={22} /> },
          { href: "/new-case", label: "Novo", icon: <PlusCircle size={22} /> },
          { href: "/condutas", label: "Condutas", icon: <BookOpenText size={22} /> },
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
