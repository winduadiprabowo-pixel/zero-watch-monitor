/**
 * ZERØ WATCH — WhaleAlertToggle v1
 * ===================================
 * Bell button untuk enable/disable browser push notifications.
 * Tampil di desktop header area (AddBtn) dan mobile header.
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo } from 'react'
import { Bell, BellOff } from 'lucide-react'
import type { WhaleAlertsState } from '@/hooks/useWhaleAlerts'

interface Props {
  alerts: WhaleAlertsState
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

  const borderColor = isDenied
    ? 'rgba(239,68,68,0.25)'
    : enabled
    ? 'rgba(0,255,148,0.40)'
    : 'rgba(255,255,255,0.10)'

  const color = isDenied
    ? 'rgba(252,129,129,0.7)'
    : enabled
    ? 'rgba(0,255,148,1)'
    : 'rgba(255,255,255,0.35)'

  const bg = enabled
    ? 'rgba(0,255,148,0.06)'
    : 'rgba(255,255,255,0.03)'

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
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono transition-all active:scale-95"
      style={{
        background:    bg,
        border:        `1px solid ${borderColor}`,
        color,
        fontSize:      '10px',
        opacity:       isDenied ? 0.5 : 1,
        cursor:        isDenied ? 'not-allowed' : 'pointer',
        boxShadow:     enabled ? '0 0 10px rgba(0,255,148,0.12)' : 'none',
        letterSpacing: '0.04em',
      }}
    >
      {enabled
        ? <Bell className="w-3 h-3" style={{ animation: alertCount > 0 ? 'pulse 1s ease-in-out 3' : 'none' }} />
        : <BellOff className="w-3 h-3" />
      }
      {!compact && <span>{label}</span>}
    </button>
  )
})
WhaleAlertToggle.displayName = 'WhaleAlertToggle'

export default WhaleAlertToggle
