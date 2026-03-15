/**
 * ZERØ WATCH — Tooltip v1
 * =========================
 * Lightweight hover tooltip — zero dependency.
 * Mobile: skip tooltip (touch users don't hover).
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
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible && (
        <span
          className="animate-fade-in"
          style={{ position: 'absolute', zIndex: 100, pointerEvents: 'none', ...posStyle }}
        >
          <span
            style={{
              display:       'block',
              fontFamily:    "'IBM Plex Mono',monospace",
              fontSize:      '10px',
              lineHeight:    1.5,
              padding:       '8px 12px',
              borderRadius:  '10px',
              background:    'rgba(10,10,20,0.97)',
              border:        '1px solid rgba(0,255,148,0.20)',
              color:         'rgba(255,255,255,0.80)',
              boxShadow:     '0 8px 24px rgba(0,0,0,0.5)',
              whiteSpace:    'normal',
              maxWidth:      '200px',
              width:         'max-content',
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

export const TOOLTIPS = {
  conviction:   'Score 0-100 seberapa kuat directional bet wallet ini. Makin tinggi = makin yakin dia akumul atau distribusi.',
  dormant:      'Tidak ada transaksi signifikan 30 hari. Bisa aktivasi kapan saja.',
  accumulating: 'Lebih banyak menerima ETH daripada mengirim 30 hari terakhir. Bullish signal.',
  distributing: 'Lebih banyak mengirim ETH daripada menerima. Possible selling pressure.',
  hunting:      'Aktif trading tapi tidak ada arah jelas. MEV bot atau active trader.',
  smartScore:   'Composite score: balance (35%) + aktivitas 30d (35%) + whale pattern (30%).',
  cluster:      'Wallet ini gerak dalam waktu <5 menit dengan wallet lain. Kemungkinan koordinasi.',
  bigMove:      'Transaksi >$5000 dalam 1 jam terakhir.',
  copySignal:   'Transaksi SWAP/DEPOSIT/BORROW yang bisa di-mirror.',
  unknownWhale: 'Wallet tanpa label publik yang gerak >$1M. Insider atau smart money baru.',
} as const
