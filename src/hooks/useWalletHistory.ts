/**
 * ZERØ WATCH — useWalletHistory v1
 * ==================================
 * Fetch + save balance history dari CF KV via zero-watch-history worker.
 * - Auto-snapshot setiap kali data fresh
 * - Return 30 data points per wallet untuk chart
 * rgba() only ✓  AbortController ✓  mountedRef ✓
 */

import { useQuery } from '@tanstack/react-query'
import { useRef, useEffect, useCallback } from 'react'

const HISTORY_WORKER = 'https://zero-watch-history.winduadiprabowo.workers.dev'

export interface HistoryPoint {
  ts:  number   // unix ms
  usd: number   // USD value
  eth: string   // ETH/SOL balance string
}

// ── Save snapshot ─────────────────────────────────────────────────────────────

export async function saveSnapshot(
  address:    string,
  chain:      string,
  usdValue:   number,
  ethBalance: string,
  signal?:    AbortSignal
): Promise<void> {
  try {
    await fetch(`${HISTORY_WORKER}/history/snapshot`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body:    JSON.stringify({ address, chain, usdValue, ethBalance }),
    })
  } catch {
    // silently fail — history is non-critical
  }
}

// ── Fetch history ─────────────────────────────────────────────────────────────

export async function fetchHistory(
  address: string,
  chain:   string,
  signal?: AbortSignal
): Promise<HistoryPoint[]> {
  try {
    const res  = await fetch(
      `${HISTORY_WORKER}/history/${chain}/${address}`,
      { signal }
    )
    const data = await res.json()
    return data.points ?? []
  } catch {
    return []
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWalletHistory(address: string, chain: string) {
  const mountedRef = useRef(true)
  const abortRef   = useRef<AbortController | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  return useQuery<HistoryPoint[]>({
    queryKey:        ['history', chain, address],
    queryFn:         async () => {
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      return fetchHistory(address, chain, abortRef.current.signal)
    },
    staleTime:       5 * 60 * 1000,   // 5 min
    refetchInterval: 5 * 60 * 1000,
    enabled:         !!address && !!chain,
  })
}
