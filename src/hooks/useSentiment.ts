/**
 * ZERØ WATCH — useSentiment v2
 * ===============================
 * v2: fundingRate via CF Worker proxy (/fapi/*) — fix CORS di production.
 * Fear & Greed langsung ke alternative.me (CORS OK, public endpoint).
 * mountedRef + AbortController + scheduleNext pattern ✓
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react'

const PROXY      = (import.meta.env.VITE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const REFRESH_MS = 5 * 60_000  // 5 menit

export type FearGreedLabel =
  | 'Extreme Fear'
  | 'Fear'
  | 'Neutral'
  | 'Greed'
  | 'Extreme Greed'

export interface SentimentData {
  fearGreedIndex:  number | null        // 0–100
  fearGreedLabel:  FearGreedLabel | null
  fundingRateEth:  number | null        // positive = longs bayar (bullish)
  fundingRateBtc:  number | null
  loading:         boolean
  error:           string | null
  lastUpdated:     number | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function classifyFG(v: number): FearGreedLabel {
  if (v <= 20) return 'Extreme Fear'
  if (v <= 40) return 'Fear'
  if (v <= 60) return 'Neutral'
  if (v <= 80) return 'Greed'
  return 'Extreme Greed'
}

async function fetchFearGreed(
  signal: AbortSignal
): Promise<{ index: number; label: FearGreedLabel } | null> {
  const res = await fetch('https://api.alternative.me/fng/?limit=1&format=json', { signal })
  if (!res.ok) throw new Error('Fear & Greed fetch failed')
  const json = await res.json() as { data?: { value?: string }[] }
  const val  = parseInt(json.data?.[0]?.value ?? '', 10)
  if (!isFinite(val)) return null
  return { index: val, label: classifyFG(val) }
}

async function fetchFundingRate(symbol: string, signal: AbortSignal): Promise<number | null> {
  // Via CF Worker proxy (/fapi/*) — avoids CORS from browser direct to fapi.binance.com
  const endpoint = PROXY
    ? `${PROXY}/fapi/v1/premiumIndex?symbol=${symbol}`
    : `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`
  try {
    const res = await fetch(endpoint, { signal })
    if (!res.ok) return null
    const json = await res.json() as { lastFundingRate?: string }
    const rate = parseFloat(json.lastFundingRate ?? '')
    return isFinite(rate) ? rate : null
  } catch {
    return null
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSentiment() {
  const [state, setState] = useState<SentimentData>({
    fearGreedIndex: null, fearGreedLabel: null,
    fundingRateEth: null, fundingRateBtc: null,
    loading: true, error: null, lastUpdated: null,
  })

  const mountedRef = useRef(true)
  const abortRef   = useRef(new AbortController())
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!mountedRef.current) return
    timerRef.current = setTimeout(() => {
      if (mountedRef.current) void fetchAll()
    }, REFRESH_MS)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAll = useCallback(async () => {
    abortRef.current.abort()
    abortRef.current = new AbortController()
    const { signal } = abortRef.current

    if (!mountedRef.current) return
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const [fg, fundingEth, fundingBtc] = await Promise.allSettled([
        fetchFearGreed(signal),
        fetchFundingRate('ETHUSDT', signal),
        fetchFundingRate('BTCUSDT', signal),
      ])

      if (!mountedRef.current || signal.aborted) return

      setState({
        fearGreedIndex: fg.status === 'fulfilled' ? (fg.value?.index ?? null) : null,
        fearGreedLabel: fg.status === 'fulfilled' ? (fg.value?.label ?? null) : null,
        fundingRateEth: fundingEth.status === 'fulfilled' ? fundingEth.value : null,
        fundingRateBtc: fundingBtc.status === 'fulfilled' ? fundingBtc.value : null,
        loading:        false,
        error:          null,
        lastUpdated:    Date.now(),
      })
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
      if (!mountedRef.current) return
      setState(prev => ({ ...prev, loading: false, error: 'Sentiment fetch failed' }))
    }

    scheduleNext()
  }, [scheduleNext])

  useEffect(() => {
    mountedRef.current = true
    void fetchAll()
    return () => {
      mountedRef.current = false
      abortRef.current.abort()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [fetchAll])

  const refetch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    void fetchAll()
  }, [fetchAll])

  return useMemo(() => ({ ...state, refetch }), [state, refetch])
}
