// Tadarus Guru's service worker, for the /guru app only (registered with
// scope "/guru"). It makes the app installable and shows a calm page when
// there is no connection. Everything else always comes from the network, so a
// new deploy is never held back by an old copy.
const OFFLINE = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tadarus Guru</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;
background:linear-gradient(170deg,#f7f9fc,#e5ecf5);color:#0f2a4a;text-align:center;padding:24px}
.c{max-width:340px;padding:28px;border-radius:24px;background:rgba(255,255,255,.75);box-shadow:0 24px 50px -32px rgba(16,33,65,.45)}
h1{margin:0 0 8px;font-size:1.4rem}p{margin:0 0 18px;color:#5d6b7d;line-height:1.5}
button{border:0;border-radius:14px;padding:14px 22px;background:#1a4970;color:#fff;font:inherit;font-weight:700}</style></head>
<body><div class="c"><h1>Anda sedang offline</h1><p>Sambungkan internet, lalu coba lagi untuk melanjutkan belajar.</p>
<button onclick="location.reload()">Coba lagi</button></div></body></html>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.mode !== "navigate") return;
  event.respondWith(fetch(request).catch(() => new Response(OFFLINE, { headers: { "Content-Type": "text/html; charset=utf-8" } })));
});
