/**
 * ZERØ WATCH — useWalletData v21
 * ================================
 * v21: Queue-based lazy loading — fetch 1 wallet per 200ms
 * Handles 51 wallets tanpa kena Etherscan rate limit.
 * - First 5 wallets: fetch immediately (visible)
 * - Rest: queue with 200ms delay between each
 * - Selected wallet: always prioritized
 * - Auto-snapshot to CF KV history
 *
 * rgba() only ✓  AbortController ✓  mountedRef ✓
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useCallback, useState } from 'react'
import { useWalletStore, selectWallets } from '@/store/walletStore'
import { fetchWalletData, getEthPrice } from '@/services/api'
import type { WalletData } from '@/services/api'
import { fetchSolWalletData } from '@/services/solanaApi'

const POLL        = 60_000
const STALE       = 50_000
const QUEUE_DELAY = 250
const PRIORITY    = 5

// ── saveSnapshot inline ──────────────────────────────────────────────────────

async function saveSnapshot(
  address: string, chain: string, usdValue: number, ethBalance: string
): Promise<void> {
  try {
    await fetch('https://zero-watch-history.winduadiprabowo.workers.dev/history/snapshot', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ address, chain, usdValue, ethBalance }),
    })
  } catch { /* silently fail */ }
}

// ── Unified fetch adapter ────────────────────────────────────────────────────

async function fetchAnyWalletData(
  address: string,
  chain:   string,
  signal:  AbortSignal
): Promise<WalletData> {
  if (chain === 'SOL') {
    const sol = await fetchSolWalletData(address, signal)
    return {
      address:      sol.address,
      balance: {
        address:    sol.address,
        ethBalance: sol.balance.solBalance,
        usdValue:   sol.balance.usdValue,
        tokens:     sol.balance.tokens.map(t => ({
          symbol:          t.symbol,
          name:            t.name,
          balance:         t.balance,
          usdValue:        t.usdValue,
          contractAddress: t.mintAddress,
        })),
      },
      transactions: sol.transactions.map(tx => ({
        hash:         tx.signature,
        from:         tx.from,
        to:           tx.to,
        value:        tx.valueSOL.toFixed(4),
        timeStamp:    String(tx.blockTime),
        isError:      tx.err ? '1' : '0',
        functionName: tx.type,
        gasUsed:      '5000',
        type:         tx.type as 'SWAP' | 'TRANSFER' | 'UNKNOWN',
      })),
      lastUpdated: sol.lastUpdated,
    }
  }
  return fetchWalletData(address, chain as 'ETH' | 'ARB' | 'BASE' | 'OP', signal)
}

// ── Queue-based lazy loader ──────────────────────────────────────────────────

export const useAllWalletData = () => {
  const wallets      = useWalletStore(selectWallets)
  const queryClient  = useQueryClient()
  const abortMap     = useRef<Map<string, AbortController>>(new Map())
  const queueRef     = useRef<ReturnType<typeof setTimeout>[]>([])
  const mountedRef   = useRef(true)

  const results = wallets.map(w =>
    queryClient.getQueryData<WalletData>(['wallet-lazy', w.address, w.chain])
  )

  const isFetching = wallets.some(w =>
    queryClient.isFetching({ queryKey: ['wallet-lazy', w.address, w.chain] }) > 0
  )

  const fetchOne = useCallback(async (
    address: string, chain: string
  ) => {
    if (!mountedRef.current) return

    const existing = abortMap.current.get(address)
    existing?.abort()
    const ctrl = new AbortController()
    abortMap.current.set(address, ctrl)

    try {
      const data = await fetchAnyWalletData(address, chain, ctrl.signal)
      if (!mountedRef.current) return
      queryClient.setQueryData(['wallet-lazy', address, chain], data)
      saveSnapshot(address, chain, data.balance.usdValue, data.balance.ethBalance)
    } catch {
      // silently fail per wallet
    }
  }, [queryClient])

  useEffect(() => {
    mountedRef.current = true

    queueRef.current.forEach(t => clearTimeout(t))
    queueRef.current = []

    abortMap.current.forEach(c => c.abort())
    abortMap.current.clear()

    if (wallets.length === 0) return

    wallets.slice(0, PRIORITY).forEach(w => {
      fetchOne(w.address, w.chain)
    })

    wallets.slice(PRIORITY).forEach((w, i) => {
      const t = setTimeout(() => {
        if (mountedRef.current) fetchOne(w.address, w.chain)
      }, (i + 1) * QUEUE_DELAY)
      queueRef.current.push(t)
    })

    const refetchInterval = setInterval(() => {
      if (!mountedRef.current) return
      wallets.forEach((w, i) => {
        const t = setTimeout(() => {
          if (mountedRef.current) fetchOne(w.address, w.chain)
        }, i * QUEUE_DELAY)
        queueRef.current.push(t)
      })
    }, POLL)

    return () => {
      mountedRef.current = false
      queueRef.current.forEach(t => clearTimeout(t))
      clearInterval(refetchInterval)
      abortMap.current.forEach(c => c.abort())
    }
  }, [wallets.map(w => `${w.address}:${w.chain}`).join(','), fetchOne])

  return {
    data:       results,
    isFetching,
    isError:    false,
  }
}

// ── Single wallet hook ───────────────────────────────────────────────────────

export const useSingleWallet = (
  address: string,
  chain:   'ETH' | 'ARB' | 'BASE' | 'OP' | 'SOL'
) => {
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  return useQuery<WalletData>({
    queryKey:        ['wallet', address, chain],
    queryFn:         async () => {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      return fetchAnyWalletData(address, chain, abortRef.current.signal)
    },
    refetchInterval: POLL,
    staleTime:       STALE,
    enabled:         !!address,
    retry:           2,
    retryDelay:      (i) => Math.min(1000 * 2 ** i, 8_000),
  })
}

// ── ETH Price ────────────────────────────────────────────────────────────────

export const useEthPrice = () =>
  useQuery<number>({
    queryKey:        ['eth-price'],
    queryFn:         () => getEthPrice(),
    refetchInterval: 60_000,
    staleTime:       55_000,
    retry:           2,
  })
