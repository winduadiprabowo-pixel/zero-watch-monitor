/**
 * ZERØ WATCH — EntityCard v1
 * ============================
 * Arkham-style entity behavior profile per wallet
 * Shows: behavior status, tx count, volume, last seen, confidence bar
 *
 * rgba() only ✓  React.memo + displayName ✓  useCallback ✓
 */

import React, { memo, useCallback } from 'react'
import { ExternalLink, Clock, Activity, TrendingUp, TrendingDown, Eye, Zap, Minus } from 'lucide-react'
import type { IntelEntity, EntityBehavior } from '@/hooks/useIntelData'

// ── Config ────────────────────────────────────────────────────────────────────

const BEHAVIOR_CFG: Record<EntityBehavior, {
  label:    string
  emoji:    string
  bg:       string
  border:   string
  text:     string
  dot:      string
  barColor: string
  Icon:     React.ElementType
}> = {
  ACCUMULATING: {
    label:    'ACCUMULATING',
    emoji:    '🐂',
    bg:       'rgba(52,211,153,0.07)',
    border:   'rgba(52,211,153,0.25)',
    text:     'rgba(52,211,153,1)',
    dot:      'rgba(52,211,153,1)',
    barColor: 'rgba(52,211,153,1)',
    Icon:     TrendingUp,
  },
  DISTRIBUTING: {
    label:    'DISTRIBUTING',
    emoji:    '🔴',
    bg:       'rgba(239,68,68,0.07)',
    border:   'rgba(239,68,68,0.25)',
    text:     'rgba(239,68,68,1)',
    dot:      'rgba(239,68,68,1)',
    barColor: 'rgba(239,68,68,1)',
    Icon:     TrendingDown,
  },
  HIGHLY_ACTIVE: {
    label:    'HIGHLY ACTIVE',
    emoji:    '⚡',
    bg:       'rgba(251,191,36,0.07)',
    border:   'rgba(251,191,36,0.25)',
    text:     'rgba(251,191,36,1)',
    dot:      'rgba(251,191,36,1)',
    barColor: 'rgba(251,191,36,1)',
    Icon:     Zap,
  },
  ACTIVE: {
    label:    'ACTIVE',
    emoji:    '👁',
    bg:       'rgba(99,102,241,0.07)',
    border:   'rgba(99,102,241,0.22)',
    text:     'rgba(165,180,252,1)',
    dot:      'rgba(165,180,252,1)',
    barColor: 'rgba(165,180,252,1)',
    Icon:     Eye,
  },
  DORMANT: {
    label:    'DORMANT',
    emoji:    '💤',
    bg:       'rgba(255,255,255,0.03)',
    border:   'rgba(255,255,255,0.08)',
    text:     'rgba(255,255,255,0.30)',
    dot:      'rgba(255,255,255,0.18)',
    barColor: 'rgba(255,255,255,0.18)',
    Icon:     Minus,
  },
}

const fmtUsd = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

const fmtAgo = (ms: number) => {
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const truncAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`

// ── Confidence Bar ─────────────────────────────────────────────────────────────

const ConfidenceBar = memo(({ value, color }: { value: number; color: string }) => (
  <div style={{ width: '100%' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)' }}>
        CONFIDENCE
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 700, color }}>
        {value}%
      </span>
    </div>
    <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${value}%`,
        background: color,
        borderRadius: '2px',
        boxShadow: `0 0 6px ${color.replace(',1)', ',0.6)')}`,
        transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)',
      }} />
    </div>
  </div>
))
ConfidenceBar.displayName = 'ConfidenceBar'

// ── EntityCard ─────────────────────────────────────────────────────────────────

interface EntityCardProps {
  entity:  IntelEntity
  index?:  number
}

const EntityCard = memo(({ entity, index = 0 }: EntityCardProps) => {
  const cfg = BEHAVIOR_CFG[entity.behavior] ?? BEHAVIOR_CFG.DORMANT

  const handleLink = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(`https://etherscan.io/address/${entity.address}`, '_blank', 'noopener')
  }, [entity.address])

  return (
    <div
      className="animate-float-up"
      style={{
        background:     cfg.bg,
        border:         `1px solid ${cfg.border}`,
        borderRadius:   '14px',
        padding:        '12px',
        marginBottom:   '8px',
        animationDelay: `${index * 0.05}s`,
        transition:     'border-color 0.18s, background 0.18s',
        position:       'relative',
        overflow:       'hidden',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = cfg.border.replace(',0.25)', ',0.45)').replace(',0.22)', ',0.40)')
        el.style.background  = cfg.bg.replace(',0.07)', ',0.11)')
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = cfg.border
        el.style.background  = cfg.bg
      }}
    >
      {/* Ambient top glow */}
      <div style={{
        position:    'absolute',
        top:         0, left: '10%', right: '10%',
        height:      '1px',
        background:  `linear-gradient(90deg, transparent, ${cfg.text.replace(',1)', ',0.35)')}, transparent)`,
        pointerEvents: 'none',
      }} />

      {/* Row 1: label + behavior badge + link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          {/* Pulsing dot */}
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
            background: cfg.dot,
            boxShadow: entity.behavior !== 'DORMANT' ? `0 0 6px ${cfg.dot}` : 'none',
            animation: entity.behavior === 'HIGHLY_ACTIVE' ? 'pulse-glow 1.2s ease-in-out infinite' :
                       entity.behavior !== 'DORMANT' ? 'pulse-glow 2s ease-in-out infinite' : 'none',
            display: 'inline-block',
          }} />
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: '11px', fontWeight: 700,
            color: 'rgba(255,255,255,0.88)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {entity.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {/* Behavior badge */}
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: '7px', fontWeight: 700, letterSpacing: '0.08em',
            padding: '2px 6px', borderRadius: '6px',
            background: cfg.bg, border: `1px solid ${cfg.border}`,
            color: cfg.text,
          }}>
            {cfg.emoji} {cfg.label}
          </span>
          {/* Etherscan link */}
          <button
            onClick={handleLink}
            style={{ padding: '3px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.18)', transition: 'color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(0,255,148,0.7)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.18)' }}
          >
            <ExternalLink style={{ width: '10px', height: '10px' }} />
          </button>
        </div>
      </div>

      {/* Row 2: address */}
      <div style={{ marginBottom: '8px' }}>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px',
          color: 'rgba(255,255,255,0.22)',
        }}>
          {truncAddr(entity.address)}
        </span>
      </div>

      {/* Row 3: stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '8px' }}>
        {/* TX count */}
        <div style={{ textAlign: 'center' as const }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', color: 'rgba(255,255,255,0.22)', marginBottom: '2px' }}>
            TXS
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>
            {entity.txCount >= 1000 ? `${(entity.txCount / 1000).toFixed(0)}K` : entity.txCount}
          </div>
        </div>
        {/* Volume */}
        <div style={{ textAlign: 'center' as const }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', color: 'rgba(255,255,255,0.22)', marginBottom: '2px' }}>
            VOLUME
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', fontWeight: 700, color: cfg.text }}>
            {fmtUsd(entity.totalVolume)}
          </div>
        </div>
        {/* Last seen */}
        <div style={{ textAlign: 'center' as const }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', color: 'rgba(255,255,255,0.22)', marginBottom: '2px' }}>
            LAST SEEN
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.50)' }}>
            {entity.lastSeen ? fmtAgo(entity.lastSeen) : '—'}
          </div>
        </div>
      </div>

      {/* Row 4: confidence bar */}
      <ConfidenceBar value={entity.confidence} color={cfg.barColor} />
    </div>
  )
})

EntityCard.displayName = 'EntityCard'
export default EntityCard
