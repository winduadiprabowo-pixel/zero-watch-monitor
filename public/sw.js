/**
 * ZERØ WATCH — Service Worker v30
 * ================================
 * Cache: zero-watch-v59
 * v30: Fix "Failed to convert value to Response" — sw cache fallback
 *      Bump cache key zero-watch-v53 → zero-watch-v59
 */

const CACHE_NAME   = 'zero-watch-v59'
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

  // Bypass SW untuk semua API calls — jangan cache, langsung fetch
  if (
    url.hostname !== location.hostname ||
    url.pathname.includes('/api/') ||
    url.pathname.includes('/etherscan') ||
    url.pathname.includes('/alchemy') ||
    url.pathname.includes('/tron') ||
    url.pathname.includes('/coingecko') ||
    url.pathname.includes('/btc/') ||
    url.pathname.includes('/solana') ||
    url.pathname.includes('/fapi/') ||
    url.pathname.includes('/auth/') ||
    url.pathname.includes('/push/') ||
    url.pathname.includes('/verify-license') ||
    url.pathname.includes('/health') ||
    url.pathname.includes('/ws') ||
    url.pathname.includes('/snapshot')
  ) {
    // Langsung fetch, kalau gagal return network error (bukan undefined)
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'Network error' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )
    return
  }

  // Static assets — cache first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached
      return fetch(event.request).then(res => {
        if (res && res.ok && res.status < 400) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone))
        }
        return res
      }).catch(() =>
        new Response('Offline', { status: 503 })
      )
    })
  )
})

// ── Web Push Handler ──────────────────────────────────────────────────────────

self.addEventListener('push', event => {
  if (!event.data) return
  let payload
  try   { payload = event.data.json() }
  catch { payload = { title: 'ZERØ WATCH', body: event.data.text() } }

  const title   = payload.title ?? 'ZERØ WATCH'
  const options = {
    body:    payload.body  ?? 'Whale activity detected',
    icon:    '/icon-192.png',
    badge:   '/icon-192.png',
    tag:     payload.tag   ?? 'zero-watch-alert',
    data:    { url: '/' },
    vibrate: [200, 100, 200],
    requireInteraction: payload.critical ?? false,
    actions: [
      { action: 'open',    title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss'  },
    ],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  if (event.action === 'dismiss') return
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus()
      }
      if (clients.openWindow) return clients.openWindow('/')
    })
  )
})
