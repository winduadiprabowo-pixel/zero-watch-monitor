/**
 * ZERØ WATCH — WalletSidebar v23
 * ================================
 * v23 REDESIGN:
 * - Collapsible sidebar with toggle
 * - Wallet rows: compact list (not cards)
 * - Selected: neon left border + bg tint
 * - Hover: smooth translate + glow
 * - Notes textarea inline
 * - Wallet count badge
 * rgba() only ✓  React.memo + displayName ✓
 */

import React, { memo, useMemo, useCallback, useState } from 'react'
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Wallet, WalletTag, filterTags } from '@/data/mockData'
import { useWalletStore, selectWallets } from '@/store/walletStore'

interface WalletSidebarProps {
  wallets:          Wallet[]
  selectedWalletId: string | null
  activeFilter:     string
  searchQuery:      string
  onSelectWallet:   (id: string) => void
  onFilterChange:   (tag: string) => void
  onSearchChange:   (q: string) => void
  mobile?:          boolean
}

const tagCfg: Record<WalletTag, { bg: string; text: string; border: string }> = {
  'CEX Whale':    { bg: 'rgba(245,158,11,0.10)',  text: 'rgba(252,196,60,1)',   border: 'rgba(245,158,11,0.25)' },
  'DeFi Insider': { bg: 'rgba(59,130,246,0.10)',  text: 'rgba(147,197,253,1)',  border: 'rgba(59,130,246,0.25)' },
  'Smart Money':  { bg: 'rgba(0, 212, 255, 0.08)',   text: 'rgba(0, 212, 255, 0.9)',  border: 'rgba(0, 212, 255, 0.22)' },
  'DAO Treasury': { bg: 'rgba(139,92,246,0.10)',  text: 'rgba(167,139,250,1)',  border: 'rgba(139,92,246,0.25)' },
  'MEV Bot':      { bg: 'rgba(239,68,68,0.10)',   text: 'rgba(252,129,129,1)',  border: 'rgba(239,68,68,0.25)' },
}

const SIGNAL_DOT: Record<string, string> = {
  ACCUMULATING: 'rgba(52,211,153,1)',
  DISTRIBUTING: 'rgba(239,68,68,1)',
  HUNTING:      'rgba(251,191,36,1)',
  DORMANT:      'rgba(255,255,255,0.18)',
}

function colorToRgb(color: string): string {
  // Parse rgba(R,G,B,A) → "R,G,B"
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (m) return `${m[1]},${m[2]},${m[3]}`
  // Fallback: parse hex
  const clean = color.replace('#', '')
  const n = parseInt(clean.length === 3 ? clean.split('').map(c=>c+c).join('') : clean, 16)
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
}

// ── Wallet Row ────────────────────────────────────────────────────────────────

const WalletRow = memo(({
  wallet, isSelected, dot, onSelect, index, notes, onNotesChange
}: {
  wallet:        Wallet
  isSelected:    boolean
  dot:           string
  onSelect:      (id: string) => void
  index:         number
  notes?:        string
  onNotesChange: (id: string, notes: string) => void
}) => {
  const tagC   = tagCfg[wallet.tag as WalletTag] ?? { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.4)', border: 'rgba(255,255,255,0.1)' }
  const dotRgb = colorToRgb(dot)

  const handleClick = useCallback(() => onSelect(wallet.id), [wallet.id, onSelect])

  const logo = (wallet as typeof wallet & { logo?: string }).logo

  return (
    <div className="animate-fade-up" style={{ animationDelay: `${(index + 3) * 0.03}s` }}>
      <button
        onClick={handleClick}
        className="w-full text-left transition-all"
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '10px',
          padding:      '9px 12px',
          background:   isSelected ? `rgba(${dotRgb}, 0.07)` : 'transparent',
          borderLeft:   `2px solid ${isSelected ? dot : 'transparent'}`,
          paddingLeft:  '10px',
        }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Logo — 28px with live dot overlay */}
        <div style={{ position: 'relative', flexShrink: 0, width: '28px', height: '28px' }}>
          {logo ? (
            <img
              src={logo}
              alt={wallet.label}
              style={{ width: '28px', height: '28px', borderRadius: '7px', objectFit: 'cover', display: 'block', background: 'rgba(255,255,255,0.05)' }}
              onError={e => {
                const el = e.target as HTMLImageElement
                el.style.display = 'none'
                const fb = el.nextElementSibling as HTMLElement | null
                if (fb) fb.style.display = 'flex'
              }}
            />
          ) : null}
          {/* Fallback initials */}
          <div
            style={{
              display:        logo ? 'none' : 'flex',
              width:          '28px',
              height:         '28px',
              borderRadius:   '7px',
              background:     `rgba(${dotRgb}, 0.12)`,
              border:         `1px solid rgba(${dotRgb}, 0.22)`,
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       '10px',
              fontWeight:     700,
              fontFamily:     'IBM Plex Mono, monospace',
              color:          dot,
            }}
          >
            {wallet.label.slice(0, 2).toUpperCase()}
          </div>
          {/* Live pulse dot */}
          {wallet.active && (
            <span style={{
              position:   'absolute',
              bottom:     '-2px',
              right:      '-2px',
              width:      '7px',
              height:     '7px',
              borderRadius: '50%',
              background: dot,
              border:     '1.5px solid rgba(4,4,10,1)',
              animation:  'pulse-glow 2s ease-in-out infinite',
            }} />
          )}
        </div>

        {/* Text content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + tx badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontWeight: 600,
                fontSize:   '12px',
                color:      isSelected ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.82)',
                overflow:   'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth:   '110px',
              }}
            >
              {wallet.label}
            </span>
            {wallet.txNew > 0 && (
              <span style={{
                fontFamily:    'IBM Plex Mono, monospace',
                fontWeight:    700,
                fontSize:      '7px',
                padding:       '1px 5px',
                borderRadius:  '10px',
                background:    'rgba(0,255,136,0.10)',
                color:         'rgba(0,255,136,1)',
                border:        '1px solid rgba(0,255,136,0.22)',
                flexShrink:    0,
              }}>
                {wallet.txNew}
              </span>
            )}
          </div>
          {/* Address + tag */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '9px', color: 'rgba(255,255,255,0.20)' }}>
              {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
            </span>
            <span style={{
              fontFamily:    'IBM Plex Mono, monospace',
              fontWeight:    600,
              fontSize:      '7px',
              padding:       '1px 5px',
              borderRadius:  '4px',
              background:    tagC.bg,
              color:         tagC.text,
              border:        `1px solid ${tagC.border}`,
              flexShrink:    0,
            }}>
              {(wallet.tag ?? '').split(' ')[0].toUpperCase()}
            </span>
          </div>
        </div>

        {/* Balance */}
        <span style={{
          fontFamily:  'IBM Plex Mono, monospace',
          fontWeight:  600,
          fontSize:    '11px',
          color:       'rgba(255,255,255,0.75)',
          flexShrink:  0,
          tabularNums: true,
        }}>
          {wallet.balance}
        </span>
      </button>

      {/* Notes — only when selected */}
      {isSelected && (
        <div className="pb-2" style={{ paddingLeft: '50px', paddingRight: '12px' }} onClick={e => e.stopPropagation()}>
          <textarea
            placeholder="Notes… insider, fund, thesis"
            value={notes ?? ''}
            onChange={e => onNotesChange(wallet.id, e.target.value)}
            rows={2}
            style={{
              width:        '100%',
              background:   'rgba(255,255,255,0.03)',
              border:       '1px solid rgba(255,255,255,0.07)',
              borderRadius: '6px',
              color:        'rgba(255,255,255,0.55)',
              fontSize:     '9px',
              fontFamily:   "'IBM Plex Mono', monospace",
              padding:      '6px 8px',
              outline:      'none',
              resize:       'none',
              lineHeight:   1.5,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,255,136,0.2)' }}
            onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
          />
        </div>
      )}
    </div>
  )
})
WalletRow.displayName = 'WalletRow'

// ── Main WalletSidebar ────────────────────────────────────────────────────────

const WalletSidebar = memo(({
  wallets, selectedWalletId, activeFilter, searchQuery,
  onSelectWallet, onFilterChange, onSearchChange, mobile,
}: WalletSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const storeWallets  = useWalletStore(selectWallets)
  const updateNotes   = useWalletStore(s => s.updateNotes)
  const notesMap      = Object.fromEntries(storeWallets.map(w => [w.id, w.notes ?? '']))
  const colorMap      = useMemo(() => {
    const m: Record<string, string> = {}
    storeWallets.forEach(w => { m[w.id] = w.color })
    return m
  }, [storeWallets])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value),
    [onSearchChange]
  )
  const handleClearSearch = useCallback(() => onSearchChange(''), [onSearchChange])
  const handleNotesChange = useCallback((id: string, notes: string) => {
    updateNotes(id, notes)
  }, [updateNotes])

  if (collapsed && !mobile) {
    return (
      <aside
        className="flex flex-col items-center py-4 gap-3 flex-shrink-0"
        style={{ width: '48px', background: 'rgba(4,4,10,0.85)', borderRight: '1px solid rgba(255,255,255,0.065)' }}
      >
        <button
          onClick={() => setCollapsed(false)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          style={{ background: 'rgba(0, 212, 255, 0.08)', border: '1px solid rgba(0, 212, 255, 0.20)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0, 212, 255, 0.14)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0, 212, 255, 0.08)' }}
        >
          <ChevronRight className="w-3.5 h-3.5" style={{ color: 'rgba(0, 212, 255, 0.8)' }} />
        </button>
        {/* Mini wallet dots */}
        <div className="flex flex-col gap-1.5 mt-2">
          {wallets.slice(0, 12).map(w => (
            <button
              key={w.id}
              onClick={() => { setCollapsed(false); onSelectWallet(w.id) }}
              className="w-2.5 h-2.5 rounded-full transition-all"
              title={w.label}
              style={{
                background: w.id === selectedWalletId ? (colorMap[w.id] ?? 'rgba(0, 212, 255, 1)') : 'rgba(255,255,255,0.14)',
                boxShadow:  w.id === selectedWalletId ? `0 0 6px ${colorMap[w.id] ?? 'rgba(0, 212, 255, 1)'}` : 'none',
              }}
            />
          ))}
          {wallets.length > 12 && (
            <span className="font-mono text-center" style={{ fontSize: '7px', color: 'rgba(255,255,255,0.2)' }}>
              +{wallets.length - 12}
            </span>
          )}
        </div>
      </aside>
    )
  }

  return (
    <aside
      className={`flex flex-col h-full animate-fade-up ${mobile ? 'w-full' : 'w-[256px] min-w-[256px]'}`}
      style={{ background: 'rgba(4,4,10,0.85)', borderRight: '1px solid rgba(255,255,255,0.065)' }}
    >
      {/* Search + collapse */}
      <div className="px-3 pt-3 pb-2 flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.20)' }}
          />
          <input
            type="text"
            placeholder="Search…"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full rounded-xl pl-7 pr-7 py-2 font-mono outline-none transition-all"
            style={{ fontSize: '11px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.28)' }}
            onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
          {searchQuery && (
            <button onClick={handleClearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.30)' }} />
            </button>
          )}
        </div>
        {!mobile && (
          <button
            onClick={() => setCollapsed(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.14)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
          >
            <ChevronLeft className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.35)' }} />
          </button>
        )}
      </div>

      {/* Filter tags — horizontal scroll */}
      <div className="px-3 pb-2 flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {filterTags.map(tag => {
          const isActive = activeFilter === tag
          return (
            <button
              key={tag}
              onClick={() => onFilterChange(tag)}
              className="font-mono px-2 py-1 rounded-lg transition-all flex-shrink-0"
              style={{
                fontSize:      '8px',
                letterSpacing: '0.06em',
                background:    isActive ? 'rgba(0, 212, 255, 0.10)' : 'rgba(255,255,255,0.03)',
                border:        `1px solid ${isActive ? 'rgba(0, 212, 255, 0.30)' : 'rgba(255,255,255,0.07)'}`,
                color:         isActive ? 'rgba(0, 212, 255, 0.95)' : 'rgba(255,255,255,0.32)',
                fontWeight:    isActive ? 600 : 400,
              }}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {/* Divider + count */}
      <div className="mx-3 mb-1.5" style={{ height: '1px', background: 'rgba(255,255,255,0.055)' }} />
      <div className="px-3 pb-1.5 flex items-center justify-between">
        <span className="font-mono uppercase" style={{ fontSize: '8px', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.20)' }}>
          Wallets
        </span>
        <span
          className="font-mono font-bold px-1.5 py-0.5 rounded"
          style={{ fontSize: '8px', background: 'rgba(0, 212, 255, 0.08)', color: 'rgba(0, 212, 255, 0.7)', border: '1px solid rgba(0, 212, 255, 0.16)' }}
        >
          {wallets.length}
        </span>
      </div>

      {/* Wallet list */}
      <div className="flex-1 overflow-y-auto pl-2 pb-3">
        {wallets.length === 0 && (
          <div className="text-center py-10 font-mono" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.18)' }}>
            No wallets match filter
          </div>
        )}
        {wallets.map((w, i) => (
          <WalletRow
            key={w.id}
            wallet={w}
            isSelected={selectedWalletId === w.id}
            dot={colorMap[w.id] ?? 'rgba(0, 212, 255, 1)'}
            onSelect={onSelectWallet}
            index={i}
            notes={notesMap[w.id]}
            onNotesChange={handleNotesChange}
          />
        ))}
      </div>
    </aside>
  )
})
WalletSidebar.displayName = 'WalletSidebar'

export default WalletSidebar
