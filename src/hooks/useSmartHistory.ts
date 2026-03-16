/**
 * ZERØ WATCH — useSmartHistory v1
 * =================================
 * Smart history hook — merge KV snapshots + Etherscan historical backfill.
 *
 * Strategy:
 *  1. Fetch KV snapshots (zero-watch-history worker)
 *  2. Kalau < 7 points → backfill dari Etherscan tx history
 *  3. Reconstruct daily balance dari genesis
 *  4. Merge + dedup by day → return sorted HistoryPoint[]
 *  5. Cache di localStorage 24h — gak re-fetch tiap render
 *
 * Drop-in replacement untuk useWalletHistory.
 * rgba() only ✓  AbortController ✓  mountedRef ✓  useMemo ✓
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { HistoryPoint } from '@/hooks/useWalletHistory'

const PROXY          = (import.meta.env.VITE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const HISTORY_WORKER = 'https://zero-watch-history.winduadiprabowo.workers.dev'
const CACHE_V        = 'zw_smart_history_v1'
const CACHE_TTL      = 24 * 60 * 60_000   // 24 jam
const MIN_KV_POINTS  = 7                   // backfill kalau kurang dari ini

// EVM chains — Etherscan backfill supported
const EVM_CHAINS = new Set(['ETH', 'ARB', 'BASE', 'OP', 'BNB'])

const CHAIN_IDS: Record<string, number> = {
  ETH:  1, ARB: 42161, BASE: 8453, OP: 10, BNB: 56,
}

// ── localStorage cache ────────────────────────────────────────────────────────

function cacheKey(chain: string, address: string) {
  return `${CACHE_V}_${chain}_${address.toLowerCase()}`
}

function loadCache(chain: string, address: string): { points: HistoryPoint[]; ts: number } | null {
  try {
    const raw = localStorage.getItem(cacheKey(chain, address))
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function saveCache(chain: string, address: string, points: HistoryPoint[]) {
  try {
    localStorage.setItem(cacheKey(chain, address), JSON.stringify({ points, ts: Date.now() }))
  } catch { /* storage full — skip */ }
}

// ── KV fetch ──────────────────────────────────────────────────────────────────

async function fetchKvHistory(
  address: string, chain: string, signal: AbortSignal
): Promise<HistoryPoint[]> {
  try {
    const res  = await fetch(`${HISTORY_WORKER}/history/${chain}/${address}`, { signal })
    const data = await res.json()
    return (data.points ?? []).map((p: { ts: number; usd: number; native?: string }) => ({
      ts:  p.ts,
      usd: p.usd,
      eth: String(p.native ?? '0'),
    }))
  } catch { return [] }
}

// ── Etherscan backfill ────────────────────────────────────────────────────────

async function fetchEtherscanHistory(
  address: string, chain: string, signal: AbortSignal
): Promise<HistoryPoint[]> {
  if (!PROXY || !EVM_CHAINS.has(chain)) return []

  try {
    // Get ETH price
    let ethPrice = 2000
    try {
      const pr = await fetch(`${PROXY}/etherscan?chainid=1&module=stats&action=ethprice`, { signal })
      const pd = await pr.json()
      ethPrice = parseFloat(pd?.result?.ethusd ?? '2000')
    } catch { /* use default */ }

    const chainId = CHAIN_IDS[chain] ?? 1

    // Fetch last 1000 txs (paginate up to 3 pages max to keep it fast)
    const allTxs: Array<{
      hash: string; from: string; to: string
      value: string; timeStamp: string; isError: string; blockNumber: string
    }> = []

    for (let page = 1; page <= 3; page++) {
      if (signal.aborted) break
      try {
        const res = await fetch(
          `${PROXY}/etherscan?chainid=${chainId}&module=account&action=txlist` +
          `&address=${address}&startblock=0&endblock=99999999` +
          `&page=${page}&offset=1000&sort=asc`,
          { signal }
        )
        const data = await res.json()
        if (data?.status !== '1' || !Array.isArray(data.result)) break
        allTxs.push(...data.result)
        if (data.result.length < 1000) break   // no more pages
        await new Promise(r => setTimeout(r, 300))
      } catch { break }
    }

    if (allTxs.length === 0) return []

    const addrLow = address.toLowerCase()

    // Reconstruct daily balance
    const byDay = new Map<string, number>()  // 'YYYY-MM-DD' → cumulative balance
    let cumEth = 0

    for (const tx of allTxs) {
      if (tx.isError === '1') continue
      const eth   = parseFloat(tx.value) / 1e18
      const from  = tx.from.toLowerCase()
      const isOut = from === addrLow
      cumEth += isOut ? -eth : eth

      const day = new Date(parseInt(tx.timeStamp) * 1000).toISOString().slice(0, 10)
      byDay.set(day, cumEth)
    }

    // Convert to HistoryPoint — only last 90 days
    const cutoff = Date.now() - 90 * 86_400_000
    const points: HistoryPoint[] = []

    for (const [day, bal] of byDay) {
      const ts = new Date(day).getTime()
      if (ts < cutoff) continue
      points.push({
        ts,
        usd: Math.max(0, bal) * ethPrice,
        eth: Math.max(0, bal).toFixed(4),
      })
    }

    return points.sort((a, b) => a.ts - b.ts)
  } catch (e: unknown) {
    if ((e as Error)?.name === 'AbortError') throw e
    return []
  }
}

// ── Merge & dedup ─────────────────────────────────────────────────────────────

function mergePoints(kv: HistoryPoint[], etherscan: HistoryPoint[]): HistoryPoint[] {
  // Use KV as override for recent data, Etherscan for historical
  const byDay = new Map<string, HistoryPoint>()

  // Etherscan first (older, lower priority)
  for (const p of etherscan) {
    const day = new Date(p.ts).toISOString().slice(0, 10)
    byDay.set(day, p)
  }

  // KV overrides (fresher data)
  for (const p of kv) {
    const day = new Date(p.ts).toISOString().slice(0, 10)
    byDay.set(day, p)
  }

  return Array.from(byDay.values())
    .sort((a, b) => a.ts - b.ts)
    .slice(-90)  // max 90 points
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSmartHistory(address: string, chain: string) {
  const [points,  setPoints]  = useState<HistoryPoint[]>([])
  const [loading, setLoading] = useState(true)

  const mountedRef = useRef(true)
  const abortRef   = useRef<AbortController | null>(null)

  const fetch_ = useCallback(async () => {
    if (!address || !chain) return

    // Load cache immediately — show something while fetching
    const cached = loadCache(chain, address)
    if (cached && cached.points.length > 0) {
      if (mountedRef.current) {
        setPoints(cached.points)
        setLoading(false)
      }
      // If cache is fresh, skip re-fetch
      if (Date.now() - cached.ts < CACHE_TTL) return
    }

    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const { signal } = abortRef.current

    if (!mountedRef.current) return
    setLoading(true)

    try {
      // Fetch KV first (fast)
      const kvPoints = await fetchKvHistory(address, chain, signal)
      if (!mountedRef.current) return

      // If KV has enough data, use it directly
      if (kvPoints.length >= MIN_KV_POINTS) {
        const merged = mergePoints(kvPoints, [])
        saveCache(chain, address, merged)
        setPoints(merged)
        setLoading(false)
        return
      }

      // Not enough KV data → backfill from Etherscan
      const ethPoints = await fetchEtherscanHistory(address, chain, signal)
      if (!mountedRef.current) return

      const merged = mergePoints(kvPoints, ethPoints)
      saveCache(chain, address, merged)
      setPoints(merged)
    } catch (e: unknown) {
      if ((e as Error)?.name === 'AbortError') return
      // Use whatever we have
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [address, chain])

  useEffect(() => {
    mountedRef.current = true
    fetch_()

    // Refresh every 5 minutes
    const interval = setInterval(fetch_, 5 * 60_000)

    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
      clearInterval(interval)
    }
  }, [fetch_])

  const isEmpty = useMemo(() => points.length < 2, [points])

  return {
    data:      points,
    isLoading: loading,
    isEmpty,
    refetch:   fetch_,
  }
}
