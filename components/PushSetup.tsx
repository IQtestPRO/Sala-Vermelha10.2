"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type State = "idle" | "on" | "unsupported" | "ios-install";

export default function PushSetup() {
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    const hasSW = "serviceWorker" in navigator;
    const hasPush = typeof window !== "undefined" && "PushManager" in window;
    const hasNotif = typeof window !== "undefined" && "Notification" in window;
    if (!hasSW || !hasPush || !hasNotif) {
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone =
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        window.matchMedia("(display-mode: standalone)").matches;
      setState(isIOS && !standalone ? "ios-install" : "unsupported");
      return;
    }
    if (Notification.permission === "granted") {
      setState("on");
      // Permissão ≠ subscription viva: FCM/APNs rotacionam e o servidor pode ter perdido o registro.
      // A cada abertura: se morreu, reinscreve; se vive, re-POSTa (servidor e aparelho sincronizados).
      (async () => {
        try {
          const reg = await navigator.serviceWorker.ready;
          let sub = await reg.pushManager.getSubscription();
          if (!sub && VAPID) {
            sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID) });
          }
          if (sub) {
            await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sub) });
          }
        } catch {
          /* silencioso: o botão de ativar continua disponível se algo falhar de verdade */
        }
      })();
    }
  }, []);

  async function enable() {
    if (!VAPID) {
      toast.error("Push ainda não configurado no servidor (VAPID).");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast.error("Permissão de notificação negada.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID),
      });
      const r = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!r.ok) {
        toast.error("Não consegui registrar os alertas no servidor — tente de novo.");
        return;
      }
      setState("on");
      toast.success("Alertas ativados! Você será avisado de casos novos.");
    } catch {
      toast.error("Não consegui ativar as notificações.");
    }
  }

  if (state === "on" || state === "unsupported") return null;
  if (state === "ios-install") {
    return (
      <div className="card-2" style={{ fontSize: 13, color: "var(--text-dim)" }}>
        📲 Para receber alertas no iPhone, instale o app: toque em <b>Compartilhar</b> → <b>Adicionar à Tela de Início</b>.
      </div>
    );
  }
  return (
    <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }} onClick={enable}>
      <Bell size={16} /> Ativar alertas de caso novo
    </button>
  );
}
