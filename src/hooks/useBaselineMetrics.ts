/**
 * ZERØ WATCH — useBaselineMetrics v1
 * =====================================
 * Compute "normal behavior" per wallet dari historical tx data.
 * Dipakai oleh anomaly detector (usePatternRecognition) sebagai referensi.
 *
 * Per wallet computes:
 *  - avg daily ETH volume (30 hari terakhir)
 *  - avg transfer size ke known CEX addresses
 *  - typical active hours UTC (0–23)
 *  - avg days between large moves ($1M+)
 *  - known counterparty score (0–1)
 *  - anomaly thresholds: VALUE_ANOMALY if > 3x avgTransferToCex
 *  - dormant wake: last tx > 30 hari
 *
 * rgba() only ✓  useMemo ✓  useCallback ✓  mountedRef ✓  AbortController ✓
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { WalletBaseline } from './useWalletFullHistory'

const PROXY      = (import.meta.env.VITE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const REFRESH_MS = 5 * 60_000   // refresh every 5 minutes
const MIN_USD    = 1_000_000    // $1M large-move threshold

// ── CEX addresses ─────────────────────────────────────────────────────────────

const CEX_SET = new Set([
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8', // Binance Cold
  '0x28c6c06298d514db089934071355e5743bf21d60', // Binance Hot 14
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549', // Binance Hot 15
  '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43', // Coinbase Prime
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3', // Coinbase 2
  '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0', // Kraken 1
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2', // Kraken 2
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b', // OKX
  '0x98ec059dc3adfbdd63429454aeb0c990fba4a128', // Bybit Hot
  '0xab5c66752a9e8167967685f1450532fb96d5d24f', // HTX/Huobi 1
  '0x0d0707963952f2fba59dd06f2b425ace40b492fe', // Gate.io
  '0x6262998ced04146fa42253a5c0af90ca02dfd2a3', // Crypto.com
])

// ── Types ─────────────────────────────────────────────────────────────────────

export type AnomalyType =
  | 'VALUE_ANOMALY'    // value > 3x avgTransferToCex
  | 'DORMANT_WAKE'     // wallet dormant > 30 days, suddenly active
  | 'VOLUME_SPIKE'     // daily volume > 5x avgDailyVolume

export interface AnomalyFlag {
  type:        AnomalyType
  description: string
  multiplier:  number   // how many × above baseline
  confidence:  number   // 0–100
}

export interface WalletMetrics {
  address:            string
  chain:              string
  // Live metrics (from recent 30 txs)
  avgDailyVolumeUsd:  number
  avgCexTransferUsd:  number
  lastTxTimestamp:    number    // unix ms
  daysSinceLastTx:    number
  typicalActiveHours: number[]  // top 5 UTC hours
  avgDaysBetweenLargeMoves: number
  // Anomaly thresholds
  valueAnomalyThreshold: number  // 3x avgCexTransfer
  dormantThresholdDays:  number  // 30 days
  // From full history baseline (if available)
  historicalBaseline:    WalletBaseline | null
  // Computed anomaly flags (live)
  anomalyFlags:          AnomalyFlag[]
}

interface RawTx {
  hash:      string
  from:      string
  to:        string
  value:     string    // wei
  timeStamp: string
  isError:   string
}

// ── Metrics computation ───────────────────────────────────────────────────────

function computeMetrics(
  address:  string,
  chain:    string,
  txs:      RawTx[],
  ethPrice: number,
  baseline: WalletBaseline | null
): WalletMetrics {
  const addrLow  = address.toLowerCase()
  const validTxs = txs.filter(tx => tx.isError === '0')

  // Last tx timestamp
  const sorted    = [...validTxs].sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp))
  const lastTs    = sorted[0] ? parseInt(sorted[0].timeStamp) * 1000 : 0
  const daysSince = lastTs > 0 ? (Date.now() - lastTs) / 86_400_000 : 999

  // Avg daily volume (last 30 days)
  const now30   = Date.now() - 30 * 86_400_000
  const recent  = validTxs.filter(tx => parseInt(tx.timeStamp) * 1000 > now30)
  const volumes = recent.map(tx => (parseFloat(tx.value) / 1e18) * ethPrice)
  const avgDailyVolumeUsd = volumes.length > 0
    ? volumes.reduce((s, v) => s + v, 0) / 30
    : 0

  // Avg CEX transfer size
  const cexTxs = validTxs.filter(tx =>
    tx.from.toLowerCase() === addrLow &&
    CEX_SET.has((tx.to ?? '').toLowerCase())
  )
  const cexUsdValues = cexTxs.map(tx => (parseFloat(tx.value) / 1e18) * ethPrice)
  const avgCexTransferUsd = cexUsdValues.length > 0
    ? cexUsdValues.reduce((s, v) => s + v, 0) / cexUsdValues.length
    : 0

  // Typical active UTC hours
  const hourCounts = new Array(24).fill(0)
  for (const tx of validTxs) {
    const h = new Date(parseInt(tx.timeStamp) * 1000).getUTCHours()
    hourCounts[h]++
  }
  const typicalActiveHours = hourCounts
    .map((count, h) => ({ h, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(x => x.h)

  // Avg days between large moves ($1M+)
  const largeMoves = validTxs
    .filter(tx => (parseFloat(tx.value) / 1e18) * ethPrice >= MIN_USD)
    .map(tx => parseInt(tx.timeStamp) * 1000)
    .sort((a, b) => a - b)

  let avgDaysBetweenLargeMoves = 0
  if (largeMoves.length > 1) {
    const gaps = []
    for (let i = 1; i < largeMoves.length; i++) {
      gaps.push((largeMoves[i] - largeMoves[i - 1]) / 86_400_000)
    }
    avgDaysBetweenLargeMoves = gaps.reduce((s, g) => s + g, 0) / gaps.length
  }

  // Anomaly thresholds
  const valueAnomalyThreshold = avgCexTransferUsd > 0
    ? avgCexTransferUsd * 3
    : MIN_USD * 3

  // ── Live anomaly flags ──────────────────────────────────────────────────────

  const anomalyFlags: AnomalyFlag[] = []

  // 1. DORMANT_WAKE
  if (daysSince <= 1 && baseline && baseline.dormantDays > 30) {
    anomalyFlags.push({
      type:        'DORMANT_WAKE',
      description: `Wallet dormant avg ${baseline.dormantDays.toFixed(0)} days — just activated`,
      multiplier:  baseline.dormantDays / 30,
      confidence:  Math.min(90, 60 + baseline.dormantDays),
    })
  }

  // 2. VOLUME_SPIKE — today's volume vs avg
  const todayStart = Date.now() - 86_400_000
  const todayTxs   = validTxs.filter(tx => parseInt(tx.timeStamp) * 1000 > todayStart)
  const todayVol   = todayTxs.reduce((s, tx) => s + (parseFloat(tx.value) / 1e18) * ethPrice, 0)
  if (avgDailyVolumeUsd > 0 && todayVol > avgDailyVolumeUsd * 5) {
    const mult = todayVol / avgDailyVolumeUsd
    anomalyFlags.push({
      type:        'VOLUME_SPIKE',
      description: `Today's volume $${(todayVol / 1e6).toFixed(1)}M = ${mult.toFixed(1)}x above 30d avg`,
      multiplier:  mult,
      confidence:  Math.min(85, 50 + mult * 5),
    })
  }

  return {
    address,
    chain,
    avgDailyVolumeUsd,
    avgCexTransferUsd,
    lastTxTimestamp:    lastTs,
    daysSinceLastTx:    daysSince,
    typicalActiveHours,
    avgDaysBetweenLargeMoves,
    valueAnomalyThreshold,
    dormantThresholdDays:  30,
    historicalBaseline:    baseline,
    anomalyFlags,
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseBaselineMetricsOptions {
  addresses: Array<{ address: string; chain: string }>
  baselines?: Record<string, WalletBaseline>  // address → baseline from useWalletFullHistory
  enabled?:  boolean
}

export function useBaselineMetrics({
  addresses,
  baselines = {},
  enabled   = true,
}: UseBaselineMetricsOptions) {
  const [metricsMap, setMetricsMap] = useState<Record<string, WalletMetrics>>({})
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const mountedRef = useRef(true)
  const abortRef   = useRef<AbortController | null>(null)

  // Only EVM addresses — can query Etherscan
  const evmAddresses = useMemo(
    () => addresses.filter(a => ['ETH', 'ARB', 'BASE', 'OP', 'BNB'].includes(a.chain)),
    [addresses]
  )

  const compute = useCallback(async () => {
    if (!enabled || evmAddresses.length === 0 || !PROXY) return

    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const { signal } = abortRef.current

    if (!mountedRef.current) return
    setLoading(true)

    try {
      // Get ETH price
      let ethPrice = 2000
      try {
        const pr = await fetch(`${PROXY}/etherscan?chainid=1&module=stats&action=ethprice`, { signal })
        const pd = await pr.json()
        ethPrice  = parseFloat(pd?.result?.ethusd ?? '2000')
      } catch { /* use default */ }

      const newMap: Record<string, WalletMetrics> = {}

      for (const { address, chain } of evmAddresses) {
        if (!mountedRef.current || signal.aborted) break

        try {
          const chainId = chain === 'ARB' ? 42161
                        : chain === 'BASE' ? 8453
                        : chain === 'OP'   ? 10
                        : chain === 'BNB'  ? 56
                        : 1

          const res = await fetch(
            `${PROXY}/etherscan?chainid=${chainId}&module=account&action=txlist` +
            `&address=${address}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc`,
            { signal }
          )
          const data = await res.json()
          if (data?.status !== '1') continue

          const txs      = (data.result ?? []) as RawTx[]
          const baseline = baselines[address.toLowerCase()] ?? null

          newMap[address.toLowerCase()] = computeMetrics(address, chain, txs, ethPrice, baseline)

          await new Promise(r => setTimeout(r, 300))
        } catch { continue }
      }

      if (!mountedRef.current) return
      setMetricsMap(prev => ({ ...prev, ...newMap }))
      setError(null)
    } catch (e: unknown) {
      if ((e as Error)?.name === 'AbortError') return
      if (mountedRef.current) setError('Baseline compute failed')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [evmAddresses, baselines, enabled])

  useEffect(() => {
    mountedRef.current = true
    compute()
    const interval = setInterval(compute, REFRESH_MS)
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
      clearInterval(interval)
    }
  }, [compute])

  // Helper: check if a transfer is anomalous based on baseline
  const checkValueAnomaly = useCallback((
    address: string,
    valueUsd: number
  ): AnomalyFlag | null => {
    const m = metricsMap[address.toLowerCase()]
    if (!m || m.valueAnomalyThreshold === 0) return null
    if (valueUsd < m.valueAnomalyThreshold) return null

    const mult = valueUsd / (m.avgCexTransferUsd || MIN_USD)
    return {
      type:        'VALUE_ANOMALY',
      description: `$${(valueUsd / 1e6).toFixed(1)}M = ${mult.toFixed(1)}x above baseline avg`,
      multiplier:  mult,
      confidence:  Math.min(95, 60 + mult * 5),
    }
  }, [metricsMap])

  const allAnomalies = useMemo(
    () => Object.values(metricsMap).flatMap(m => m.anomalyFlags),
    [metricsMap]
  )

  return {
    metricsMap,
    allAnomalies,
    loading,
    error,
    checkValueAnomaly,
    refetch: compute,
  }
}
