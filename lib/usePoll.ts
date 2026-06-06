"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Opts<T> = {
  enabled?: boolean;
  pauseWhenHidden?: boolean;
  onData?: (data: T) => void;
  // Quando retorna true para os dados recebidos, o polling para (ex.: caso encerrado/expirado).
  stopWhen?: (data: T) => boolean;
};

// Polling curto, consciente de visibilidade, com backoff exponencial em erro.
// Mantem o ultimo `data` valido durante erros transitorios (nao limpa a tela)
// e PARA de pollar em 401/403 (sessao/permissao) ou quando stopWhen e satisfeito.
export function usePoll<T>(url: string, intervalMs: number, opts?: Opts<T>) {
  const { enabled = true, pauseWhenHidden = true, onData, stopWhen } = opts || {};
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [lastUpdated, setLastUpdated] = useState<number | undefined>(undefined);

  const failures = useRef(0);
  const stopped = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const abort = useRef<AbortController | undefined>(undefined);
  const onDataRef = useRef(onData);
  onDataRef.current = onData;
  const stopWhenRef = useRef(stopWhen);
  stopWhenRef.current = stopWhen;

  const tick = useCallback(async () => {
    if (stopped.current) return;
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    try {
      const res = await fetch(url, { signal: ac.signal, cache: "no-store" });
      if (res.status === 401 || res.status === 403) {
        // Sem sessao/permissao: para de pollar (evita loop de erro a cada intervalo).
        stopped.current = true;
        setError(new Error("HTTP " + res.status));
        return;
      }
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = (await res.json()) as T;
      failures.current = 0;
      setData(json);
      setError(undefined);
      setLastUpdated(Date.now());
      onDataRef.current?.(json);
      if (stopWhenRef.current && stopWhenRef.current(json)) stopped.current = true;
    } catch (e) {
      if (ac.signal.aborted) return;
      failures.current += 1;
      setError(e as Error); // mantem o `data` anterior — nao some a tela
    } finally {
      if (!ac.signal.aborted && !stopped.current) {
        const hidden = pauseWhenHidden && typeof document !== "undefined" && document.hidden;
        if (enabled && !hidden) {
          const delay = failures.current ? Math.min(intervalMs * 2 ** failures.current, 30000) : intervalMs;
          timer.current = setTimeout(tick, delay);
        }
      }
    }
  }, [url, intervalMs, enabled, pauseWhenHidden]);

  useEffect(() => {
    if (!enabled) return;
    stopped.current = false;
    tick();
    const onVis = () => {
      if (typeof document === "undefined") return;
      if (document.hidden) {
        if (timer.current) clearTimeout(timer.current);
      } else if (!stopped.current) {
        failures.current = 0;
        tick();
      }
    };
    if (pauseWhenHidden) document.addEventListener("visibilitychange", onVis);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      abort.current?.abort();
      if (pauseWhenHidden) document.removeEventListener("visibilitychange", onVis);
    };
  }, [tick, enabled, pauseWhenHidden]);

  const isStale = lastUpdated ? Date.now() - lastUpdated > intervalMs * 3 : false;
  return { data, error, lastUpdated, isStale, refresh: tick };
}
