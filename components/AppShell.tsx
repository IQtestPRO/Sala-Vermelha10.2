"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiGet, Me } from "@/lib/client";
import BottomNav from "./BottomNav";
import InstallPrompt from "./InstallPrompt";
import ConsentScreen from "./ConsentScreen";
import Onboarding from "./Onboarding";
import { CONSENT_VERSION } from "@/lib/legal/disclaimer";

const ONBOARDING_KEY = "stat_onboarding_v1";

const MeCtx = createContext<Me | null>(null);
export function useMe(): Me {
  const me = useContext(MeCtx);
  if (!me) throw new Error("useMe fora do AppShell");
  return me;
}

const MeUpdateCtx = createContext<((m: Me) => void) | null>(null);
export function useUpdateMe(): (m: Me) => void {
  return useContext(MeUpdateCtx) ?? (() => {});
}

// Pendente (plantonista não aprovado) pode usar o toolkit, só não a fila de casos.
const ALLOWED_WHEN_PENDING = ["/pending", "/condutas", "/calculadoras", "/chat", "/plantao", "/perfil", "/suporte", "/protocolos", "/rapido", "/analisar"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const [consented, setConsented] = useState<boolean | null>(null);
  const [showOnb, setShowOnb] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setConsented(localStorage.getItem("e10_consent") === CONSENT_VERSION);
  }, []);

  // Tutorial: 1º acesso (após consentir) + reabrível pelo Perfil (evento).
  useEffect(() => {
    const abrir = () => setShowOnb(true);
    window.addEventListener("stat-open-tutorial", abrir);
    return () => window.removeEventListener("stat-open-tutorial", abrir);
  }, []);
  useEffect(() => {
    if (ready && me && consented) {
      try {
        if (!localStorage.getItem(ONBOARDING_KEY)) setShowOnb(true);
      } catch {
        /* noop */
      }
    }
  }, [ready, me, consented]);
  const fecharOnb = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      /* noop */
    }
    setShowOnb(false);
  };

  useEffect(() => {
    let alive = true;
    apiGet<{ user: Me }>("/api/auth/me")
      .then(({ user }) => {
        if (!alive) return;
        setMe(user);
        const pending = user.role === "responder" && user.status !== "approved";
        const liberado = ALLOWED_WHEN_PENDING.some((a) => pathname === a || pathname.startsWith(a + "/"));
        if (pending && !liberado) {
          router.replace("/pending");
        }
        setReady(true);
      })
      .catch(() => {
        // Preserva o destino (deep-link) p/ voltar após login (ex.: link da passagem no WhatsApp).
        const path = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
        router.replace(path && path !== "/" && !path.startsWith("/login") ? `/login?next=${encodeURIComponent(path)}` : "/login");
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready || !me || consented === null) {
    return (
      <div className="app-main" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="muted">Carregando…</div>
      </div>
    );
  }

  if (!consented) {
    return (
      <ConsentScreen
        onAccept={() => {
          localStorage.setItem("e10_consent", CONSENT_VERSION);
          setConsented(true);
        }}
      />
    );
  }

  return (
    <MeCtx.Provider value={me}>
      <MeUpdateCtx.Provider value={setMe}>
        <div className="app-shell-frame">
          <div className="app-main">
            <InstallPrompt />
            {children}
          </div>
          <BottomNav me={me} />
        </div>
        {showOnb && <Onboarding onDone={fecharOnb} />}
      </MeUpdateCtx.Provider>
    </MeCtx.Provider>
  );
}
