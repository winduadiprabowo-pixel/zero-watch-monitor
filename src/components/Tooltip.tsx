/**
 * ZERØ WATCH — Tooltip v1
 * =========================
 * Lightweight hover tooltip — zero dependency.
 * Pakai pure CSS + absolute positioning.
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useState, useCallback, useRef } from 'react'

interface TooltipProps {
  content:   string
  children:  React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?:    number
}

const Tooltip = memo(({ content, children, position = 'top', delay = 300 }: TooltipProps) => {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), delay)
  }, [delay])

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
  }, [])

  const posStyle: React.CSSProperties = (() => {
    switch (position) {
      case 'top':    return { bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' }
      case 'bottom': return { top:    'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' }
      case 'left':   return { right:  'calc(100% + 6px)', top:  '50%', transform: 'translateY(-50%)' }
      case 'right':  return { left:   'calc(100% + 6px)', top:  '50%', transform: 'translateY(-50%)' }
    }
  })()

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          className="absolute z-50 pointer-events-none animate-fade-in"
          style={{
            ...posStyle,
            whiteSpace:     'nowrap',
            maxWidth:       '220px',
            whiteSpaceCollapse: 'collapse',
          }}
        >
          <span
            className="block font-mono rounded-xl px-3 py-2"
            style={{
              fontSize:    '10px',
              lineHeight:  '1.5',
              background:  'rgba(10,10,20,0.97)',
              border:      '1px solid rgba(0,255,148,0.20)',
              color:       'rgba(255,255,255,0.80)',
              boxShadow:   '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,255,148,0.08)',
              whiteSpace:  'normal',
              maxWidth:    '200px',
            }}
          >
            {content}
          </span>
        </span>
      )}
    </span>
  )
})

Tooltip.displayName = 'Tooltip'
export default Tooltip

// ── Pre-built tooltips untuk istilah ZERØ WATCH ───────────────────────────────

export const TOOLTIPS = {
  conviction:    'Score 0-100 seberapa kuat directional bet wallet ini. Makin tinggi = makin yakin dia akumul atau distribusi.',
  dormant:       'Wallet tidak ada transaksi signifikan dalam 30 hari. Bisa aktivasi kapan saja.',
  accumulating:  'Wallet lebih banyak menerima ETH daripada mengirim dalam 30 hari. Bullish signal.',
  distributing:  'Wallet lebih banyak mengirim ETH daripada menerima. Possible selling pressure.',
  hunting:       'Wallet aktif trading tapi tidak ada arah jelas. MEV bot atau active trader.',
  smartScore:    'Composite score dari balance (35%) + aktivitas 30d (35%) + whale pattern (30%).',
  cluster:       'Wallet ini gerak dalam waktu <5 menit dengan wallet lain. Kemungkinan koordinasi.',
  bigMove:       'Transaksi > $5000 dalam 1 jam terakhir dari wallet ini.',
  copySignal:    'Transaksi SWAP/DEPOSIT/BORROW dari wallet ini yang bisa di-mirror.',
  unknownWhale:  'Wallet tanpa label publik yang gerak > $1M. Bisa insider atau smart money baru.',
} as const
