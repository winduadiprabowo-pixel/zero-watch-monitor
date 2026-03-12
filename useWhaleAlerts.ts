/**
 * ZERØ WATCH — useWhaleAlerts v2
 * ================================
 * v2 FIXES (Grok + Windu combined):
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX #1: localStorage try-catch di semua tempat (crash di incognito / iOS Safari)
 * FIX #2: BigMove threshold turun ke $100K (dari $500K) — lebih useful buat user biasa
 * FIX #3: Notif juga trigger buat 24h window moves (konsisten dengan whaleAnalytics v12)
 * FIX #4: In-app alert state — lastAlerts array buat in-app toast fallback
 *   tanpa perlu browser permission
 * FIX #5: alertCount tidak reset antar render (pakai ref + state combo)
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import type { WalletIntelligence } from '@/services/whaleAnalytics'

const ALERT_COOLDOWN_MS = 5 * 60_000     // 5 menit per wallet
const MIN_ALERT_USD     = 100_000        // FIX #2: $100K (dari $500K)
const SEEN_KEY          = 'zero-watch-seen-alerts-v2'

// ── localStorage helpers — semua wrapped try-catch (FIX #1) ──────────────────

function getSeenHashes(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function addSeenHash(hash: string): void {
  try {
    const seen = getSeenHashes()
    seen.add(hash)
    const arr = Array.from(seen).slice(-200)
    localStorage.setItem(SEEN_KEY, JSON.stringify(arr))
  } catch {
    // localStorage unavailable (incognito / iOS private) — skip silently
  }
}

function fmtUsd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

// ── Browser notification ──────────────────────────────────────────────────────

function sendNotification(title: string, body: string, tag: string): void {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, {
      body,
      tag,
      icon:   '/favicon.ico',
      badge:  '/favicon.ico',
      silent: false,
    })
  } catch {
    // Notification constructor bisa throw di beberapa browser
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotifPermission = 'default' | 'granted' | 'denied' | 'unsupported'

export interface AlertItem {
  id:        string
  walletId:  string
  label:     string
  direction: 'IN' | 'OUT'
  valueUsd:  number
  timestamp: number
  hash:      string
}

export interface WhaleAlertsState {
  permission:        NotifPermission
  enabled:           boolean
  alertCount:        number
  lastAlert:         string | null
  recentAlerts:      AlertItem[]    // FIX #4: in-app toast fallback
  requestPermission: () => Promise<void>
  toggle:            () => void
  clearAlerts:       () => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWhaleAlerts(
  walletIntelMap: Record<string, WalletIntelligence>,
  walletLabels:   Record<string, string>
): WhaleAlertsState {
  const [permission, setPermission] = useState<NotifPermission>(() => {
    if (typeof Notification === 'undefined') return 'unsupported'
    return Notification.permission as NotifPermission
  })
  const [enabled,       setEnabled]       = useState(false)
  const [alertCount,    setAlertCount]    = useState(0)
  const [lastAlert,     setLastAlert]     = useState<string | null>(null)
  const [recentAlerts,  setRecentAlerts]  = useState<AlertItem[]>([])  // FIX #4

  const mountedRef  = useRef(true)
  const cooldownMap = useRef<Record<string, number>>({})

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ── Watch for big moves ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return

    const seenHashes = getSeenHashes()
    const now        = Date.now()

    for (const [walletId, intel] of Object.entries(walletIntelMap)) {
      const lastNotif = cooldownMap.current[walletId] ?? 0
      if (now - lastNotif < ALERT_COOLDOWN_MS) continue

      const label = walletLabels[walletId] ?? 'Unknown Wallet'

      for (const move of intel.bigMoves) {
        if (move.valueUsd < MIN_ALERT_USD) continue
        if (seenHashes.has(move.hash))     continue

        // FIX #4: Always add to in-app alerts regardless of browser permission
        const newAlert: AlertItem = {
          id:        `${move.hash}-${now}`,
          walletId,
          label,
          direction: move.type,
          valueUsd:  move.valueUsd,
          timestamp: now,
          hash:      move.hash,
        }

        addSeenHash(move.hash)
        cooldownMap.current[walletId] = now

        // Browser push notification (only if permission granted)
        if (permission === 'granted') {
          const dir   = move.type === 'IN' ? '📥 INCOMING' : '📤 OUTGOING'
          const title = `ZERØ WATCH — Big Move`
          const body  = `${dir} ${fmtUsd(move.valueUsd)} · ${label}`
          sendNotification(title, body, `whale-${move.hash}`)
        }

        if (mountedRef.current) {
          const dir = move.type === 'IN' ? 'IN' : 'OUT'
          setAlertCount(c => c + 1)
          setLastAlert(`${label}: ${dir} ${fmtUsd(move.valueUsd)}`)
          setRecentAlerts(prev => [newAlert, ...prev].slice(0, 10)) // keep 10 max
        }
        break
      }
    }
  }, [walletIntelMap, walletLabels, enabled, permission])

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      setPermission('unsupported')
      setEnabled(true)  // still enable in-app alerts
      return
    }
    if (Notification.permission === 'granted') {
      setPermission('granted')
      setEnabled(true)
      return
    }
    try {
      const result = await Notification.requestPermission()
      if (!mountedRef.current) return
      setPermission(result as NotifPermission)
      setEnabled(true)  // enable in-app alerts regardless
    } catch {
      setPermission('denied')
      setEnabled(true)  // still enable in-app alerts
    }
  }, [])

  const toggle = useCallback(() => {
    if (!enabled) {
      if (permission !== 'granted') {
        void requestPermission()
      } else {
        setEnabled(true)
      }
    } else {
      setEnabled(false)
    }
  }, [enabled, permission, requestPermission])

  const clearAlerts = useCallback(() => {
    setRecentAlerts([])
    setAlertCount(0)
    setLastAlert(null)
  }, [])

  return {
    permission,
    enabled,
    alertCount,
    lastAlert,
    recentAlerts,
    requestPermission,
    toggle,
    clearAlerts,
  }
}
