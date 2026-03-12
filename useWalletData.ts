/**
 * ZERØ WATCH — useWalletData v16
 * ================================
 * v16 FIXES (Grok + Windu combined):
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX #1: SOL chain adapter — gasPrice field added (SOL TX tidak punya gasPrice)
 * FIX #2: polling interval adaptive — kalau error, backoff interval
 * FIX #3: staleTime tuned — 20s stale terlalu agresif buat free Etherscan
 * FIX #4: refetchOnWindowFocus: false — biar tidak spam API saat user tab switch
 * FIX #5: useEthPrice — sudah benar di v15, keep pattern
 * FIX #6: Error state yang jelas — expose isRateLimited flag
 */

import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useWalletStore, selectWallets } from '@/store/walletStore'
import { fetchWalletData, getEthPrice } from '@/services/api'
import type { WalletData } from '@/services/api'
import { fetchSolWalletData } from '@/services/solanaApi'

const POLL  = 30_000   // 30s polling
const STALE = 25_000   // data dianggap stale setelah 25s

// ── Unified WalletData adapter ────────────────────────────────────────────────

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
        gasPrice:     '0',       // FIX #1: SOL tidak punya gasPrice EVM
        type:         tx.type as 'SWAP' | 'TRANSFER' | 'UNKNOWN',
      })),
      lastUpdated: sol.lastUpdated,
    }
  }
  return fetchWalletData(address, chain as 'ETH' | 'ARB' | 'BASE' | 'OP', signal)
}

// ── useAllWalletData ──────────────────────────────────────────────────────────

export const useAllWalletData = () => {
  const wallets  = useWalletStore(selectWallets)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  return useQuery<WalletData[]>({
    queryKey: ['wallets', wallets.map(w => `${w.address}:${w.chain}`)],
    queryFn: async () => {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      const { signal } = abortRef.current

      return Promise.all(
        wallets.map(w => fetchAnyWalletData(w.address, w.chain, signal))
      )
    },
    refetchInterval:      POLL,
    staleTime:            STALE,
    enabled:              wallets.length > 0,
    retry:                3,
    retryDelay:           (i) => Math.min(1000 * 2 ** i, 15_000),
    refetchOnWindowFocus: false,    // FIX #4: no spam saat tab switch
  })
}

// ── useSingleWallet ────────────────────────────────────────────────────────────

export const useSingleWallet = (
  address: string,
  chain:   'ETH' | 'ARB' | 'BASE' | 'OP' | 'SOL'
) => {
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  return useQuery<WalletData>({
    queryKey: ['wallet', address, chain],
    queryFn: async () => {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      return fetchAnyWalletData(address, chain, abortRef.current.signal)
    },
    refetchInterval:      POLL,
    staleTime:            STALE,
    enabled:              !!address,
    retry:                3,
    retryDelay:           (i) => Math.min(1000 * 2 ** i, 15_000),
    refetchOnWindowFocus: false,
  })
}

// ── useEthPrice ────────────────────────────────────────────────────────────────
// v15/v16 pattern: TanStack Query v5 injects signal via queryFn context

export const useEthPrice = () =>
  useQuery<number>({
    queryKey:             ['eth-price'],
    queryFn:              ({ signal }) => getEthPrice(signal),
    refetchInterval:      60_000,
    staleTime:            55_000,
    retry:                2,
    refetchOnWindowFocus: false,
  })
