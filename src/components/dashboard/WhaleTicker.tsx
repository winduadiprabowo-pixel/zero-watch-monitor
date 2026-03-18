/**
 * ZERØ WATCH — WhaleTicker v2
 * ============================
 * Arkham-style scrolling ticker — redesign
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useMemo, useState } from 'react'
import { usePatternRecognition } from '@/hooks/usePatternRecognition'
import { useCrossWalletFlow }    from '@/hooks/useCrossWalletFlow'
import type { PatternEvent }     from '@/hooks/usePatternRecognition'

interface TickerItem {
  id:       string
  severity: 'CRITICAL' | 'WARNING' | 'ACCUM' | 'INFO' | 'BLACK_SWAN'
  entity:   string
  action:   string
  value:    string
  timeAgo:  string
}

const fmtV = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

const tsAgo = (ms: number) => {
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const SEV_CFG: Record<TickerItem['severity'], { label: string; color: string; bg: string; border: string }> = {
  BLACK_SWAN: { label: 'BLACK SWAN', color: 'rgba(251,191,36,1)',  bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.30)' },
  CRITICAL:   { label: 'CRITICAL',   color: 'rgba(239,68,68,1)',   bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.28)'  },
  WARNING:    { label: 'WARNING',    color: 'rgba(251,191,36,1)',  bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.22)' },
  ACCUM:      { label: 'ACCUM',      color: 'rgba(0,255,136,1)',   bg: 'rgba(0,255,136,0.08)',  border: 'rgba(0,255,136,0.20)'  },
  INFO:       { label: 'INFO',       color: 'rgba(147,197,253,1)', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.18)' },
}

const TickerItemEl = memo(({ item }: { item: TickerItem }) => {
  const cfg = SEV_CFG[item.severity]
  return (
    <div
      style={{
        display:     'inline-flex',
        alignItems:  'center',
        gap:         '8px',
        padding:     '0 18px',
        height:      '100%',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        flexShrink:  0,
        cursor:      'default',
      }}
    >
      {/* Severity dot */}
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.color, flexShrink: 0, display: 'inline-block' }} />

      {/* Badge */}
      <span style={{
        fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', fontWeight: 700,
        padding: '1px 6px', borderRadius: '3px', letterSpacing: '0.08em',
        background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {cfg.label}
      </span>

      {/* Entity */}
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.88)', whiteSpace: 'nowrap' }}>
        {item.entity}
      </span>

      {/* Action */}
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(255,255,255,0.38)', whiteSpace: 'nowrap' }}>
        {item.action}
      </span>

      <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '10px' }}>·</span>

      {/* Value */}
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', fontWeight: 700, color: cfg.color, whiteSpace: 'nowrap' }}>
        {item.value}
      </span>

      <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '10px' }}>·</span>

      {/* Time */}
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.20)', whiteSpace: 'nowrap' }}>
        {item.timeAgo}
      </span>
    </div>
  )
})
TickerItemEl.displayName = 'TickerItemEl'

const WhaleTicker = memo(() => {
  const { patterns } = usePatternRecognition()
  const { flows }    = useCrossWalletFlow()
  const [paused, setPaused] = useState(false)

  const items = useMemo<TickerItem[]>(() => {
    const result: TickerItem[] = []

    patterns.slice(0, 12).forEach(p => {
      const sev: TickerItem['severity'] =
        p.severity === 'BLACK_SWAN' ? 'BLACK_SWAN' :
        p.severity === 'CRITICAL'   ? 'CRITICAL'   :
        p.severity === 'WARNING'    ? 'WARNING'     : 'INFO'
      result.push({
        id: p.id, severity: sev,
        entity:  p.wallets?.[0] ?? 'Unknown Whale',
        action:  p.type?.replace(/_/g, ' ').toLowerCase() ?? p.title,
        value:   p.totalValue > 0 ? fmtV(p.totalValue) : '—',
        timeAgo: tsAgo(p.detectedAt),
      })
    })

    flows.slice(0, 8).forEach((f, i) => {
      result.push({
        id: `flow-${i}`,
        severity: (f.totalUsd ?? 0) > 10_000_000 ? 'CRITICAL' : 'WARNING',
        entity:  f.fromLabel ?? f.from?.slice(0, 10) ?? 'Unknown',
        action:  `→ ${f.toLabel ?? f.to?.slice(0, 10) ?? 'unknown'}`,
        value:   fmtV(f.totalUsd ?? 0),
        timeAgo: tsAgo((f.timestamp ?? Date.now() / 1000) * 1000),
      })
    })

    if (result.length === 0) {
      return [
        { id: 'f1', severity: 'INFO',       entity: 'Wintermute',     action: 'ETH · ARB monitored',   value: 'tracking',     timeAgo: '—' },
        { id: 'f2', severity: 'WARNING',     entity: 'Justin Sun',     action: 'TRX · ETH · SOL',       value: 'watching',     timeAgo: '—' },
        { id: 'f3', severity: 'CRITICAL',    entity: 'FTX Estate',     action: 'ETH monitored',          value: 'watching',     timeAgo: '—' },
        { id: 'f4', severity: 'INFO',        entity: 'Mt.Gox Trustee', action: 'BTC monitored',          value: 'watching',     timeAgo: '—' },
        { id: 'f5', severity: 'BLACK_SWAN',  entity: 'Satoshi-era',    action: '79,957 BTC · dormant',  value: 'never moved',  timeAgo: '—' },
        { id: 'f6', severity: 'ACCUM',       entity: 'Abraxas Capital','action': 'accumulating',         value: 'tracking',     timeAgo: '—' },
      ]
    }
    return result
  }, [patterns, flows])

  const doubled = useMemo(() => [...items, ...items], [items])

  return (
    <div
      style={{
        height:       '30px',
        background:   'rgba(4,4,10,1)',
        borderBottom: '1px solid rgba(255,255,255,0.055)',
        display:      'flex',
        alignItems:   'center',
        overflow:     'hidden',
        flexShrink:   0,
        position:     'relative',
      }}
    >
      {/* ZERØ WATCH label */}
      <div style={{
        flexShrink:   0,
        display:      'flex',
        alignItems:   'center',
        gap:          '7px',
        padding:      '0 14px',
        height:       '100%',
        borderRight:  '1px solid rgba(255,255,255,0.07)',
        background:   'rgba(0,255,136,0.04)',
        zIndex:       2,
      }}>
        <span style={{
          width: '5px', height: '5px', borderRadius: '50%', display: 'inline-block', flexShrink: 0,
          background: 'rgba(0,255,136,1)',
          animation: 'pulse-glow 1.4s ease-in-out infinite',
        }} />
        <span style={{
          fontFamily: 'Syne, sans-serif', fontSize: '10px', fontWeight: 700,
          color: 'rgba(0,255,136,0.9)', letterSpacing: '0.12em', whiteSpace: 'nowrap',
        }}>
          ZERØ
        </span>
      </div>

      {/* Scrolling items */}
      <div
        style={{ flex: 1, overflow: 'hidden', position: 'relative', height: '100%' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', height: '100%',
          animation: 'ticker-scroll 55s linear infinite',
          animationPlayState: paused ? 'paused' : 'running',
          willChange: 'transform',
        }}>
          {doubled.map((item, i) => (
            <TickerItemEl key={`${item.id}-${i}`} item={item} />
          ))}
        </div>
        {/* fade edge */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: '60px',
          background: 'linear-gradient(90deg, transparent, rgba(4,4,10,1))',
          pointerEvents: 'none', zIndex: 1,
        }} />
      </div>

      {paused && (
        <div style={{
          position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
          fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px',
          color: 'rgba(255,255,255,0.22)', zIndex: 3, pointerEvents: 'none',
          letterSpacing: '0.10em',
        }}>
          PAUSED
        </div>
      )}
    </div>
  )
})
WhaleTicker.displayName = 'WhaleTicker'

export default WhaleTicker
