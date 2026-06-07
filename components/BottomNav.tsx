"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, CalendarClock } from "lucide-react";
import HfIcon from "@/components/icons/HfIcon";
import EcgIcon from "@/components/icons/EcgIcon";
import type { Me } from "@/lib/client";

type Item = { href: string; label: string; icon: React.ReactNode };

// Toolkit clínico: Protocolos · Calculadoras · STAT IA · Plantão (+ avatar Perfil).
// Casos/Novo (teleconsulta) saíram do menu mas as rotas continuam existindo.
// STAT IA usa o traçado de ECG vermelho — único item vermelho da nav (acento da marca).
const items: Item[] = [
  { href: "/condutas", label: "Protocolos", icon: <HfIcon name="nav-condutas" size={26} /> },
  { href: "/calculadoras", label: "Calculadoras", icon: <Calculator size={24} /> },
  { href: "/chat", label: "STAT IA", icon: <EcgIcon size={24} /> },
  { href: "/plantao", label: "Plantão", icon: <CalendarClock size={24} /> },
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
        const isChat = it.href === "/chat"; // único item vermelho (acento da marca)
        return (
          <Link key={it.href} href={it.href} className={`nav-item ${on ? "nav-item-on" : ""}`}>
            <span
              className="nav-ic"
              style={
                isChat
                  ? {
                      opacity: on ? 1 : 0.55,
                      background: on ? "color-mix(in srgb, #E11D2A 14%, transparent)" : "transparent",
                      filter: on ? "drop-shadow(0 0 4px rgba(225,29,42,.45))" : "none",
                    }
                  : undefined
              }
            >
              {it.icon}
            </span>
            <span style={isChat && on ? { color: "#E11D2A" } : undefined}>{it.label}</span>
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
