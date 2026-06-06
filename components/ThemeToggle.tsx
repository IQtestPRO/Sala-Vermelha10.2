"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

// Alterna claro/escuro. O tema inicial é aplicado por um script inline no layout
// (evita flash). Default = claro; a escolha do usuário fica em localStorage.
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
  }

  return (
    <button
      onClick={toggle}
      className="chip"
      aria-label={dark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      style={{ minHeight: 38, width: 38, padding: 0, justifyContent: "center" }}
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
