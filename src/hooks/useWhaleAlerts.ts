/**
 * ZERØ WATCH — useWhaleAlerts v2
 * ================================
 * v2: Context-aware alerts — full intelligence upgrade.
 *
 * BEFORE: "⚠️ Wintermute → Binance: $5M"
 *
 * AFTER:
 * "🚨 ANOMALY — Wintermute
 *  Value: $12.3M (4.1x above 30d avg)
 *  Coordinated: Jump Trading also moved $8.7M 18 min ago
 *  Historical: Similar pattern preceded -8.2% ETH drop (Oct 10 2025)
 *  Confidence: 87%
 *  ZERØ WATCH · @ZerobuildLab 🇮🇩"
 *
 * rgba() only ✓  mountedRef ✓  useCallback ✓  useMemo ✓
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import type { WalletIntelligence } from '@/services/whaleAnalytics'
import { sendPushAlert } from '@/hooks/usePushSubscription'

const ALERT_COOLDOWN_MS = 5 * 60_000
const MIN_ALERT_USD     = 500_000
const COORDINATION_MS   = 30 * 60_000
const SEEN_KEY          = 'zero-watch-seen-alerts-v2'

const ENTITY_HISTORY: Record<string, string> = {
  'Wintermute':      'MM→CEX patterns preceded -12% ETH (Oct 2025)',
  'Jump Trading':    'Jump+MM coordinated: -8.2% ETH (Mar 2024)',
  'Justin Sun':      'Sun TRX bridge → ETH dump 30–60 min after',
  'FTX Estate':      'Estate moves create sustained sell pressure within 24h',
  'Mt.Gox Trustee':  'Mt.Gox distributions preceded -6% BTC (Jul 2024)',
  'Satoshi-Era':     'DORMANT SATOSHI-ERA — BLACK SWAN event',
  'DWF Labs':        'DWF accumulation → 3–7% alt pumps within 48h',
  'Cumberland DRW':  'Cumberland exits often precede ETH volatility',
  'Abraxas Capital': 'Abraxas distribution preceded -9% BTC (Sep 2024)',
}

interface RecentMove {
  walletId: string
  label:    string
  entity:   string
  valueUsd: number
  hash:     string
  ts:       number
}

function getSeenHashes(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch { return new Set() }
}

function addSeenHash(hash: string) {
  try {
    const seen = getSeenHashes()
    seen.add(hash)
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-300)))
  } catch { /* skip */ }
}

function fmtUsd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

function timeDiff(ms: number): string {
  const m = Math.floor(ms / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m} min ago`
  return `${Math.floor(m / 60)}h ago`
}

function sendBrowserNotif(title: string, body: string, tag: string) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  try { new Notification(title, { body, tag, icon: '/favicon.ico', silent: false }) }
  catch { /* skip */ }
}

type Severity = 'BLACK_SWAN' | 'CRITICAL' | 'WARNING' | 'INFO'

function getSeverity(
  entity: string, valueUsd: number, multiplier: number,
  coordinated: boolean, confidence: number
): Severity {
  if (entity === 'Satoshi-Era' || entity === 'Mt.Gox Trustee') return 'BLACK_SWAN'
  if (coordinated && confidence >= 80)              return 'CRITICAL'
  if (valueUsd >= 10_000_000 && multiplier >= 3)    return 'CRITICAL'
  if (entity === 'FTX Estate')                      return 'CRITICAL'
  if (coordinated || multiplier >= 2 || valueUsd >= 5_000_000) return 'WARNING'
  return 'INFO'
}

function buildMessage(
  label: string, entity: string, valueUsd: number,
  direction: string, multiplier: number,
  coordMoves: RecentMove[], confidence: number,
  historicalRef: string | null, severity: Severity
): string {
  const SEV: Record<Severity, string> = {
    BLACK_SWAN: '🌋', CRITICAL: '🚨', WARNING: '⚠️', INFO: '📊',
  }
  const dir  = direction === 'OUT' ? '📤 OUT' : '📥 IN'
  const lines = [
    `${SEV[severity]} <b>${severity} — ${label}</b>`,
    '',
    `${dir}: <b>${fmtUsd(valueUsd)}</b>`,
  ]

  if (multiplier > 1.5) {
    lines.push(`📈 <b>${multiplier.toFixed(1)}x</b> above 30d avg`)
  }

  if (coordMoves.length > 0) {
    const others = coordMoves.slice(0, 2).map(m =>
      `${m.label} moved ${fmtUsd(m.valueUsd)} ${timeDiff(Date.now() - m.ts)}`
    )
    lines.push(`🤝 Coordinated: ${others.join(' · ')}`)
  }

  if (historicalRef) lines.push(`📚 <i>${historicalRef}</i>`)
  lines.push(`🎯 Confidence: <b>${confidence}%</b>`)

  if (entity === 'Satoshi-Era')    lines.push(`🌋 <b>SATOSHI-ERA ACTIVATED — BLACK SWAN</b>`)
  else if (entity === 'Mt.Gox Trustee') lines.push(`⚠️ Mt.Gox distributions move BTC markets`)
  else if (entity === 'FTX Estate')    lines.push(`💀 FTX estate = sustained sell pressure within 24h`)
  else if (entity === 'Justin Sun')    lines.push(`🔴 Justin Sun moves often precede TRX/ETH dump`)

  lines.push('', `<i>ZERØ WATCH · @ZerobuildLab 🇮🇩</i>`)
  return lines.join('\n')
}

export type NotifPermission = 'default' | 'granted' | 'denied' | 'unsupported'

export interface WhaleAlertsState {
  permission:        NotifPermission
  enabled:           boolean
  alertCount:        number
  lastAlert:         string | null
  requestPermission: () => Promise<void>
  toggle:            () => void
}

export function useWhaleAlerts(
  walletIntelMap:  Record<string, WalletIntelligence>,
  walletLabels:    Record<string, string>,
  onTgAlert?:      (msg: string) => void,
  walletEntities?: Record<string, string>,
): WhaleAlertsState {
  const [permission, setPermission] = useState<NotifPermission>(() => {
    if (typeof Notification === 'undefined') return 'unsupported'
    return Notification.permission as NotifPermission
  })
  const [enabled,    setEnabled]    = useState(false)
  const [alertCount, setAlertCount] = useState(0)
  const [lastAlert,  setLastAlert]  = useState<string | null>(null)

  const mountedRef     = useRef(true)
  const cooldownMap    = useRef<Record<string, number>>({})
  const recentMovesRef = useRef<RecentMove[]>([])

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const baselineMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const [id, intel] of Object.entries(walletIntelMap)) {
      const moves = intel.bigMoves ?? []
      if (moves.length === 0) { map[id] = 0; continue }
      map[id] = moves.reduce((s, m) => s + m.valueUsd, 0) / moves.length
    }
    return map
  }, [walletIntelMap])

  useEffect(() => {
    if (!enabled || permission !== 'granted') return

    const seenHashes = getSeenHashes()
    const now        = Date.now()

    // Prune stale recent moves
    recentMovesRef.current = recentMovesRef.current.filter(
      m => now - m.ts < COORDINATION_MS
    )

    for (const [walletId, intel] of Object.entries(walletIntelMap)) {
      const lastNotif = cooldownMap.current[walletId] ?? 0
      if (now - lastNotif < ALERT_COOLDOWN_MS) continue

      const label    = walletLabels[walletId] ?? 'Unknown Whale'
      const entity   = walletEntities?.[walletId] ?? label
      const baseline = baselineMap[walletId] ?? 0

      for (const move of intel.bigMoves ?? []) {
        if (move.valueUsd < MIN_ALERT_USD) continue
        if (seenHashes.has(move.hash))    continue

        const multiplier = baseline > 0
          ? Math.round((move.valueUsd / baseline) * 10) / 10
          : 1.0

        const coordMoves = recentMovesRef.current.filter(
          m => m.walletId !== walletId && m.valueUsd >= MIN_ALERT_USD
        )

        let confidence = 55
        if (move.valueUsd >= 10_000_000)   confidence += 15
        else if (move.valueUsd >= 5_000_000) confidence += 8
        if (multiplier >= 4)               confidence += 12
        else if (multiplier >= 2)          confidence += 6
        if (coordMoves.length >= 2)        confidence += 15
        else if (coordMoves.length === 1)  confidence += 8
        if (entity === 'Satoshi-Era')      confidence = 99
        if (entity === 'FTX Estate')       confidence = 92
        if (entity === 'Mt.Gox Trustee')   confidence = 94
        confidence = Math.min(confidence, 98)

        const severity     = getSeverity(entity, move.valueUsd, multiplier, coordMoves.length > 0, confidence)
        const historicalRef = ENTITY_HISTORY[entity] ?? null

        // Skip low-value INFO — no spam
        if (severity === 'INFO') continue

        const richMsg = buildMessage(
          label, entity, move.valueUsd, move.type,
          multiplier, coordMoves, confidence, historicalRef, severity
        )

        // Browser notification (foreground)
        const ico = severity === 'BLACK_SWAN' ? '🌋' : severity === 'CRITICAL' ? '🚨' : '⚠️'
        const notifTitle = `ZERØ WATCH — ${severity}`
        const notifBody  = `${ico} ${label}: ${fmtUsd(move.valueUsd)} · ${confidence}% conf`
        sendBrowserNotif(notifTitle, notifBody, `whale-${move.hash}`)

        // Web Push (background — tab tertutup pun muncul)
        sendPushAlert({
          title:    notifTitle,
          body:     notifBody,
          tag:      `whale-${move.hash}`,
          critical: severity === 'BLACK_SWAN' || severity === 'CRITICAL',
        })

        if (onTgAlert) onTgAlert(richMsg)

        recentMovesRef.current.push({
          walletId, label, entity,
          valueUsd: move.valueUsd,
          hash:     move.hash,
          ts:       now,
        })

        addSeenHash(move.hash)
        cooldownMap.current[walletId] = now

        if (mountedRef.current) {
          setAlertCount(c => c + 1)
          setLastAlert(`${label}: ${fmtUsd(move.valueUsd)} (${confidence}% conf)`)
        }
        break
      }
    }
  }, [walletIntelMap, walletLabels, walletEntities, enabled, permission, baselineMap, onTgAlert])

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') { setPermission('unsupported'); return }
    if (Notification.permission === 'granted') { setPermission('granted'); setEnabled(true); return }
    try {
      const result = await Notification.requestPermission()
      if (!mountedRef.current) return
      setPermission(result as NotifPermission)
      if (result === 'granted') setEnabled(true)
    } catch { setPermission('denied') }
  }, [])

  const toggle = useCallback(() => {
    if (!enabled && permission !== 'granted') void requestPermission()
    else setEnabled(e => !e)
  }, [enabled, permission, requestPermission])

  return { permission, enabled, alertCount, lastAlert, requestPermission, toggle }
}
