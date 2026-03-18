/**
 * ZERØ WATCH — PatternPanel v1
 * ==============================
 * UI untuk usePatternRecognition
 * Deteksi & display koordinasi 3+ market makers
 *
 * rgba() only ✓  React.memo + displayName ✓  useCallback ✓
 */

import React, { memo, useCallback } from 'react'
import { AlertTriangle, RefreshCw, Activity, Clock, ExternalLink, Zap, Shield } from 'lucide-react'
import { usePatternRecognition } from '@/hooks/usePatternRecognition'
import type { PatternEvent, PatternSeverity } from '@/hooks/usePatternRecognition'

// ── Config ────────────────────────────────────────────────────────────────────

const SEV: Record<PatternSeverity, { bg: string; border: string; text: string; badgeBg: string; glow: string }> = {
  CRITICAL: {
    bg:      'rgba(239,68,68,0.08)',
    border:  'rgba(239,68,68,0.32)',
    text:    'rgba(239,68,68,1)',
    badgeBg: 'rgba(239,68,68,0.15)',
    glow:    '0 0 20px rgba(239,68,68,0.12)',
  },
  WARNING: {
    bg:      'rgba(251,191,36,0.07)',
    border:  'rgba(251,191,36,0.26)',
    text:    'rgba(251,191,36,1)',
    badgeBg: 'rgba(251,191,36,0.13)',
    glow:    '0 0 16px rgba(251,191,36,0.10)',
  },
  INFO: {
    bg:      'rgba(99,102,241,0.06)',
    border:  'rgba(99,102,241,0.20)',
    text:    'rgba(165,180,252,0.9)',
    badgeBg: 'rgba(99,102,241,0.12)',
    glow:    'none',
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

// ── Confidence Bar ─────────────────────────────────────────────────────────────

const ConfBar = memo(({ value, color }: { value: number; color: string }) => (
  <div style={{ marginTop: '8px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.25)' }}>
        CONFIDENCE
      </span>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 700, color }}>
        {value}%
      </span>
    </div>
    <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${value}%`,
        background: color, borderRadius: '2px',
        boxShadow: `0 0 6px ${color.replace(',1)', ',0.5)')}`,
        transition: 'width 0.7s cubic-bezier(0.22,1,0.36,1)',
      }} />
    </div>
  </div>
))
ConfBar.displayName = 'ConfBar'

// ── Pattern Card ──────────────────────────────────────────────────────────────

const PatternCard = memo(({ pattern, index }: { pattern: PatternEvent; index: number }) => {
  const cfg = SEV[pattern.severity]

  const handleTx = useCallback((hash: string, e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(`https://etherscan.io/tx/${hash}`, '_blank', 'noopener')
  }, [])

  return (
    <div
      className="animate-float-up"
      style={{
        background:     cfg.bg,
        border:         `1px solid ${cfg.border}`,
        borderRadius:   '14px',
        padding:        '12px',
        marginBottom:   '8px',
        boxShadow:      cfg.glow,
        animationDelay: `${index * 0.05}s`,
        position:       'relative',
        overflow:       'hidden',
        transition:     'filter 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.filter = 'brightness(1.10)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.filter = 'brightness(1)' }}
    >
      {/* Top glow line */}
      <div style={{
        position: 'absolute', top: 0, left: '8%', right: '8%', height: '1px',
        background: `linear-gradient(90deg, transparent, ${cfg.text.replace(',1)', ',0.40)')}, transparent)`,
        pointerEvents: 'none',
      }} />

      {/* Row 1: emoji + title + severity + time */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '14px', lineHeight: 1, flexShrink: 0 }}>{pattern.emoji}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' as const }}>
              <span style={{
                fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', fontWeight: 700,
                color: 'rgba(255,255,255,0.90)',
              }}>
                {pattern.title}
              </span>
              {/* Severity badge */}
              <span style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: '7px', fontWeight: 700, letterSpacing: '0.09em',
                padding: '2px 6px', borderRadius: '5px',
                background: cfg.badgeBg, color: cfg.text,
                animation: pattern.severity === 'CRITICAL' ? 'pulse-glow 2s ease-in-out infinite' : 'none',
                flexShrink: 0,
              }}>
                {pattern.severity}
              </span>
            </div>
          </div>
        </div>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px',
          color: 'rgba(255,255,255,0.22)', flexShrink: 0, marginTop: '2px', marginLeft: '8px',
        }}>
          {fmtAgo(pattern.lastSeen)}
        </span>
      </div>

      {/* Row 2: description */}
      <p style={{
        fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', lineHeight: 1.55,
        color: 'rgba(255,255,255,0.55)', margin: '0 0 8px',
      }}>
        {pattern.description}
      </p>

      {/* Row 3: actors */}
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px', marginBottom: '8px' }}>
        {pattern.actors.map((actor, i) => (
          <span key={i} style={{
            fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 600,
            padding: '3px 8px', borderRadius: '7px',
            background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)',
            border: '1px solid rgba(255,255,255,0.10)',
          }}>
            {actor}
          </span>
        ))}
      </div>

      {/* Row 4: total USD + tx links */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace", fontSize: '13px', fontWeight: 700,
          color: cfg.text,
        }}>
          {fmtUsd(pattern.totalUsd)}
          <span style={{ fontSize: '9px', fontWeight: 400, color: 'rgba(255,255,255,0.30)', marginLeft: '4px' }}>
            total
          </span>
        </span>
        {/* First tx link */}
        {pattern.txHashes[0] && (
          <button
            onClick={e => handleTx(pattern.txHashes[0], e)}
            style={{
              display: 'flex', alignItems: 'center', gap: '3px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px',
              color: 'rgba(255,255,255,0.20)', transition: 'color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(0, 212, 255, 0.7)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.20)' }}
          >
            <ExternalLink style={{ width: '9px', height: '9px' }} />
            {pattern.txHashes[0].slice(0, 8)}…
            {pattern.txHashes.length > 1 && ` +${pattern.txHashes.length - 1}`}
          </button>
        )}
      </div>

      {/* Confidence bar */}
      <ConfBar value={pattern.confidence} color={cfg.text} />
    </div>
  )
})
PatternCard.displayName = 'PatternCard'

// ── PatternPanel ──────────────────────────────────────────────────────────────

const PatternPanel = memo(() => {
  const {
    patterns, criticalPatterns, warningPatterns,
    loading, error, lastScan, refetch,
  } = usePatternRecognition()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px 10px', flexShrink: 0 }}>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity style={{ width: '13px', height: '13px', color: 'rgba(251,191,36,0.8)' }} />
            <span style={{
              fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 700,
              letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)',
            }}>
              PATTERN RECOGNITION
            </span>
            {!loading && !error && (
              <span style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: 'rgba(251,191,36,0.9)', boxShadow: '0 0 5px rgba(251,191,36,0.7)',
                animation: 'pulse-glow 2s ease-in-out infinite', display: 'inline-block',
              }} />
            )}
          </div>
          <button
            onClick={refetch}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.20)', transition: 'color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(251,191,36,0.7)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.20)' }}
          >
            <RefreshCw style={{ width: '12px', height: '12px' }} />
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '10px' }}>
          {[
            { label: 'CRITICAL', value: criticalPatterns.length, color: 'rgba(239,68,68,1)', bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.20)' },
            { label: 'WARNING',  value: warningPatterns.length,  color: 'rgba(251,191,36,1)', bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.18)' },
            { label: 'TOTAL',    value: patterns.length,          color: 'rgba(0, 212, 255, 0.9)', bg: 'rgba(0, 212, 255, 0.04)', border: 'rgba(0, 212, 255, 0.15)' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '10px', padding: '8px', textAlign: 'center' as const }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '7px', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', marginBottom: '3px' }}>
                {s.label}
              </div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '20px', fontWeight: 700, color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '10px', padding: '8px 10px', marginBottom: '4px',
        }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '7px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.20)', marginBottom: '6px' }}>
            DETECTION RULES
          </div>
          {[
            { emoji: '🚨', rule: '3+ MM → CEX (30min)',      conf: '85%', color: 'rgba(239,68,68,1)' },
            { emoji: '🚨', rule: 'Justin Sun + MM → CEX',   conf: '88%', color: 'rgba(239,68,68,1)' },
            { emoji: '⚠️', rule: '2 MM → CEX (30min)',       conf: '72%', color: 'rgba(251,191,36,1)' },
            { emoji: '👀', rule: 'MM ↔ MM coordination',     conf: '65%', color: 'rgba(251,191,36,1)' },
            { emoji: '🌊', rule: 'Single sweep $20M+',        conf: '70%', color: 'rgba(251,191,36,1)' },
          ].map(r => (
            <div key={r.rule} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '9px' }}>{r.emoji}</span>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', color: 'rgba(255,255,255,0.38)' }}>{r.rule}</span>
              </div>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', fontWeight: 700, color: r.color }}>{r.conf}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', minHeight: 0 }}>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[1,2,3].map(i => (
              <div key={i} className="shimmer" style={{ height: '100px', borderRadius: '14px', animationDelay: `${i*0.1}s` }} />
            ))}
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center' as const, padding: '24px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}>
            <Zap style={{ width: '20px', height: '20px', color: 'rgba(239,68,68,0.5)', margin: '0 auto 8px' }} />
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(239,68,68,0.7)', margin: 0 }}>
              {error}
            </p>
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.2)', margin: '4px 0 0' }}>
              Proxy URL required — set VITE_PROXY_URL
            </p>
          </div>
        )}

        {!loading && !error && patterns.length === 0 && (
          <div style={{ textAlign: 'center' as const, padding: '32px 16px' }}>
            <Shield style={{ width: '28px', height: '28px', color: 'rgba(0, 212, 255, 0.3)', margin: '0 auto 10px' }} />
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', margin: '0 0 4px' }}>
              No patterns detected
            </p>
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.18)', margin: 0 }}>
              Monitoring Wintermute, Jump, DWF, Justin Sun
            </p>
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.14)', margin: '3px 0 0' }}>
              Scanning 30min coordination windows · $1M+ threshold
            </p>
          </div>
        )}

        {!loading && !error && patterns.length > 0 && (
          <div>
            {patterns.map((p, i) => (
              <PatternCard key={p.id} pattern={p} index={i} />
            ))}
          </div>
        )}

        {lastScan && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '8px' }}>
            <Clock style={{ width: '9px', height: '9px', color: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', color: 'rgba(255,255,255,0.15)' }}>
              Scanned {fmtAgo(lastScan)} · 60s auto-scan
            </span>
          </div>
        )}
      </div>
    </div>
  )
})

PatternPanel.displayName = 'PatternPanel'
export default PatternPanel
