/**
 * ZERØ WATCH — usePushSubscription v1
 * =====================================
 * Web Push API — background notifications (tab tertutup pun muncul)
 *
 * Flow:
 * 1. Request notification permission
 * 2. Subscribe ke browser push service via serviceWorker.pushManager
 * 3. POST subscription ke CF Worker /push/subscribe (simpan di KV)
 * 4. CF Worker kirim push via /push/send saat whale alert
 *
 * VAPID Public Key di-inject via VITE_VAPID_PUBLIC_KEY env var
 *
 * rgba() only ✓  mountedRef ✓  useCallback ✓
 */

import { useState, useEffect, useCallback, useRef } from 'react'

// VAPID public key dari CF Worker env — set di .env / CF Pages env vars
// Format: base64url string
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

const PROXY = (import.meta.env.VITE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? ''

// ── Helpers ───────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.ready
  } catch {
    return null
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type PushStatus =
  | 'unsupported'   // browser tidak support
  | 'idle'          // belum minta permission
  | 'requesting'    // lagi minta permission
  | 'subscribing'   // lagi subscribe ke push service
  | 'subscribed'    // aktif
  | 'denied'        // user deny
  | 'error'         // error lainnya

export interface UsePushSubscriptionResult {
  status:    PushStatus
  error:     string | null
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePushSubscription(): UsePushSubscriptionResult {
  const [status, setStatus] = useState<PushStatus>(() => {
    if (typeof window === 'undefined') return 'unsupported'
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported'
    if (Notification.permission === 'denied') return 'denied'
    return 'idle'
  })
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    // Check apakah sudah subscribe sebelumnya
    if (status === 'unsupported' || status === 'denied') return

    getRegistration().then(reg => {
      if (!reg || !mountedRef.current) return
      reg.pushManager.getSubscription().then(sub => {
        if (sub && mountedRef.current) setStatus('subscribed')
      })
    })

    return () => { mountedRef.current = false }
  }, [])

  const subscribe = useCallback(async () => {
    if (!mountedRef.current) return
    if (status === 'unsupported') {
      setError('Web Push tidak didukung browser ini')
      return
    }
    if (!VAPID_PUBLIC_KEY) {
      setError('VITE_VAPID_PUBLIC_KEY belum di-set')
      return
    }

    try {
      setStatus('requesting')
      setError(null)

      // Step 1: request permission
      const permission = await Notification.requestPermission()
      if (!mountedRef.current) return
      if (permission !== 'granted') {
        setStatus('denied')
        setError('Notifikasi ditolak — enable di browser settings')
        return
      }

      setStatus('subscribing')

      // Step 2: get SW registration
      const reg = await getRegistration()
      if (!reg || !mountedRef.current) {
        setStatus('error')
        setError('Service Worker tidak aktif')
        return
      }

      // Step 3: subscribe ke push manager
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      if (!mountedRef.current) return

      // Step 4: kirim subscription ke CF Worker
      if (PROXY) {
        await fetch(`${PROXY}/push/subscribe`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(subscription.toJSON()),
        })
      }

      if (mountedRef.current) setStatus('subscribed')

    } catch (e) {
      if (!mountedRef.current) return
      const msg = (e as Error).message ?? 'Push subscription failed'
      setStatus('error')
      setError(msg)
    }
  }, [status])

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await getRegistration()
      if (!reg) return
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        // Hapus dari CF Worker KV
        if (PROXY) {
          await fetch(`${PROXY}/push/subscribe`, {
            method:  'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ endpoint: sub.endpoint }),
          })
        }
      }
      if (mountedRef.current) setStatus('idle')
    } catch (e) {
      if (mountedRef.current) setError((e as Error).message)
    }
  }, [])

  return { status, error, subscribe, unsubscribe }
}

// ── Helper: send push alert via CF Worker ─────────────────────────────────────
// Dipanggil dari useWhaleAlerts saat ada alert besar

export async function sendPushAlert(payload: {
  title:    string
  body:     string
  tag?:     string
  critical?: boolean
}): Promise<void> {
  if (!PROXY) return
  try {
    await fetch(`${PROXY}/push/send`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })
  } catch { /* silently fail — TG alert masih jalan */ }
}
