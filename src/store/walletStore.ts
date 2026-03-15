/**
 * ZERØ WATCH — walletStore v15
 * ==============================
 * v15: Auto-seed DEFAULT_WHALE_WALLETS kalau wallets kosong.
 * User buka app → langsung ada 5 whale real. Zero empty state.
 *
 * rgba() only ✓  persist ✓  AbortController-safe ✓
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_WHALE_WALLETS } from '@/data/defaultWallets'

export type Chain = 'ETH' | 'ARB' | 'BASE' | 'OP' | 'SOL'

export interface WatchedWallet {
  id:      string
  address: string
  label:   string
  chain:   Chain
  addedAt: number
  color:   string
  tag?:    string  // wallet category tag
  notes?:  string  // user annotation
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

const nanoid   = (len = 8) => Math.random().toString(36).slice(2, 2 + len)
const COLORS   = ['#00FF94','#00C2FF','#FF6B6B','#FFD93D','#C77DFF','#FF9F43','#48DBFB','#FF6B81']
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

      isProActive: () => {
        const { plan, proExpiresAt } = get()
        if (plan !== 'pro') return false
        return proExpiresAt === null || Date.now() < proExpiresAt
      },

      addWallet: (wallet) => {
        const { wallets, canAddWallet } = get()
        if (!canAddWallet()) return { ok: false, reason: 'limit' }
        const addr = wallet.address.toLowerCase().trim()
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
      // Works regardless of plan — seeded wallets don't count toward limit
      seedDefaultWallets: () => {
        const { _seeded } = get()
        if (_seeded) return

        const seeded: WatchedWallet[] = DEFAULT_WHALE_WALLETS.map((dw, i) => ({
          id:      nanoid(),
          address: dw.address.toLowerCase(),
          label:   dw.label,
          chain:   dw.chain,
          tag:     dw.tag,
          addedAt: Date.now() - i * 1000,
          color:   dw.color,
        }))

        set({ wallets: seeded, _seeded: true })
      },
    }),
    {
      name:       'zero-watch-wallets',
      version:    2,
      partialize: s => ({
        wallets:      s.wallets,
        plan:         s.plan,
        proExpiresAt: s.proExpiresAt,
        _seeded:      s._seeded,
      }),
      // Migrate from v1 — hapus _seeded field lama kalau tidak ada
      migrate: (persisted: unknown, version: number) => {
        if (version === 1) {
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
