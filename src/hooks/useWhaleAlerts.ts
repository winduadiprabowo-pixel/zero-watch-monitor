/**
 * ZERØ WATCH — useWhaleAlerts v1
 * ================================
 * Browser Push Notification untuk big whale moves.
 * - Pakai Web Notifications API (no server needed, 0 cost)
 * - Trigger saat BigMoveAlert > $500K di wallet manapun
 * - Anti-spam: max 1 notif per wallet per 5 menit
 * - Permission request hanya saat user klik toggle
 * - mountedRef ✓  localStorage untuk seen hashes ✓
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import type { WalletIntelligence } from '@/services/whaleAnalytics'

const ALERT_COOLDOWN_MS = 5 * 60_000   // 5 menit per wallet
const MIN_ALERT_USD     = 500_000       // $500K threshold
const SEEN_KEY          = 'zero-watch-seen-alerts-v1'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSeenHashes(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function addSeenHash(hash: string) {
  try {
    const seen = getSeenHashes()
    seen.add(hash)
    // Keep max 200 entries to avoid bloat
    const arr = Array.from(seen).slice(-200)
    localStorage.setItem(SEEN_KEY, JSON.stringify(arr))
  } catch {
    // localStorage unavailable — skip
  }
}

function fmtUsd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

// ── Notification sender ───────────────────────────────────────────────────────

function sendNotification(title: string, body: string, tag: string) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, {
      body,
      tag,    // dedupe by tag — same tag = replace, not spam
      icon:   '/favicon.ico',
      badge:  '/favicon.ico',
      silent: false,
    })
  } catch {
    // Notification constructor can throw in some browsers
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export type NotifPermission = 'default' | 'granted' | 'denied' | 'unsupported'

export interface WhaleAlertsState {
  permission:      NotifPermission
  enabled:         boolean
  alertCount:      number   // total alerts sent this session
  lastAlert:       string | null
  requestPermission: () => Promise<void>
  toggle:          () => void
}

export function useWhaleAlerts(
  walletIntelMap: Record<string, WalletIntelligence>,
  walletLabels:   Record<string, string>   // id → label
): WhaleAlertsState {
  const [permission, setPermission] = useState<NotifPermission>(() => {
    if (typeof Notification === 'undefined') return 'unsupported'
    return Notification.permission as NotifPermission
  })
  const [enabled,    setEnabled]    = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const [lastAlert,  setLastAlert]  = useState<string | null>(null)

  const mountedRef    = useRef(true)
  const cooldownMap   = useRef<Record<string, number>>({})   // walletId → lastNotifMs

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // ── Watch walletIntelMap for big moves ──────────────────────────────────────
  useEffect(() => {
    if (!enabled || permission !== 'granted') return

    const seenHashes = getSeenHashes()
    const now        = Date.now()

    for (const [walletId, intel] of Object.entries(walletIntelMap)) {
      const lastNotif = cooldownMap.current[walletId] ?? 0
      if (now - lastNotif < ALERT_COOLDOWN_MS) continue

      const label = walletLabels[walletId] ?? 'Unknown Wallet'

      for (const move of intel.bigMoves) {
        if (move.valueUsd < MIN_ALERT_USD)   continue
        if (seenHashes.has(move.hash))       continue

        // Fire notification!
        const dir    = move.type === 'IN' ? '📥 INCOMING' : '📤 OUTGOING'
        const title  = `ZERØ WATCH — Big Move Detected`
        const body   = `${dir} ${fmtUsd(move.valueUsd)} · ${label}`

        sendNotification(title, body, `whale-${move.hash}`)
        addSeenHash(move.hash)
        cooldownMap.current[walletId] = now

        if (mountedRef.current) {
          setAlertCount(c => c + 1)
          setLastAlert(`${label}: ${dir} ${fmtUsd(move.valueUsd)}`)
        }
        break  // one notif per wallet per cycle
      }
    }
  }, [walletIntelMap, walletLabels, enabled, permission])

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      setPermission('unsupported')
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
      if (result === 'granted') setEnabled(true)
    } catch {
      setPermission('denied')
    }
  }, [])

  const toggle = useCallback(() => {
    if (!enabled && permission !== 'granted') {
      void requestPermission()
    } else {
      setEnabled(e => !e)
    }
  }, [enabled, permission, requestPermission])

  return {
    permission,
    enabled,
    alertCount,
    lastAlert,
    requestPermission,
    toggle,
  }
}
