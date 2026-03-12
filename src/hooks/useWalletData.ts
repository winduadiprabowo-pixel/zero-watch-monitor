/**
 * ZERØ WATCH — useWalletData v15
 * ================================
 * v15 fixes:
 * - FIX: useEthPrice — TanStack Query v5 passes signal via queryFn context,
 *   must destructure from context object, not pass getEthPrice directly
 * - FIX: AbortSignal never passed as null/undefined to fetch
 * v14: SOL chain support — routes Solana wallets to solanaApi.ts,
 * EVM wallets ke api.ts (Etherscan/Alchemy via CF Worker proxy).
 * TanStack Query wrapper · AbortController signal ✓
 * 30s polling · retry 3x · exponential backoff ✓
 */

import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useWalletStore, selectWallets } from '@/store/walletStore'
import { fetchWalletData, getEthPrice } from '@/services/api'
import type { WalletData } from '@/services/api'
import { fetchSolWalletData } from '@/services/solanaApi'

const POLL  = 30_000
const STALE = 20_000

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
        type:         tx.type as 'SWAP' | 'TRANSFER' | 'UNKNOWN',
      })),
      lastUpdated: sol.lastUpdated,
    }
  }
  return fetchWalletData(address, chain as 'ETH' | 'ARB' | 'BASE' | 'OP', signal)
}

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
    refetchInterval: POLL,
    staleTime:       STALE,
    enabled:         wallets.length > 0,
    retry:           3,
    retryDelay:      (i) => Math.min(1000 * 2 ** i, 10_000),
  })
}

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
    refetchInterval: POLL,
    staleTime:       STALE,
    enabled:         !!address,
    retry:           3,
    retryDelay:      (i) => Math.min(1000 * 2 ** i, 10_000),
  })
}

// v15 FIX: TanStack Query v5 injects signal via queryFn context object
// Must destructure { signal } from context, NOT pass getEthPrice directly
export const useEthPrice = () =>
  useQuery<number>({
    queryKey:        ['eth-price'],
    queryFn:         ({ signal }) => getEthPrice(signal),
    refetchInterval: 60_000,
    staleTime:       55_000,
    retry:           2,
  })
