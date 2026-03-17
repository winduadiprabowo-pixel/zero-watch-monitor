/**
 * ZERØ WATCH — Service Worker v28
 * ================================
 * Cache: zero-watch-v44
 * v28: Web Push notification handler
 *      - push event → show notification background (tab tertutup pun muncul)
 *      - notificationclick → focus/open app
 */

const CACHE_NAME = 'zero-watch-v44'
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

// ── Web Push Handler (v28) ────────────────────────────────────────────────────

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
