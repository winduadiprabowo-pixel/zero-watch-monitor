/**
 * ZERØ WATCH — walletStore v17
 * ==============================
 * v17: pinned field — Satoshi-Era / Mt.Gox / FTX Estate always top.
 *      Bumped persist version 3→4 to force re-seed on existing users
 *      (so pinned field gets picked up from defaultWallets).
 *
 * rgba() only ✓  persist ✓  AbortController-safe ✓
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_WHALE_WALLETS } from '@/data/defaultWallets'

export type Chain = 'ETH' | 'ARB' | 'BASE' | 'OP' | 'SOL' | 'BTC' | 'TRX' | 'BNB'

// EVM chains that should be lowercased
const EVM_CHAINS: Chain[] = ['ETH', 'ARB', 'BASE', 'OP', 'BNB']

/** Normalise address — EVM lowercase, others preserve original casing */
export function normaliseAddress(address: string, chain: Chain): string {
  return EVM_CHAINS.includes(chain)
    ? address.toLowerCase().trim()
    : address.trim()
}

export interface WatchedWallet {
  id:      string
  address: string
  label:   string
  chain:   Chain
  addedAt: number
  color:   string
  tag?:    string    // wallet category tag
  notes?:  string   // user annotation
  entity?: string   // group key for entity-row table
  pinned?: boolean  // BLACK SWAN watch — always top (Satoshi-Era / Mt.Gox / FTX Estate)
}

export type Plan = 'free' | 'pro'

export interface WalletStore {
  wallets:      WatchedWallet[]
  plan:         Plan
  proExpiresAt: number | null
  FREE_LIMIT:   number
  _seeded:      boolean

  canAddWallet: () => boolean
  isProActive:  () => boolean
  addWallet:    (w: Omit<WatchedWallet, 'id' | 'addedAt'>) => { ok: boolean; reason?: 'limit' | 'duplicate' }
  removeWallet: (id: string) => void
  updateLabel:  (id: string, label: string) => void
  updateNotes:  (id: string, notes: string) => void
  reorderWallets: (from: number, to: number) => void
  activatePro:  (expiresAt: number | null) => void
  resetToPlanFree: () => void
  seedDefaultWallets: () => void
}

const nanoid    = (len = 8) => Math.random().toString(36).slice(2, 2 + len)
const COLORS    = [
  'rgba(230,161,71,1)',
  'rgba(0,194,255,1)',
  'rgba(255,107,107,1)',
  'rgba(255,217,61,1)',
  'rgba(199,125,255,1)',
  'rgba(255,159,67,1)',
  'rgba(72,219,251,1)',
  'rgba(255,107,129,1)',
]
const pickColor = (used: string[]) => COLORS.find(c => !used.includes(c)) ?? COLORS[0]

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      wallets:      [],
      plan:         'free',
      proExpiresAt: null,
      FREE_LIMIT:   3,
      _seeded:      false,

      canAddWallet: () => {
        const { plan, wallets, FREE_LIMIT, isProActive } = get()
        if (plan === 'pro' && isProActive()) return true
        return wallets.length < FREE_LIMIT
      },

      // NEVER use bare isPro — always isProActive()
      isProActive: () => {
        const { plan, proExpiresAt } = get()
        if (plan !== 'pro') return false
        return proExpiresAt === null || Date.now() < proExpiresAt
      },

      addWallet: (wallet) => {
        const { wallets, canAddWallet } = get()
        if (!canAddWallet()) return { ok: false, reason: 'limit' }
        const addr = normaliseAddress(wallet.address, wallet.chain)
        if (wallets.some(w => w.address === addr && w.chain === wallet.chain))
          return { ok: false, reason: 'duplicate' }
        set(s => ({
          wallets: [...s.wallets, {
            ...wallet, address: addr,
            id: nanoid(), addedAt: Date.now(),
            color: wallet.color || pickColor(s.wallets.map(w => w.color)),
          }]
        }))
        return { ok: true }
      },

      removeWallet: (id) => set(s => ({ wallets: s.wallets.filter(w => w.id !== id) })),

      updateLabel: (id, label) => set(s => ({
        wallets: s.wallets.map(w => w.id === id ? { ...w, label } : w)
      })),

      updateNotes: (id, notes) => set(s => ({
        wallets: s.wallets.map(w => w.id === id ? { ...w, notes } : w)
      })),

      reorderWallets: (from, to) => set(s => {
        const list = [...s.wallets]
        const [m]  = list.splice(from, 1)
        list.splice(to, 0, m)
        return { wallets: list }
      }),

      activatePro: (expiresAt) => set({ plan: 'pro', proExpiresAt: expiresAt }),

      resetToPlanFree: () => set({ plan: 'free', proExpiresAt: null }),

      // Seed default whale wallets — only once, bypass FREE_LIMIT
      seedDefaultWallets: () => {
        const { _seeded } = get()
        if (_seeded) return

        const seeded: WatchedWallet[] = DEFAULT_WHALE_WALLETS.map((dw, i) => ({
          id:      nanoid(),
          address: normaliseAddress(dw.address, dw.chain as Chain),
          label:   dw.label,
          chain:   dw.chain as Chain,
          tag:     dw.tag,
          entity:  (dw as import('@/data/defaultWallets').DefaultWallet).entity,
          pinned:  (dw as import('@/data/defaultWallets').DefaultWallet).pinned ?? false,
          logo:    (dw as import('@/data/defaultWallets').DefaultWallet).logo,
          addedAt: Date.now() - i * 1000,
          color:   dw.color,
        }))

        set({ wallets: seeded, _seeded: true })
      },
    }),
    {
      name:       'zero-watch-wallets',
      version:    5,  // bumped 4→5: force re-seed to pick up logo field
      partialize: s => ({
        wallets:      s.wallets,
        plan:         s.plan,
        proExpiresAt: s.proExpiresAt,
        _seeded:      s._seeded,
      }),
      migrate: (persisted: unknown, version: number) => {
        if (version < 2) {
          return { ...(persisted as object), _seeded: false }
        }
        if (version < 4) {
          // v3→v4: force re-seed so pinned field gets picked up from defaultWallets
          return { ...(persisted as object), _seeded: false }
        }
        return persisted as WalletStore
      },
    }
  )
)

export const selectWallets   = (s: WalletStore) => s.wallets
export const selectPlan      = (s: WalletStore) => s.plan
export const selectCanAdd    = (s: WalletStore) => s.canAddWallet()
export const selectFreeSlots = (s: WalletStore) => Math.max(0, s.FREE_LIMIT - s.wallets.length)
