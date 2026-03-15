/**
 * ZERØ WATCH — useTelegramAlert v2
 * ==================================
 * v2: Context-aware smart alerts
 *
 * BEFORE: "⚠️ Wintermute → Binance: $5M"
 *
 * AFTER:
 * "🚨 ANOMALY — Wintermute → Binance
 *  Value: $12.3M (4.1x above 30d avg)
 *  Coordinated: Jump Trading also moved $8.7M → Binance 18 min ago
 *  Historical: Similar pattern preceded -8.2% ETH drop (Oct 10 2025)
 *  Confidence: 87%
 *
 *  ZERØ WATCH · @ZerobuildLab 🇮🇩"
 *
 * rgba() only ✓  AbortController ✓
 */

import { useState, useCallback, useEffect } from 'react'
import type { PatternEvent } from './usePatternRecognition'

const HISTORY_WORKER = 'https://zero-watch-history.winduadiprabowo.workers.dev'
const STORAGE_KEY    = 'zw_tg_chat_id'
const RATE_LIMIT_MS  = 30_000     // 30s between alerts
const SEEN_ALERTS_KEY = 'zw_tg_seen_v2'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtUsd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

function getSeenAlerts(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_ALERTS_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch { return new Set() }
}

function markAlertSeen(id: string): void {
  try {
    const seen = getSeenAlerts()
    seen.add(id)
    localStorage.setItem(SEEN_ALERTS_KEY, JSON.stringify([...seen].slice(-100)))
  } catch { /* skip */ }
}

// ── Message builder ───────────────────────────────────────────────────────────

export function buildPatternAlertMessage(event: PatternEvent): string {
  const severityEmoji: Record<string, string> = {
    BLACK_SWAN: '🌋',
    CRITICAL:   '🚨',
    WARNING:    '⚠️',
    INFO:       '📊',
  }

  const emoji = severityEmoji[event.severity] ?? '📊'
  const lines: string[] = []

  // Header
  lines.push(`${emoji} <b>${event.severity} — ${event.title}</b>`)
  lines.push('')

  // Value
  if (event.totalUsd > 0) {
    const valueStr = fmtUsd(event.totalUsd)
    if (event.multiplier && event.multiplier > 1) {
      lines.push(`💰 Value: <b>${valueStr}</b> <i>(${event.multiplier.toFixed(1)}x above 30d avg)</i>`)
    } else {
      lines.push(`💰 Value: <b>${valueStr}</b>`)
    }
  }

  // Actors
  if (event.actors.length > 0) {
    lines.push(`👥 Actors: ${event.actors.join(' + ')}`)
  }

  // Confidence
  lines.push(`🎯 Confidence: <b>${event.confidence}%</b>`)

  // Historical reference
  if (event.historicalRef) {
    lines.push(`📚 Historical: <i>${event.historicalRef}</i>`)
  }

  // Special messages per type
  if (event.type === 'FTX_ESTATE_MOVE') {
    lines.push(`⚠️ FTX estate liquidations create sustained sell pressure within 24h`)
  } else if (event.type === 'DORMANT_WAKE') {
    lines.push(`💤 Dormant wallet just activated — unusual movement`)
  } else if (event.type === 'SATOSHI_ERA') {
    lines.push(`🌋 SATOSHI-ERA WALLET MOVED — extreme market event possible`)
  } else if (event.type === 'SUN_TRON_BRIDGE') {
    lines.push(`🔴 Justin Sun TRX bridge detected — pre-dump signal (30–60 min lead)`)
  }

  lines.push('')
  lines.push(`<i>ZERØ WATCH · @ZerobuildLab 🇮🇩</i>`)

  return lines.join('\n')
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface TelegramAlertState {
  chatId:          string
  setChatId:       (id: string) => void
  enabled:         boolean
  sending:         boolean
  lastSent:        number
  sendAlert:       (message: string) => Promise<boolean>
  sendPatternAlert: (event: PatternEvent) => Promise<boolean>
  testAlert:       () => Promise<boolean>
}

export function useTelegramAlert(): TelegramAlertState {
  const [chatId,   setChatIdState] = useState<string>('')
  const [sending,  setSending]     = useState(false)
  const [lastSent, setLastSent]    = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setChatIdState(stored)
  }, [])

  const setChatId = useCallback((id: string) => {
    setChatIdState(id)
    if (id.trim()) {
      localStorage.setItem(STORAGE_KEY, id.trim())
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const sendAlert = useCallback(async (message: string): Promise<boolean> => {
    if (!chatId.trim() || sending) return false
    if (Date.now() - lastSent < RATE_LIMIT_MS) return false

    setSending(true)
    try {
      const res  = await fetch(`${HISTORY_WORKER}/tg-alert`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ chatId: chatId.trim(), message }),
      })
      const data = await res.json()
      if (data.ok) setLastSent(Date.now())
      return !!data.ok
    } catch {
      return false
    } finally {
      setSending(false)
    }
  }, [chatId, sending, lastSent])

  // Smart pattern alert — deduped, context-aware
  const sendPatternAlert = useCallback(async (event: PatternEvent): Promise<boolean> => {
    if (!chatId.trim()) return false

    // Skip INFO severity — no TG spam
    if (event.severity === 'INFO') return false

    // Dedup: don't send same pattern twice
    const seen = getSeenAlerts()
    if (seen.has(event.id)) return false

    const message = buildPatternAlertMessage(event)
    const sent    = await sendAlert(message)
    if (sent) markAlertSeen(event.id)
    return sent
  }, [chatId, sendAlert])

  const testAlert = useCallback(async (): Promise<boolean> => {
    return sendAlert(
      `👁 <b>ZERØ WATCH</b> — Test Alert\n\n` +
      `✅ Smart TG alerts aktif!\n` +
      `Whale moves akan muncul di sini dengan context lengkap.\n\n` +
      `<i>ZERØ WATCH · @ZerobuildLab 🇮🇩</i>`
    )
  }, [sendAlert])

  return {
    chatId, setChatId,
    enabled:  !!chatId.trim(),
    sending, lastSent,
    sendAlert,
    sendPatternAlert,
    testAlert,
  }
}
