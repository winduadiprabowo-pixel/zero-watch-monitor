/**
 * ZERØ WATCH — WhaleAlertToggle v2
 * ===================================
 * v2: Tampilkan recentAlerts count badge + tooltip last alert
 * rgba() only ✓  React.memo + displayName ✓
 */

import { memo } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'
import type { WhaleAlertsState } from '@/hooks/useWhaleAlerts'

interface Props {
  alerts:  WhaleAlertsState
  compact?: boolean
}

const WhaleAlertToggle = memo(({ alerts, compact }: Props) => {
  const { enabled, permission, alertCount, lastAlert, toggle } = alerts

  const isUnsupported = permission === 'unsupported'
  const isDenied      = permission === 'denied'
  const hasAlerts     = alertCount > 0

  const Icon = hasAlerts && enabled ? BellRing : enabled ? Bell : BellOff

  const color = isDenied
    ? 'rgba(239,68,68,0.6)'
    : enabled
      ? hasAlerts ? 'rgba(251,191,36,1)' : 'rgba(0,255,148,0.8)'
      : 'rgba(255,255,255,0.25)'

  const borderColor = isDenied
    ? 'rgba(239,68,68,0.2)'
    : enabled
      ? hasAlerts ? 'rgba(251,191,36,0.3)' : 'rgba(0,255,148,0.25)'
      : 'rgba(255,255,255,0.08)'

  const bg = enabled
    ? hasAlerts ? 'rgba(251,191,36,0.08)' : 'rgba(0,255,148,0.05)'
    : 'rgba(255,255,255,0.03)'

  const title = isDenied
    ? 'Notifications blocked — check browser settings'
    : isUnsupported
      ? 'In-app alerts only (browser push not supported)'
      : enabled
        ? lastAlert ? `Last: ${lastAlert}` : 'Alerts ON — watching for big moves'
        : 'Enable whale move alerts'

  return (
    <button
      onClick={toggle}
      title={title}
      className="relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all active:scale-95"
      style={{ background: bg, border: `1px solid ${borderColor}` }}
      onMouseEnter={e => {
        if (!isDenied && !enabled) {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,255,148,0.2)'
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = borderColor
      }}
    >
      <Icon
        className={`flex-shrink-0 ${hasAlerts && enabled ? 'animate-bounce' : ''}`}
        style={{ width: compact ? '13px' : '14px', height: compact ? '13px' : '14px', color }}
      />
      {!compact && (
        <span className="text-[9px] font-mono" style={{ color }}>
          {isDenied ? 'BLOCKED' : enabled ? 'ALERTS ON' : 'ALERTS'}
        </span>
      )}

      {/* Alert count badge */}
      {hasAlerts && alertCount > 0 && (
        <span
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-mono font-bold"
          style={{
            background: 'rgba(251,191,36,1)',
            color:      'rgba(0,0,0,0.9)',
          }}
        >
          {alertCount > 9 ? '9+' : alertCount}
        </span>
      )}
    </button>
  )
})

WhaleAlertToggle.displayName = 'WhaleAlertToggle'
export default WhaleAlertToggle
