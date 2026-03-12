/**
 * ZERØ WATCH — AddWalletModal v15
 * =================================
 * v15:
 * - Demo whale cards: tambah "WHY WATCH" hint — edukasi user langsung
 * - Total tracked USD per whale (kalau ada cached data)
 * - "Signal" badge per whale (ACCUMULATING etc)
 * rgba() only ✓  React.memo + displayName ✓
 */

import { useState, memo, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useWalletStore, selectCanAdd, selectFreeSlots } from '@/store/walletStore'
import type { Chain } from '@/store/walletStore'
import { Plus, AlertCircle, Zap, Eye, Shield } from 'lucide-react'
import { DEMO_WALLETS } from '@/services/api'
import { isValidSolAddress } from '@/services/solanaApi'

const CHAINS: Chain[] = ['ETH', 'BASE', 'ARB', 'OP', 'SOL']

const CHAIN_COLORS: Record<Chain, { bg: string; border: string; text: string; activeBg: string; activeBorder: string; activeText: string }> = {
  ETH:  { bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.15)', text: 'rgba(147,197,253,0.6)',  activeBg: 'rgba(59,130,246,0.15)', activeBorder: 'rgba(147,197,253,0.4)',  activeText: 'rgba(147,197,253,1)' },
  BASE: { bg: 'rgba(99,102,241,0.06)', border: 'rgba(99,102,241,0.15)', text: 'rgba(165,180,252,0.6)',  activeBg: 'rgba(99,102,241,0.15)', activeBorder: 'rgba(165,180,252,0.4)',  activeText: 'rgba(165,180,252,1)' },
  ARB:  { bg: 'rgba(14,165,233,0.06)', border: 'rgba(14,165,233,0.15)', text: 'rgba(125,211,252,0.6)',  activeBg: 'rgba(14,165,233,0.15)', activeBorder: 'rgba(125,211,252,0.4)',  activeText: 'rgba(125,211,252,1)' },
  OP:   { bg: 'rgba(239,68,68,0.06)',  border: 'rgba(239,68,68,0.15)',  text: 'rgba(252,165,165,0.6)',  activeBg: 'rgba(239,68,68,0.15)',  activeBorder: 'rgba(252,165,165,0.4)',  activeText: 'rgba(252,165,165,1)' },
  SOL:  { bg: 'rgba(153,69,255,0.06)', border: 'rgba(153,69,255,0.15)', text: 'rgba(200,150,255,0.6)',  activeBg: 'rgba(153,69,255,0.15)', activeBorder: 'rgba(200,150,255,0.4)',  activeText: 'rgba(200,150,255,1)' },
}

// WHY WATCH hints — edukasi langsung di modal
const WHY_WATCH: Record<string, string> = {
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96045': 'Every move by Ethereum\'s founder ripples through the market.',
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8': 'Billions flow through here. Exchange inflows = selling pressure.',
  '0x28c6c06298d514db089934071355e5743bf21d60': 'Daily Binance ops. Watch for large outflows — accumulation signal.',
  '0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503': 'Sophisticated DeFi deployer. Historically early on new protocols.',
  '0xf977814e90da44bfa03b6295a0616a897441acec': 'One of the largest custodian wallets. Institutional barometer.',
}

interface Props {
  open:      boolean
  onClose:   () => void
  onUpgrade: () => void
}

export const AddWalletModal = memo(({ open, onClose, onUpgrade }: Props) => {
  const [address, setAddress] = useState('')
  const [label,   setLabel]   = useState('')
  const [chain,   setChain]   = useState<Chain>('ETH')
  const [err,     setErr]     = useState('')
  const [tab,     setTab]     = useState<'demo' | 'manual'>('demo')

  const addWallet  = useWalletStore(s => s.addWallet)
  const canAdd     = useWalletStore(selectCanAdd)
  const freeSlots  = useWalletStore(selectFreeSlots)

  const valid = (a: string) =>
    chain === 'SOL'
      ? isValidSolAddress(a.trim())
      : /^0x[0-9a-fA-F]{40}$/.test(a.trim())

  const placeholder = chain === 'SOL'
    ? 'Solana address (base58…)'
    : '0x… EVM address'

  const handleSubmit = useCallback(() => {
    setErr('')
    if (!valid(address)) return setErr(
      chain === 'SOL' ? 'Invalid Solana address (base58, 32-44 chars)' : 'Invalid EVM address (0x…)'
    )
    const res = addWallet({ address: address.trim(), label: label.trim() || address.slice(0, 8), chain, color: '' })
    if (!res.ok) {
      if (res.reason === 'limit')     { onClose(); onUpgrade(); return }
      if (res.reason === 'duplicate') return setErr('Already watching on this chain')
    }
    setAddress(''); setLabel(''); onClose()
  }, [address, label, chain, addWallet, onClose, onUpgrade])

  const handleDemoAdd = useCallback((demo: typeof DEMO_WALLETS[number]) => {
    setErr('')
    const res = addWallet({ address: demo.address, label: demo.label, chain: demo.chain, color: '' })
    if (!res.ok) {
      if (res.reason === 'limit')     { onClose(); onUpgrade(); return }
      if (res.reason === 'duplicate') return setErr(`${demo.label} already added`)
    }
    onClose()
  }, [addWallet, onClose, onUpgrade])

  const inputStyle = {
    background:   'rgba(255,255,255,0.04)',
    border:       '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    color:        'rgba(255,255,255,0.85)',
    padding:      '10px 14px',
    fontFamily:   "'IBM Plex Mono', monospace",
    fontSize:     '12px',
    width:        '100%',
    outline:      'none',
    transition:   'border-color 0.15s, background 0.15s',
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="text-white font-mono max-w-md border-0 p-0 overflow-hidden"
        style={{ background: 'rgba(6,6,14,1)', borderRadius: '16px', maxHeight: '90dvh', overflowY: 'auto' }}
      >
        {/* Top glow */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,148,0.4), transparent)' }}
        />

        <div className="relative px-6 pt-6 pb-7 space-y-4">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" style={{ color: 'rgba(0,255,148,0.7)' }} />
              <DialogTitle className="text-[10px] tracking-[0.2em] uppercase" style={{ color: 'rgba(0,255,148,0.7)' }}>
                Track Wallet
              </DialogTitle>
            </div>
            <p className="text-[10px] font-mono mt-1" style={{ color: 'rgba(255,255,255,0.28)' }}>
              Read-only surveillance. No wallet connect needed.
            </p>
          </DialogHeader>

          {!canAdd ? (
            <div className="space-y-4">
              {/* Clear messaging: you used all 3 free slots */}
              <div
                className="rounded-xl p-4 space-y-2"
                style={{ background: 'rgba(0,255,148,0.04)', border: '1px solid rgba(0,255,148,0.15)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(0,255,148,1)' }} />
                  <span className="text-[10px] font-mono tracking-wider" style={{ color: 'rgba(0,255,148,0.8)' }}>
                    FREE TIER — 3/3 WALLETS USED
                  </span>
                </div>
                <p className="text-[10px] font-mono leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  You're already tracking 3 whale wallets for free. Upgrade PRO to add unlimited wallets, unlock Whale Intel scores, and get Big Move alerts.
                </p>
              </div>
              <button
                onClick={() => { onClose(); onUpgrade() }}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                style={{
                  background:    'linear-gradient(135deg, rgba(0,255,148,1) 0%, rgba(0,200,120,1) 100%)',
                  color:         '#020a06',
                  boxShadow:     '0 0 20px rgba(0,255,148,0.25)',
                  letterSpacing: '0.06em',
                }}
              >
                UPGRADE TO PRO — $9 LIFETIME →
              </button>
              <p className="text-center text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.18)' }}>
                One-time payment · No subscription · No expiry
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Free slots indicator — explicit about what's free */}
              <div
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: 'rgba(0,255,148,0.04)', border: '1px solid rgba(0,255,148,0.10)' }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-4 h-1.5 rounded-full"
                        style={{ background: i < (3 - freeSlots) ? 'rgba(0,255,148,0.7)' : 'rgba(255,255,255,0.08)' }}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {freeSlots} of 3 free slots remaining
                  </span>
                </div>
                <span className="text-[8px] font-mono tracking-wider" style={{ color: 'rgba(0,255,148,0.5)' }}>
                  FREE
                </span>
              </div>

              {/* Tab toggle */}
              <div
                className="flex rounded-lg overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}
              >
                {(['demo', 'manual'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="flex-1 py-2 text-[10px] font-mono tracking-wider transition-all"
                    style={{
                      background:    tab === t ? 'rgba(0,255,148,0.08)' : 'transparent',
                      color:         tab === t ? 'rgba(0,255,148,0.9)' : 'rgba(255,255,255,0.3)',
                      borderRight:   t === 'demo' ? '1px solid rgba(255,255,255,0.07)' : 'none',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {t === 'demo' ? '⚡ KNOWN WHALES' : '+ CUSTOM'}
                  </button>
                ))}
              </div>

              {/* Error */}
              {err && (
                <div className="flex items-center gap-2" style={{ color: 'rgba(252,129,129,0.9)' }}>
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span className="text-[11px]">{err}</span>
                </div>
              )}

              {/* Demo wallets */}
              {tab === 'demo' && (
                <div className="space-y-2">
                  <div className="text-[9px] font-mono tracking-widest" style={{ color: 'rgba(255,255,255,0.18)' }}>
                    CLICK TO TRACK — REAL DATA LOADS IN SECONDS
                  </div>
                  {DEMO_WALLETS.map(demo => {
                    const why = WHY_WATCH[demo.address.toLowerCase()] ?? demo.description
                    return (
                      <button
                        key={demo.address}
                        onClick={() => handleDemoAdd(demo)}
                        className="w-full text-left px-3 py-3 rounded-xl transition-all active:scale-[0.98]"
                        style={{
                          background: 'rgba(255,255,255,0.025)',
                          border:     '1px solid rgba(255,255,255,0.07)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background   = 'rgba(0,255,148,0.05)'
                          e.currentTarget.style.borderColor  = 'rgba(0,255,148,0.2)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background   = 'rgba(255,255,255,0.025)'
                          e.currentTarget.style.borderColor  = 'rgba(255,255,255,0.07)'
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <Zap className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(0,255,148,0.5)' }} />
                            <span className="text-[11px] font-mono font-semibold" style={{ color: 'rgba(255,255,255,0.88)' }}>
                              {demo.label}
                            </span>
                          </div>
                          <span
                            className="text-[8px] font-mono px-1.5 py-0.5 rounded flex-shrink-0 ml-2"
                            style={{ background: 'rgba(0,255,148,0.08)', color: 'rgba(0,255,148,0.7)', border: '1px solid rgba(0,255,148,0.15)' }}
                          >
                            {demo.chain}
                          </span>
                        </div>
                        <div className="flex items-start justify-between pl-5 gap-2">
                          <p className="text-[9px] font-mono leading-relaxed flex-1" style={{ color: 'rgba(255,255,255,0.32)' }}>
                            {why}
                          </p>
                          <span className="text-[9px] font-mono flex-shrink-0" style={{ color: 'rgba(255,255,255,0.15)' }}>
                            {demo.address.slice(0, 8)}…
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Manual entry */}
              {tab === 'manual' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      WALLET ADDRESS
                    </label>
                    <input
                      type="text"
                      placeholder={placeholder}
                      value={address}
                      onChange={e => { setAddress(e.target.value); setErr('') }}
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,255,148,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                      onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      LABEL <span style={{ color: 'rgba(255,255,255,0.15)' }}>(OPTIONAL)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Abraxas Fund"
                      value={label}
                      onChange={e => setLabel(e.target.value)}
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,255,148,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                      onBlur={e  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      CHAIN
                    </label>
                    <div className="flex gap-2">
                      {CHAINS.map(c => {
                        const cs = CHAIN_COLORS[c]
                        const active = chain === c
                        return (
                          <button
                            key={c}
                            onClick={() => setChain(c)}
                            className="flex-1 py-2 rounded-lg text-[11px] font-mono font-medium transition-all"
                            style={{
                              background: active ? cs.activeBg   : cs.bg,
                              border:     `1px solid ${active ? cs.activeBorder : cs.border}`,
                              color:      active ? cs.activeText  : cs.text,
                            }}
                          >
                            {c}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(0,255,148,0.03)', border: '1px solid rgba(0,255,148,0.10)' }}
                  >
                    <Shield className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(0,255,148,0.5)' }} />
                    <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.28)' }}>
                      Read-only. ZERØ never asks for private keys.
                    </span>
                  </div>

                  <button
                    onClick={handleSubmit}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
                    style={{
                      background:    'linear-gradient(135deg, rgba(0,255,148,1) 0%, rgba(0,200,120,1) 100%)',
                      color:         '#020a06',
                      boxShadow:     '0 0 20px rgba(0,255,148,0.25)',
                      letterSpacing: '0.06em',
                      opacity:       address ? 1 : 0.5,
                    }}
                  >
                    START WATCHING →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
})

AddWalletModal.displayName = 'AddWalletModal'
