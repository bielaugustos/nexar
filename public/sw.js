// ══════════════════════════════════════
// SERVICE WORKER — Ioversoroot PWA v2
// Estratégia: Cache First para assets estáticos
// (JS, CSS, fontes, ícones) — o app carrega
// offline após a primeira visita.
// Dados do usuário ficam no localStorage
// e não precisam de rede.
// ══════════════════════════════════════

const CACHE_VERSION = 'nex-v2'
const OFFLINE_URL   = '/offline.html'

// Assets críticos para funcionamento offline
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// ── Install: pré-cacheia assets essenciais ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => {
        // Ativa imediatamente sem esperar o SW antigo encerrar
        return self.skipWaiting()
      })
      .catch(err => console.warn('[Ioversoroot SW] Precache parcial:', err))
  )
})

// ── Activate: limpa caches de versões anteriores ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_VERSION)
          .map(k => {
            console.log('[Ioversoroot SW] Removendo cache antigo:', k)
            return caches.delete(k)
          })
      ))
      .then(() => self.clients.claim())
  )
})

// ── Fetch: Cache First para assets, Network First para navegação ──
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Ignora requisições não-GET e requests externos (APIs)
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  // Estratégia: Stale-While-Revalidate para assets do app
  // → responde do cache imediatamente (offline funciona)
  // → atualiza o cache em background (próxima visita terá versão nova)
  event.respondWith(
    caches.open(CACHE_VERSION).then(cache =>
      cache.match(request).then(cached => {
        const fetchPromise = fetch(request)
          .then(response => {
            // Só cacheia respostas válidas de nossa origem
            if (response && response.status === 200 && response.type === 'basic') {
              cache.put(request, response.clone())
            }
            return response
          })
          .catch(() => {
            // Offline e não está no cache: serve página offline
            if (request.mode === 'navigate') {
              return caches.match(OFFLINE_URL)
            }
            return new Response('Offline', { status: 503 })
          })

        // Retorna cache imediatamente se disponível; senão aguarda rede
        return cached || fetchPromise
      })
    )
  )
})

// ── Mensagens do app ──
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
