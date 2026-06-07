"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, CalendarClock } from "lucide-react";
import HfIcon from "@/components/icons/HfIcon";
import EcgIcon from "@/components/icons/EcgIcon";
import type { Me } from "@/lib/client";

type Item = { href: string; label: string; icon: React.ReactNode; novo?: boolean };

// Toolkit clínico: Protocolos · Calculadoras · STAT IA · Plantão (+ avatar Perfil).
// Casos/Novo (teleconsulta) saíram do menu mas as rotas continuam existindo.
// STAT IA usa o traçado de ECG vermelho — único item vermelho da nav (acento da marca).
const items: Item[] = [
  { href: "/condutas", label: "Protocolos", icon: <HfIcon name="nav-condutas" size={26} /> },
  { href: "/calculadoras", label: "Calculadoras", icon: <Calculator size={24} /> },
  { href: "/chat", label: "STAT IA", icon: <EcgIcon size={24} /> },
  { href: "/plantao", label: "Plantão", icon: <CalendarClock size={24} />, novo: true },
];

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}

export default function BottomNav({ me }: { me: Me }) {
  const pathname = usePathname();
  const onPerfil = pathname === "/perfil";
  const [seen, setSeen] = useState<string[]>([]);
  useEffect(() => {
    try {
      setSeen(JSON.parse(localStorage.getItem("stat_nav_seen") || "[]"));
    } catch {
      /* noop */
    }
  }, []);
  useEffect(() => {
    const cur = items.find((it) => it.novo && (pathname === it.href || pathname.startsWith(it.href + "/")));
    if (cur && !seen.includes(cur.href)) {
      const ns = [...seen, cur.href];
      setSeen(ns);
      try {
        localStorage.setItem("stat_nav_seen", JSON.stringify(ns));
      } catch {
        /* noop */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <nav className="bottom-nav">
      {items.map((it) => {
        const on = pathname === it.href || pathname.startsWith(it.href + "/");
        const isChat = it.href === "/chat"; // único item vermelho (acento da marca)
        const novo = !!it.novo && !seen.includes(it.href);
        return (
          <Link key={it.href} href={it.href} className={`nav-item ${on ? "nav-item-on" : ""}`}>
            <span
              className="nav-ic"
              style={{
                position: "relative",
                ...(isChat
                  ? {
                      opacity: on ? 1 : 0.55,
                      background: on ? "color-mix(in srgb, #E11D2A 14%, transparent)" : "transparent",
                      filter: on ? "drop-shadow(0 0 4px rgba(225,29,42,.45))" : "none",
                    }
                  : {}),
              }}
            >
              {it.icon}
              {novo && <span style={{ position: "absolute", top: 1, right: 7, width: 8, height: 8, borderRadius: 999, background: "var(--primary)", border: "1.5px solid var(--surface)" }} />}
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
