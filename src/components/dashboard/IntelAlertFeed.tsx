/**
 * ZERØ WATCH — IntelAlertFeed v1
 * ================================
 * Alert feed dari zero-watch-intel CF Worker
 * Replace/extend CrossFlowPanel dengan data live dari worker
 * 3-tier: INFO / WARNING / CRITICAL
 *
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useCallback } from 'react'
import { AlertTriangle, Zap, RefreshCw, Activity, TrendingDown, Eye, Shield } from 'lucide-react'
import { useIntelData } from '@/hooks/useIntelData'
import type { IntelAlert, IntelFlow, AlertSeverity } from '@/hooks/useIntelData'
import EntityCard from './EntityCard'

// ── Config ────────────────────────────────────────────────────────────────────

const SEVERITY_CFG: Record<AlertSeverity, {
  bg: string; border: string; text: string; badge: string; badgeBg: string; emoji: string
}> = {
  CRITICAL: {
    bg:      'rgba(239,68,68,0.07)',
    border:  'rgba(239,68,68,0.30)',
    text:    'rgba(239,68,68,1)',
    badge:   'rgba(239,68,68,1)',
    badgeBg: 'rgba(239,68,68,0.14)',
    emoji:   '🚨',
  },
  WARNING: {
    bg:      'rgba(251,191,36,0.06)',
    border:  'rgba(251,191,36,0.25)',
    text:    'rgba(251,191,36,1)',
    badge:   'rgba(251,191,36,1)',
    badgeBg: 'rgba(251,191,36,0.12)',
    emoji:   '⚠️',
  },
  INFO: {
    bg:      'rgba(99,102,241,0.05)',
    border:  'rgba(99,102,241,0.18)',
    text:    'rgba(165,180,252,0.9)',
    badge:   'rgba(165,180,252,0.9)',
    badgeBg: 'rgba(99,102,241,0.10)',
    emoji:   '📊',
  },
}

const fmtAgo = (ms: number) => {
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const fmtUsd = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

// ── Alert Row ─────────────────────────────────────────────────────────────────

const AlertRow = memo(({ alert, index }: { alert: IntelAlert; index: number }) => {
  const cfg = SEVERITY_CFG[alert.severity]
  return (
    <div
      className="animate-float-up"
      style={{
        background:     cfg.bg,
        border:         `1px solid ${cfg.border}`,
        borderRadius:   '12px',
        padding:        '10px 12px',
        marginBottom:   '6px',
        animationDelay: `${index * 0.04}s`,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.filter = 'brightness(1.12)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.filter = 'brightness(1)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '12px', lineHeight: 1, flexShrink: 0, marginTop: '1px' }}>{cfg.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Severity badge */}
            <span style={{
              display: 'inline-block',
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: '7px', fontWeight: 700, letterSpacing: '0.10em',
              padding: '2px 6px', borderRadius: '5px',
              background: cfg.badgeBg, color: cfg.badge,
              marginBottom: '4px',
              animation: alert.severity === 'CRITICAL' ? 'pulse-glow 2s ease-in-out infinite' : 'none',
            }}>
              {alert.severity}
            </span>
            <p style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: '10px', lineHeight: 1.5,
              color: 'rgba(255,255,255,0.78)',
              margin: 0,
            }}>
              {alert.message}
            </p>
            {/* Confidence */}
            <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', color: 'rgba(255,255,255,0.22)' }}>
                CONFIDENCE
              </span>
              <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.07)', borderRadius: '1px', maxWidth: '60px' }}>
                <div style={{
                  height: '100%',
                  width: `${alert.confidence}%`,
                  background: cfg.text,
                  borderRadius: '1px',
                }} />
              </div>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', fontWeight: 700, color: cfg.text }}>
                {alert.confidence}%
              </span>
            </div>
          </div>
        </div>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px',
          color: 'rgba(255,255,255,0.22)', flexShrink: 0, marginTop: '2px',
        }}>
          {fmtAgo(alert.timestamp)}
        </span>
      </div>
    </div>
  )
})
AlertRow.displayName = 'AlertRow'

// ── Flow Row ──────────────────────────────────────────────────────────────────

const FlowRow = memo(({ flow, index }: { flow: IntelFlow; index: number }) => {
  const cfg = SEVERITY_CFG[flow.severity] ?? SEVERITY_CFG.INFO
  return (
    <div
      className="animate-float-up"
      style={{
        background:     cfg.bg,
        border:         `1px solid ${cfg.border}`,
        borderRadius:   '12px',
        padding:        '10px 12px',
        marginBottom:   '6px',
        animationDelay: `${index * 0.04}s`,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.filter = 'brightness(1.12)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.filter = 'brightness(1)' }}
    >
      {/* From → To */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: '9px', fontWeight: 700,
          padding: '3px 8px', borderRadius: '7px',
          background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.80)',
          border: '1px solid rgba(255,255,255,0.09)', flexShrink: 0,
        }}>
          {flow.fromLabel}
        </span>
        <span style={{ color: cfg.text, fontSize: '12px', flexShrink: 0 }}>→</span>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: '9px', fontWeight: 700,
          padding: '3px 8px', borderRadius: '7px',
          background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.80)',
          border: '1px solid rgba(255,255,255,0.09)', flexShrink: 0,
        }}>
          {flow.toLabel}
        </span>
      </div>

      {/* Signal + value + time */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: '7px', fontWeight: 700, letterSpacing: '0.08em',
            padding: '2px 6px', borderRadius: '5px',
            background: cfg.badgeBg, color: cfg.badge,
          }}>
            {flow.signalType?.replace(/_/g, ' ')}
          </span>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: '12px', fontWeight: 700,
            color: cfg.text, tabularNums: true,
          } as React.CSSProperties}>
            {fmtUsd(flow.valueUsd)}
          </span>
        </div>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', color: 'rgba(255,255,255,0.22)' }}>
          {fmtAgo(flow.timestamp)}
        </span>
      </div>
    </div>
  )
})
FlowRow.displayName = 'FlowRow'

// ── Sub-tabs ──────────────────────────────────────────────────────────────────

type IntelTab = 'ALERTS' | 'FLOWS' | 'ENTITIES'

const SUB_TABS: { id: IntelTab; label: string; Icon: React.ElementType }[] = [
  { id: 'ALERTS',   label: 'ALERTS',   Icon: AlertTriangle },
  { id: 'FLOWS',    label: 'FLOWS',    Icon: Activity },
  { id: 'ENTITIES', label: 'ENTITIES', Icon: Eye },
]

// ── Main IntelAlertFeed ───────────────────────────────────────────────────────

interface IntelAlertFeedProps {
  activeSubTab?: IntelTab
  onSubTabChange?: (t: IntelTab) => void
}

const IntelAlertFeed = memo(({ activeSubTab = 'ALERTS', onSubTabChange }: IntelAlertFeedProps) => {
  const { flows, entities, alerts, criticalAlerts, warningAlerts, loading, error, refetch, lastUpdate } = useIntelData()

  const handleTabChange = useCallback((t: IntelTab) => {
    onSubTabChange?.(t)
  }, [onSubTabChange])

  const entityList = Object.values(entities)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap style={{ width: '13px', height: '13px', color: 'rgba(0,255,148,0.8)' }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)' }}>
              ARKHAM INTEL
            </span>
            {/* Live dot */}
            {!loading && !error && (
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'rgba(0,255,148,0.9)', boxShadow: '0 0 5px rgba(0,255,148,0.7)', animation: 'pulse-glow 2s ease-in-out infinite', display: 'inline-block' }} />
            )}
          </div>
          <button
            onClick={refetch}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', transition: 'color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(0,255,148,0.7)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.2)' }}
          >
            <RefreshCw style={{ width: '12px', height: '12px' }} />
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '10px' }}>
          {[
            { label: 'CRITICAL', value: criticalAlerts.length, color: 'rgba(239,68,68,1)', bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.20)' },
            { label: 'WARNING',  value: warningAlerts.length,  color: 'rgba(251,191,36,1)', bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.18)' },
            { label: 'FLOWS',    value: flows.length,           color: 'rgba(0,255,148,0.9)', bg: 'rgba(0,255,148,0.04)', border: 'rgba(0,255,148,0.15)' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '10px', padding: '8px 10px', textAlign: 'center' as const }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '7px', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', marginBottom: '3px' }}>
                {s.label}
              </div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '20px', fontWeight: 700, color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
          {SUB_TABS.map(t => {
            const active = activeSubTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  padding: '6px 4px', borderRadius: '8px',
                  fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', fontWeight: 600, letterSpacing: '0.06em',
                  background: active ? 'rgba(0,255,148,0.10)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? 'rgba(0,255,148,0.30)' : 'rgba(255,255,255,0.07)'}`,
                  color: active ? 'rgba(0,255,148,1)' : 'rgba(255,255,255,0.35)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <t.Icon style={{ width: '9px', height: '9px' }} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', minHeight: 0 }}>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[1,2,3].map(i => (
              <div key={i} className="shimmer" style={{ height: '64px', borderRadius: '12px', animationDelay: `${i*0.1}s` }} />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{
            textAlign: 'center' as const, padding: '24px 16px', borderRadius: '12px',
            background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)',
          }}>
            <Shield style={{ width: '20px', height: '20px', color: 'rgba(239,68,68,0.5)', margin: '0 auto 8px' }} />
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(239,68,68,0.7)', margin: 0 }}>
              {error}
            </p>
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.2)', margin: '4px 0 0' }}>
              Worker mungkin lagi warm-up, coba refresh
            </p>
          </div>
        )}

        {/* ALERTS tab */}
        {!loading && !error && activeSubTab === 'ALERTS' && (
          alerts.length === 0 ? (
            <div style={{ textAlign: 'center' as const, padding: '32px 16px' }}>
              <Shield style={{ width: '24px', height: '24px', color: 'rgba(0,255,148,0.3)', margin: '0 auto 8px' }} />
              <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                No alerts — market quiet
              </p>
              <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.15)', margin: '4px 0 0' }}>
                Monitoring 37 whale wallets · cron 1min
              </p>
            </div>
          ) : (
            <div>
              {alerts.map((a, i) => <AlertRow key={a.id} alert={a} index={i} />)}
            </div>
          )
        )}

        {/* FLOWS tab */}
        {!loading && !error && activeSubTab === 'FLOWS' && (
          flows.length === 0 ? (
            <div style={{ textAlign: 'center' as const, padding: '32px 16px' }}>
              <Activity style={{ width: '24px', height: '24px', color: 'rgba(255,255,255,0.15)', margin: '0 auto 8px' }} />
              <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                No $5M+ cross-wallet flows detected
              </p>
              <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.15)', margin: '4px 0 0' }}>
                Threshold: $5M+ transfers between labeled whales
              </p>
            </div>
          ) : (
            <div>
              {flows.map((f, i) => <FlowRow key={f.id} flow={f} index={i} />)}
            </div>
          )
        )}

        {/* ENTITIES tab */}
        {!loading && !error && activeSubTab === 'ENTITIES' && (
          entityList.length === 0 ? (
            <div style={{ textAlign: 'center' as const, padding: '32px 16px' }}>
              <Eye style={{ width: '24px', height: '24px', color: 'rgba(255,255,255,0.15)', margin: '0 auto 8px' }} />
              <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'rgba(255,255,255,0.25)', margin: 0 }}>
                Entity data loading...
              </p>
              <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: 'rgba(255,255,255,0.15)', margin: '4px 0 0' }}>
                Worker sedang build entity map dari Etherscan
              </p>
            </div>
          ) : (
            <div>
              {entityList.map((e, i) => <EntityCard key={e.address} entity={e} index={i} />)}
            </div>
          )
        )}

        {/* Last update */}
        {lastUpdate && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '8px' }}>
            <Clock style={{ width: '9px', height: '9px', color: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '8px', color: 'rgba(255,255,255,0.15)' }}>
              Updated {fmtAgo(lastUpdate)} · 60s auto-refresh
            </span>
          </div>
        )}
      </div>
    </div>
  )
})

IntelAlertFeed.displayName = 'IntelAlertFeed'
export default IntelAlertFeed
