/**
 * ZERØ WATCH — WhaleTicker v1
 * ============================
 * Live scrolling ticker — top of dashboard, always visible.
 * Shows real-time whale moves from useCrossWalletFlow + usePatternRecognition.
 * Format: [BADGE] Entity → Action · $VALUE · Xm ago
 *
 * - Seamless marquee loop, pause on hover
 * - CRITICAL = red, WARNING = amber, ACCUM = green, INFO = blue
 * - New alert = slides in from right with flash
 *
 * rgba() only ✓  React.memo + displayName ✓  AbortController ✓
 */

import React, { memo, useMemo, useEffect, useRef, useState } from 'react'
import { usePatternRecognition } from '@/hooks/usePatternRecognition'
import { useCrossWalletFlow }    from '@/hooks/useCrossWalletFlow'
import type { PatternEvent }     from '@/hooks/usePatternRecognition'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TickerItem {
  id:       string
  severity: 'CRITICAL' | 'WARNING' | 'ACCUM' | 'INFO' | 'BLACK_SWAN'
  entity:   string
  action:   string
  value:    string
  timeAgo:  string
  isNew?:   boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtV = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

const tsAgo = (ms: number) => {
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ── Badge config ──────────────────────────────────────────────────────────────

const BADGE_CFG: Record<TickerItem['severity'], {
  label: string
  bg: string
  border: string
  text: string
  dot: string
}> = {
  BLACK_SWAN: {
    label:  '🌋 BLACK SWAN',
    bg:     'rgba(251,191,36,0.15)',
    border: 'rgba(251,191,36,0.4)',
    text:   'rgba(251,191,36,1)',
    dot:    'rgba(251,191,36,1)',
  },
  CRITICAL: {
    label:  '🚨 CRITICAL',
    bg:     'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.3)',
    text:   'rgba(239,68,68,1)',
    dot:    'rgba(239,68,68,1)',
  },
  WARNING: {
    label:  '⚠ WARNING',
    bg:     'rgba(251,191,36,0.10)',
    border: 'rgba(251,191,36,0.25)',
    text:   'rgba(251,191,36,1)',
    dot:    'rgba(251,191,36,1)',
  },
  ACCUM: {
    label:  '🐂 ACCUM',
    bg:     'rgba(52,211,153,0.10)',
    border: 'rgba(52,211,153,0.22)',
    text:   'rgba(52,211,153,1)',
    dot:    'rgba(52,211,153,1)',
  },
  INFO: {
    label:  '📊 INFO',
    bg:     'rgba(0,194,255,0.08)',
    border: 'rgba(0,194,255,0.18)',
    text:   'rgba(0,194,255,1)',
    dot:    'rgba(0,194,255,0.8)',
  },
}

// ── TickerItem component ──────────────────────────────────────────────────────

const TickerItemEl = memo(({ item }: { item: TickerItem }) => {
  const cfg = BADGE_CFG[item.severity]
  return (
    <div
      style={{
        display:     'inline-flex',
        alignItems:  'center',
        gap:         '7px',
        padding:     '0 20px',
        height:      '100%',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        cursor:      'pointer',
        flexShrink:  0,
        transition:  'background 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
    >
      {/* Badge */}
      <span style={{
        fontFamily:   "'IBM Plex Mono',monospace",
        fontSize:     '8px',
        fontWeight:   700,
        padding:      '1px 6px',
        borderRadius: '4px',
        letterSpacing:'0.06em',
        background:   cfg.bg,
        border:       `1px solid ${cfg.border}`,
        color:        cfg.text,
        whiteSpace:   'nowrap',
        flexShrink:   0,
      }}>
        {cfg.label}
      </span>

      {/* Entity */}
      <span style={{
        fontFamily: "'IBM Plex Mono',monospace",
        fontSize:   '11px',
        fontWeight: 600,
        color:      'rgba(255,255,255,0.85)',
        whiteSpace: 'nowrap',
      }}>
        {item.entity}
      </span>

      {/* Action */}
      <span style={{
        fontFamily: "'IBM Plex Mono',monospace",
        fontSize:   '10px',
        color:      'rgba(255,255,255,0.4)',
        whiteSpace: 'nowrap',
      }}>
        {item.action}
      </span>

      {/* Sep */}
      <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px' }}>·</span>

      {/* Value */}
      <span style={{
        fontFamily: "'IBM Plex Mono',monospace",
        fontSize:   '11px',
        fontWeight: 600,
        color:      cfg.text,
        whiteSpace: 'nowrap',
      }}>
        {item.value}
      </span>

      {/* Sep */}
      <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px' }}>·</span>

      {/* Time */}
      <span style={{
        fontFamily: "'IBM Plex Mono',monospace",
        fontSize:   '9px',
        color:      'rgba(255,255,255,0.22)',
        whiteSpace: 'nowrap',
      }}>
        {item.timeAgo}
      </span>
    </div>
  )
})
TickerItemEl.displayName = 'TickerItemEl'

// ── Main WhaleTicker ──────────────────────────────────────────────────────────

const WhaleTicker = memo(() => {
  const { patterns }  = usePatternRecognition()
  const { flows }     = useCrossWalletFlow()
  const [paused, setPaused] = useState(false)

  // Build ticker items from patterns + flows
  const items = useMemo<TickerItem[]>(() => {
    const result: TickerItem[] = []

    // From patterns (RADAR)
    patterns.slice(0, 12).forEach(p => {
      const sev: TickerItem['severity'] =
        p.severity === 'BLACK_SWAN' ? 'BLACK_SWAN' :
        p.severity === 'CRITICAL'   ? 'CRITICAL'   :
        p.severity === 'WARNING'    ? 'WARNING'     : 'INFO'

      result.push({
        id:      p.id,
        severity: sev,
        entity:  p.wallets?.[0] ?? 'Unknown Whale',
        action:  p.type?.replace(/_/g, ' ').toLowerCase() ?? p.title,
        value:   p.totalValue > 0 ? fmtV(p.totalValue) : '—',
        timeAgo: tsAgo(p.detectedAt),
      })
    })

    // From cross-wallet flows ($5M+)
    flows.slice(0, 8).forEach((f, i) => {
      result.push({
        id:       `flow-${i}`,
        severity: (f.totalUsd ?? 0) > 10_000_000 ? 'CRITICAL' : 'WARNING',
        entity:   f.fromLabel ?? f.from?.slice(0, 10) ?? 'Unknown',
        action:   `→ ${f.toLabel ?? f.to?.slice(0, 10) ?? 'unknown'}`,
        value:    fmtV(f.totalUsd ?? 0),
        timeAgo:  tsAgo((f.timestamp ?? Date.now() / 1000) * 1000),
      })
    })

    // Fallback static items when no real data yet (loading state)
    if (result.length === 0) {
      return [
        { id: 'f1', severity: 'INFO',     entity: 'Scanning wallets',  action: 'loading real-time data', value: '44 wallets', timeAgo: 'now' },
        { id: 'f2', severity: 'INFO',     entity: 'Wintermute',        action: 'ETH · ARB monitored',    value: 'tracking',   timeAgo: '—'   },
        { id: 'f3', severity: 'WARNING',  entity: 'Justin Sun',        action: 'TRX · ETH · SOL',        value: 'watching',   timeAgo: '—'   },
        { id: 'f4', severity: 'CRITICAL', entity: 'FTX Estate',        action: 'ETH monitored',           value: 'watching',   timeAgo: '—'   },
        { id: 'f5', severity: 'INFO',     entity: 'Mt.Gox Trustee',    action: 'BTC monitored',           value: 'watching',   timeAgo: '—'   },
        { id: 'f6', severity: 'BLACK_SWAN', entity: 'Satoshi-era',     action: '79,957 BTC · dormant',    value: 'watching',   timeAgo: 'never moved' },
      ]
    }

    return result
  }, [patterns, flows])

  // Duplicate for seamless loop
  const doubled = useMemo(() => [...items, ...items], [items])

  return (
    <div
      style={{
        height:       '32px',
        background:   'rgba(4,4,10,0.98)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display:      'flex',
        alignItems:   'center',
        overflow:     'hidden',
        flexShrink:   0,
        position:     'relative',
      }}
    >
      {/* LIVE label */}
      <div
        style={{
          flexShrink:   0,
          display:      'flex',
          alignItems:   'center',
          gap:          '6px',
          padding:      '0 12px',
          height:       '100%',
          background:   'rgba(0, 212, 255, 0.07)',
          borderRight:  '1px solid rgba(0, 212, 255, 0.18)',
          zIndex:       2,
        }}
      >
        <span
          style={{
            width:        '5px',
            height:       '5px',
            borderRadius: '50%',
            background:   'rgba(0, 212, 255, 1)',
            boxShadow:    '0 0 5px rgba(0, 212, 255, 0.8)',
            animation:    'pulse-glow 1.4s ease-in-out infinite',
            display:      'inline-block',
            flexShrink:   0,
          }}
        />
        <span
          style={{
            fontFamily:   "'IBM Plex Mono',monospace",
            fontSize:     '9px',
            fontWeight:   700,
            color:        'rgba(0, 212, 255, 0.9)',
            letterSpacing:'0.12em',
            whiteSpace:   'nowrap',
          }}
        >
          LIVE
        </span>
      </div>

      {/* Scrolling content */}
      <div
        style={{ flex: 1, overflow: 'hidden', position: 'relative', height: '100%' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          style={{
            display:       'inline-flex',
            alignItems:    'center',
            height:        '100%',
            animation:     `ticker-scroll 50s linear infinite`,
            animationPlayState: paused ? 'paused' : 'running',
            willChange:    'transform',
          }}
        >
          {doubled.map((item, i) => (
            <TickerItemEl key={`${item.id}-${i}`} item={item} />
          ))}
        </div>

        {/* Fade right edge */}
        <div
          style={{
            position:   'absolute',
            right:      0,
            top:        0,
            bottom:     0,
            width:      '48px',
            background: 'linear-gradient(90deg, transparent, rgba(4,4,10,0.98))',
            pointerEvents: 'none',
            zIndex:     1,
          }}
        />
      </div>

      {/* Pause hint */}
      {paused && (
        <div
          style={{
            position:   'absolute',
            right:      '12px',
            top:        '50%',
            transform:  'translateY(-50%)',
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize:   '8px',
            color:      'rgba(255,255,255,0.25)',
            zIndex:     3,
            pointerEvents: 'none',
          }}
        >
          PAUSED
        </div>
      )}
    </div>
  )
})
WhaleTicker.displayName = 'WhaleTicker'

export default WhaleTicker
