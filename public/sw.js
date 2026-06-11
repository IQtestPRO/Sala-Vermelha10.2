// Service worker do STAT — cache do shell + offline + Web Push.
const CACHE = "stat-shell-v4";
const SHELL = ["/", "/condutas", "/calculadoras", "/plantao", "/chat", "/perfil", "/protocolos/rcp", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// NUNCA cachear /api/* — dados precisam estar frescos.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.pathname.startsWith("/api/")) return;
  // Payloads RSC do Next mudam a cada deploy — cacheá-los serve rota velha p/ sempre.
  if (url.searchParams.has("_rsc")) return;

  // Navegação: network-first COM TIMEOUT (lie-fi de Wi-Fi hospitalar pendura 30-60s —
  // abrir o Modo PCR numa parada não pode ficar em tela branca); offline/timeout cai no cache.
  if (event.request.mode === "navigate") {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3500);
    event.respondWith(
      fetch(event.request, { signal: ctrl.signal })
        .then((res) => {
          clearTimeout(timer);
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
          return res;
        })
        .catch(async () => {
          clearTimeout(timer);
          return (await caches.match(event.request)) || (await caches.match(url.pathname)) || (await caches.match("/offline"));
        })
    );
    return;
  }

  // Estáticos (JS/CSS/imagens): cache-first com cache-on-fetch → 100% offline depois de carregado.
  event.respondWith(
    caches.match(event.request).then((hit) => {
      if (hit) return hit;
      return fetch(event.request).then((res) => {
        if (res && res.ok && url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});

// FCM/APNs rotacionam a subscription — sem isto o plantonista para de receber
// alertas SILENCIOSAMENTE. Reinscreve com as opções antigas e re-registra no servidor.
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription ? event.oldSubscription.options : { userVisibleOnly: true })
      .then((sub) =>
        fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(sub),
        })
      )
      .catch(() => {})
  );
});

// ---- Web Push ----
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {};
  }
  const title = data.title || "Novo caso de emergência";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      tag: data.tag || (data.caseId ? `case-${data.caseId}` : "emerg10"),
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      actions: Array.isArray(data.actions) ? data.actions.slice(0, 2) : undefined,
      data: { url: data.url || (data.caseId ? `/case/${data.caseId}` : "/queue"), shiftId: data.shiftId },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const nd = event.notification.data || {};
  // Ação "Confirmar presença" do lembrete de plantão — confirma direto da notificação.
  if (event.action === "confirmar" && nd.shiftId) {
    event.waitUntil(
      fetch("/api/shifts/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: nd.shiftId }),
      }).catch(() => {})
    );
    return;
  }
  const target = nd.url || "/queue";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes(target) && "focus" in w) return w.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
