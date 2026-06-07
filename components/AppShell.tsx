"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiGet, Me } from "@/lib/client";
import BottomNav from "./BottomNav";
import InstallPrompt from "./InstallPrompt";
import ConsentScreen from "./ConsentScreen";
import { CONSENT_VERSION } from "@/lib/legal/disclaimer";

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

const ALLOWED_WHEN_PENDING = ["/pending", "/condutas", "/rapido", "/analisar"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const [consented, setConsented] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setConsented(localStorage.getItem("e10_consent") === CONSENT_VERSION);
  }, []);

  useEffect(() => {
    let alive = true;
    apiGet<{ user: Me }>("/api/auth/me")
      .then(({ user }) => {
        if (!alive) return;
        setMe(user);
        const pending = user.role === "responder" && user.status !== "approved";
        if (pending && !ALLOWED_WHEN_PENDING.includes(pathname)) {
          router.replace("/pending");
        }
        setReady(true);
      })
      .catch(() => {
        router.replace("/login");
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
        <div className="app-main">
          <InstallPrompt />
          {children}
        </div>
        <BottomNav me={me} />
      </MeUpdateCtx.Provider>
    </MeCtx.Provider>
  );
}
