"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";

// Claro ↔ MODO PLANTÃO (dark): nomeado — é o modo de usar às 3h da manhã.
// O tema inicial é aplicado por um script inline no layout (evita flash).
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  function toggle() {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("stat_theme", next);
    } catch {}
    setDark(!dark);
    toast(next === "dark" ? "Modo Plantão ativado." : "Modo claro ativado.", { duration: 1600 });
  }

  return (
    <button
      onClick={toggle}
      className="chip"
      title={dark ? "Sair do Modo Plantão" : "Modo Plantão"}
      aria-label={dark ? "Sair do Modo Plantão (tema claro)" : "Ativar Modo Plantão (tema escuro)"}
      style={{ minHeight: 38, width: 38, padding: 0, justifyContent: "center" }}
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
