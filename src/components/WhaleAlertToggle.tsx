/**
 * ZERØ WATCH — WhaleAlertToggle v20
 * ===================================
 * v20 REDESIGN — premium pill style:
 * - Animated bell icon saat alert count > 0
 * - Pulsing dot indicator saat enabled
 * - Smoother hover transitions
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo } from 'react'
import { Bell, BellOff } from 'lucide-react'
import type { WhaleAlertsState } from '@/hooks/useWhaleAlerts'

interface Props {
  alerts:   WhaleAlertsState
  compact?: boolean
}

const WhaleAlertToggle = memo(({ alerts, compact }: Props) => {
  const { permission, enabled, alertCount, toggle } = alerts

  if (permission === 'unsupported') return null

  const isDenied = permission === 'denied'

  const label = isDenied
    ? 'BLOCKED'
    : enabled
    ? `ALERTS${alertCount > 0 ? ` (${alertCount})` : ''}`
    : 'ALERTS'

  return (
    <button
      onClick={isDenied ? undefined : toggle}
      title={
        isDenied
          ? 'Notifications blocked — enable in browser settings'
          : enabled
          ? `Alerts ON — click to disable (${alertCount} fired this session)`
          : 'Enable whale move alerts (>$500K)'
      }
      disabled={isDenied}
      className="flex items-center gap-1.5 rounded-full font-mono transition-all active:scale-95"
      style={{
        padding:       compact ? '5px 10px' : '6px 12px',
        background:    isDenied
          ? 'rgba(239,68,68,0.05)'
          : enabled
          ? 'rgba(0,255,148,0.08)'
          : 'rgba(255,255,255,0.04)',
        border:        isDenied
          ? '1px solid rgba(239,68,68,0.20)'
          : enabled
          ? '1px solid rgba(0,255,148,0.35)'
          : '1px solid rgba(255,255,255,0.09)',
        color:         isDenied
          ? 'rgba(252,129,129,0.65)'
          : enabled
          ? 'rgba(0,255,148,1)'
          : 'rgba(255,255,255,0.35)',
        fontSize:      '10px',
        opacity:       isDenied ? 0.6 : 1,
        cursor:        isDenied ? 'not-allowed' : 'pointer',
        boxShadow:     enabled ? '0 0 12px rgba(0,255,148,0.12)' : 'none',
        letterSpacing: '0.04em',
      }}
    >
      {/* Pulsing dot when enabled */}
      {enabled && !isDenied && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            background: 'rgba(0,255,148,1)',
            boxShadow:  '0 0 5px rgba(0,255,148,0.8)',
            animation:  'pulse 1.8s ease-in-out infinite',
          }}
        />
      )}

      {enabled
        ? <Bell className="w-3 h-3" style={{ animation: alertCount > 0 ? 'pulse 0.8s ease-in-out 3' : 'none' }} />
        : <BellOff className="w-3 h-3" />
      }

      {!compact && <span>{label}</span>}
    </button>
  )
})
WhaleAlertToggle.displayName = 'WhaleAlertToggle'

export default WhaleAlertToggle
