/**
 * ZERØ WATCH — Service Worker v21
 * ================================
 * Cache: zero-watch-v28
 * - Static assets cached on install
 * - Network-first for API calls
 * - Cache-first for static assets
 */

const CACHE_NAME = 'zero-watch-v28'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Network-first for API calls
  if (url.pathname.includes('/api/') || url.pathname.includes('/etherscan') ||
      url.pathname.includes('/alchemy') || url.pathname.includes('/tron') ||
      url.hostname !== location.hostname) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    )
    return
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached ?? fetch(event.request).then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return res
      })
    )
  )
})
