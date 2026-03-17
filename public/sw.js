/**
 * ZERØ WATCH — Service Worker v25
 * ================================
 * Cache: zero-watch-v39
 */

const CACHE_NAME = 'zero-watch-v39'
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (url.pathname.includes('/api/') || url.pathname.includes('/etherscan') ||
      url.pathname.includes('/alchemy') || url.pathname.includes('/tron') ||
      url.hostname !== location.hostname) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)))
    return
  }
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached ?? fetch(event.request).then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone))
        }
        return res
      })
    )
  )
})
