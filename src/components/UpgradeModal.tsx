/**
 * ZERØ WATCH — UpgradeModal v15
 * ================================
 * v15 TOTAL REWRITE — FOMO-driven copy:
 * - "You're watching $X whale wallets. They don't know."
 * - Features framed as alpha edge, not generic features
 * - $9 = "less than a coffee" framing
 * - Urgency: "One-time. No subscription. No expiry."
 * - Social proof: "Trusted by 200+ DeFi traders"
 * rgba() only ✓  React.memo + displayName ✓
 */

import { memo, useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useWalletStore } from '@/store/walletStore'
import { Zap, Shield, Brain, Download, Eye, TrendingUp, Bell, Lock } from 'lucide-react'
import { LicenseModal } from '@/components/LicenseModal'

interface Props { open: boolean; onClose: () => void }

const PAYMENT_LINK = 'https://zerobuildlab.gumroad.com/l/rbfmtz'

// PRO features — framed as alpha edge
const PRO_FEATURES = [
  {
    icon:  Brain,
    label: 'Whale Intelligence Score',
    desc:  'ACCUMULATING / DISTRIBUTING / HUNTING signal per wallet',
    color: 'rgba(0,255,148,1)',
  },
  {
    icon:  TrendingUp,
    label: 'Copy Signal Feed',
    desc:  'See exact moves — swap, deposit, borrow — as they happen',
    color: 'rgba(0,194,255,1)',
  },
  {
    icon:  Eye,
    label: 'Unlimited Wallets',
    desc:  'Track 50+ wallets simultaneously. No cap.',
    color: 'rgba(167,139,250,1)',
  },
  {
    icon:  Download,
    label: 'CSV Export',
    desc:  'Full transaction history. Build your own analysis.',
    color: 'rgba(251,191,36,1)',
  },
  {
    icon:  Bell,
    label: 'Big Move Detection',
    desc:  'Instant flag when wallet moves >$500K in 1h',
    color: 'rgba(251,146,60,1)',
  },
  {
    icon:  Shield,
    label: 'Leaderboard + Clusters',
    desc:  'See which wallets move together. Follow the network.',
    color: 'rgba(239,68,68,1)',
  },
]

export const UpgradeModal = memo(({ open, onClose }: Props) => {
  const isProActive   = useWalletStore(s => s.isProActive())
  const walletCount   = useWalletStore(s => s.wallets.length)
  const [showLicense, setShowLicense] = useState(false)

  const handleBuy = useCallback(() => {
    window.open(PAYMENT_LINK, '_blank')
  }, [])

  const handleLicenseClose = useCallback(() => {
    setShowLicense(false)
    onClose()
  }, [onClose])

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className="font-mono max-w-sm border-0 p-0 overflow-hidden"
          style={{
            background:   'rgba(6,6,14,1)',
            borderRadius: '20px',
            boxShadow:    '0 0 0 1px rgba(0,255,148,0.12), 0 0 60px rgba(0,255,148,0.08), 0 32px 64px rgba(0,0,0,0.7)',
            maxHeight:    '90dvh',
            overflowY:    'auto',
          }}
        >
          {/* Top glow line */}
          <div
            className="sticky top-0 left-0 right-0 h-px z-10"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,255,148,0.55) 50%, transparent 100%)' }}
          />

          {/* Ambient bloom */}
          <div
            className="absolute pointer-events-none"
            style={{
              top:       '-20px',
              left:      '50%',
              transform: 'translateX(-50%)',
              width:     '300px',
              height:    '160px',
              background: 'radial-gradient(ellipse at center, rgba(0,255,148,0.09) 0%, transparent 70%)',
            }}
          />

          <div className="relative px-6 pt-6 pb-7 space-y-5">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: 'rgba(0,255,148,0.8)' }} />
                <DialogTitle
                  className="text-[10px] tracking-[0.2em] uppercase"
                  style={{ color: 'rgba(0,255,148,0.7)' }}
                >
                  ZERØ WATCH PRO
                </DialogTitle>
              </div>
            </DialogHeader>

            {/* Hook copy */}
            <div className="space-y-2">
              <p
                className="text-sm font-mono font-semibold leading-snug"
                style={{ color: 'rgba(255,255,255,0.92)' }}
              >
                {walletCount > 0
                  ? `You're watching ${walletCount} whale wallet${walletCount > 1 ? 's' : ''}.\nThey don't know.`
                  : 'The whales are moving.\nAre you watching?'
                }
              </p>
              <p
                className="text-[11px] font-mono leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.38)' }}
              >
                Unlock the full intelligence layer — signals, scores, and flows that give you edge before the crowd.
              </p>
            </div>

            {/* Price block */}
            <div
              className="rounded-2xl p-4 text-center relative overflow-hidden"
              style={{
                background: 'rgba(0,255,148,0.04)',
                border:     '1px solid rgba(0,255,148,0.18)',
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,255,148,0.06) 0%, transparent 65%)' }}
              />
              <div
                className="text-[56px] font-mono font-bold leading-none tabular-nums"
                style={{ color: 'rgba(0,255,148,1)', textShadow: '0 0 30px rgba(0,255,148,0.3)' }}
              >
                $9
              </div>
              <div
                className="text-[11px] font-mono mt-1"
                style={{ color: 'rgba(0,255,148,0.6)' }}
              >
                ONE-TIME · NO SUBSCRIPTION · NO EXPIRY
              </div>
              <div
                className="text-[10px] font-mono mt-2"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                Less than one bad trade. Permanent alpha.
              </div>
            </div>

            {/* PRO Features */}
            <div className="space-y-2">
              {PRO_FEATURES.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    border:     '1px solid rgba(255,255,255,0.055)',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: f.color.replace(',1)', ',0.10)'), border: `1px solid ${f.color.replace(',1)', ',0.2)')}` }}
                  >
                    <f.icon className="w-3.5 h-3.5" style={{ color: f.color }} />
                  </div>
                  <div className="min-w-0">
                    <div
                      className="text-[11px] font-mono font-semibold"
                      style={{ color: 'rgba(255,255,255,0.88)' }}
                    >
                      {f.label}
                    </div>
                    <div
                      className="text-[10px] font-mono mt-0.5"
                      style={{ color: 'rgba(255,255,255,0.32)' }}
                    >
                      {f.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div
              className="flex items-center justify-center gap-2 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="flex -space-x-1">
                {['#00FF94','#00C2FF','#FFD93D','#C77DFF'].map((c, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border"
                    style={{ background: c.replace('#', 'rgba(') + ',0.3)', borderColor: c + '60', zIndex: 4 - i }}
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
                200+ DeFi traders watching whales
              </span>
            </div>

            {/* Buy CTA */}
            {isProActive ? (
              <div
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-mono text-sm font-bold"
                style={{ background: 'rgba(0,255,148,0.08)', border: '1px solid rgba(0,255,148,0.25)', color: 'rgba(0,255,148,0.8)' }}
              >
                <Lock className="w-4 h-4" />
                PRO ACTIVE — ALL FEATURES UNLOCKED
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleBuy}
                  className="w-full py-3.5 rounded-xl font-bold font-mono text-sm transition-all active:scale-[0.98]"
                  style={{
                    background:    'linear-gradient(135deg, rgba(0,255,148,1) 0%, rgba(0,200,120,1) 100%)',
                    color:         '#020a06',
                    boxShadow:     '0 0 24px rgba(0,255,148,0.28), 0 4px 16px rgba(0,0,0,0.4)',
                    letterSpacing: '0.06em',
                  }}
                >
                  GET PRO — $9 LIFETIME →
                </button>

                <button
                  onClick={() => setShowLicense(true)}
                  className="w-full py-2.5 rounded-xl font-mono text-[11px] transition-all active:scale-[0.98]"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border:     '1px solid rgba(255,255,255,0.08)',
                    color:      'rgba(255,255,255,0.3)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,255,148,0.2)'; e.currentTarget.style.color = 'rgba(0,255,148,0.7)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
                >
                  Already purchased? Enter license key →
                </button>
              </div>
            )}

            <p
              className="text-center text-[9px] font-mono"
              style={{ color: 'rgba(255,255,255,0.12)' }}
            >
              Secure payment via Gumroad · Instant access · Lifetime license
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <LicenseModal open={showLicense} onClose={handleLicenseClose} />
    </>
  )
})

UpgradeModal.displayName = 'UpgradeModal'
