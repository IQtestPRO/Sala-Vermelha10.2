"use client";

import { LogOut, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/client";

export default function TopBar({
  title,
  subtitle,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        {onBack ? (
          <button onClick={onBack} aria-label="Voltar" style={{ background: "none", border: "none", color: "var(--text)", display: "grid", placeItems: "center", padding: 4, cursor: "pointer" }}>
            <ChevronLeft size={24} />
          </button>
        ) : (
          <span className="brand-dot" />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 17, lineHeight: 1.1 }}>{title}</div>
          {subtitle && (
            <div className="faint" style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {subtitle}
            </div>
          )}
        </div>
        {right}
      </div>
    </header>
  );
}

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    try {
      await apiPost("/api/auth/logout");
    } finally {
      router.replace("/login");
    }
  }
  return (
    <button onClick={logout} className="chip" style={{ minHeight: 38, padding: "0 12px" }} aria-label="Sair">
      <LogOut size={16} />
    </button>
  );
}
