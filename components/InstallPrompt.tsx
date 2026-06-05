"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BIPEvent = Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> };

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("e10_install_dismiss")) return;
    const standalone =
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) return;

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS) {
      setIos(true);
      setShow(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const onInstalled = () => setShow(false);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!show) return null;

  function dismiss() {
    setShow(false);
    localStorage.setItem("e10_install_dismiss", "1");
  }
  async function install() {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShow(false);
  }

  return (
    <div style={{ margin: "10px 16px 0" }} className="card-2">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Download size={18} color="var(--blue)" />
        <div style={{ flex: 1, fontSize: 13 }}>
          {ios ? (
            <>Instale o app: <b>Compartilhar</b> → <b>Adicionar à Tela de Início</b>.</>
          ) : (
            <>Instale o Emergência em 10 na tela inicial.</>
          )}
        </div>
        {!ios && (
          <button className="btn btn-sm btn-primary" style={{ width: "auto" }} onClick={install}>
            Instalar
          </button>
        )}
        <button onClick={dismiss} aria-label="Dispensar" style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", padding: 4 }}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
