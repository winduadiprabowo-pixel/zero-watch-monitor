/**
 * ZERØ WATCH — useEnsResolver v1
 * ================================
 * Auto-resolve ENS names for tracked wallet addresses.
 * - Batch resolves on mount + when wallet list changes
 * - 24h cache in localStorage to avoid hammering API
 * - Zero cost: uses ENS public API via CF Worker proxy
 * - mountedRef ✓  AbortController ✓  no mock data ✓
 */

import { useEffect, useRef, useCallback, useState } from 'react'

const PROXY       = (import.meta.env.VITE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const CACHE_KEY   = 'zero-watch-ens-cache-v1'
const CACHE_TTL   = 24 * 60 * 60_000  // 24 hours

// ── Types ─────────────────────────────────────────────────────────────────────

export type EnsMap = Record<string, string>  // address.toLowerCase() → ENS name

interface CacheEntry { name: string; ts: number }
type CacheStore = Record<string, CacheEntry>

// ── Cache helpers ──────────────────────────────────────────────────────────────

function readCache(): CacheStore {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as CacheStore
  } catch { return {} }
}

function writeCache(store: CacheStore) {
  try {
    // Prune old entries first (keep max 500)
    const now     = Date.now()
    const pruned  = Object.entries(store)
      .filter(([, v]) => now - v.ts < CACHE_TTL)
      .slice(-500)
    localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(pruned)))
  } catch { /* localStorage unavailable */ }
}

function getCached(addr: string): string | null {
  const store = readCache()
  const entry = store[addr.toLowerCase()]
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) return null
  return entry.name
}

function setCached(addr: string, name: string) {
  const store = readCache()
  store[addr.toLowerCase()] = { name, ts: Date.now() }
  writeCache(store)
}

// ── ENS lookup (via Etherscan reverse-lookup via CF Worker) ───────────────────

async function resolveEns(address: string, signal: AbortSignal): Promise<string | null> {
  // Check cache first
  const cached = getCached(address)
  if (cached !== null) return cached || null  // empty string = confirmed no ENS

  try {
    // Etherscan ENS lookup via CF Worker proxy
    const url = PROXY
      ? `${PROXY}/etherscan?chainid=1&module=account&action=ensreversedresolution&address=${address}`
      : `https://api.etherscan.io/api?module=account&action=ensreversedresolution&address=${address}`

    const res = await fetch(url, { signal })
    if (!res.ok) return null

    const data = await res.json() as { status: string; result?: string }
    const name = data.status === '1' && data.result ? data.result : ''

    // Cache result (even empty = confirmed no ENS, avoids re-fetch)
    setCached(address, name)

    return name || null
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw e
    return null
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useEnsResolver(addresses: string[]): EnsMap {
  const [ensMap, setEnsMap] = useState<EnsMap>(() => {
    // Pre-populate from cache on init
    const map: EnsMap = {}
    for (const addr of addresses) {
      const cached = getCached(addr)
      if (cached) map[addr.toLowerCase()] = cached
    }
    return map
  })

  const mountedRef  = useRef(true)
  const abortRef    = useRef<AbortController | null>(null)
  const resolvedRef = useRef(new Set<string>())

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  const resolveAll = useCallback(async (addrs: string[]) => {
    if (addrs.length === 0) return

    // Only resolve ETH addresses (0x...) — skip SOL
    const ethAddrs = addrs.filter(a =>
      /^0x[0-9a-fA-F]{40}$/.test(a) &&
      !resolvedRef.current.has(a.toLowerCase())
    )
    if (ethAddrs.length === 0) return

    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const { signal } = abortRef.current

    // Batch resolve with 200ms stagger to avoid rate limits
    for (const addr of ethAddrs) {
      if (!mountedRef.current || signal.aborted) break

      try {
        const name = await resolveEns(addr, signal)
        resolvedRef.current.add(addr.toLowerCase())

        if (name && mountedRef.current) {
          setEnsMap(prev => ({
            ...prev,
            [addr.toLowerCase()]: name,
          }))
        }
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') break
      }

      // 200ms stagger — Etherscan free tier 5 req/s
      if (!signal.aborted) {
        await new Promise<void>(res => setTimeout(res, 220))
      }
    }
  }, [])

  useEffect(() => {
    void resolveAll(addresses)
  }, [addresses.join(','), resolveAll])  // eslint-disable-line react-hooks/exhaustive-deps

  return ensMap
}
