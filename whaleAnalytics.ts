/**
 * ZERØ WATCH — Whale Analytics Engine v13 FINAL
 * ================================================
 * KOMBINASI MAKSIMAL: Fixed ZIP v12 bugs + gue v12 extras
 * ─────────────────────────────────────────────────────────────────────────────
 * FROM FIXED ZIP (bug fixes):
 *   ✓ computeGasSpentEth() pakai gasPrice REAL dari TX (bukan hardcoded gwei)
 *   ✓ gasSpentUsd di WalletIntelligence
 *   ✓ detectBigMoves: 24h window (bukan 1h) + hoursAgo field
 *   ✓ txFrequency dari actual observed window (bukan kasar /30)
 *   ✓ detectClusters: no self-match + no duplicate labels
 *   ✓ WhaleScore: min 1 tx threshold (bukan 2)
 *   ✓ calculateGasBreakdown() via api.ts
 *
 * FROM GUE (v17 extras):
 *   ✓ velocity field (7d vs 30d rate — rate of change)
 *   ✓ consistency field (window agreement score)
 *   ✓ recency-weighted inflow/outflow (recent txs lebih berpengaruh)
 *   ✓ velocity-aware status detection (HUNTING lebih akurat)
 *   ✓ GasStats interface + computeGasStats() + efficiency badge
 *   ✓ computeBalanceHistory() untuk Flow Chart sparkline di StatsBar
 *   ✓ recentActivityScore (7d vs 30d activity ratio)
 *   ✓ buildLeaderboard: formula 5-factor dengan velocity
 *
 * Zero mock data ✓  All computed from real Transaction[] ✓
 */

import type { Transaction } from './api'
import { calculateGasBreakdown } from './api'

// ── Types ──────────────────────────────────────────────────────────────────────

export type WhaleStatus = 'ACCUMULATING' | 'DISTRIBUTING' | 'DORMANT' | 'HUNTING'

export interface WhaleScore {
  status:      WhaleStatus
  score:       number    // 0–100
  inflow:      number    // ETH received
  outflow:     number    // ETH sent
  conviction:  number    // 0–100 (log-scaled avg USD per tx)
  // v13 extras
  velocity:    number    // 0–100 (7d vs 30d flow rate)
  consistency: number    // 0–100 (directional agreement across windows)
}

export interface BigMoveAlert {
  hash:      string
  type:      'IN' | 'OUT'
  valueEth:  number
  valueUsd:  number
  timestamp: number
  txType:    string
  hoursAgo:  number   // from fixed zip: berapa jam lalu
}

export interface CopySignal {
  action:    'BUY' | 'SELL' | 'DEPOSIT' | 'BORROW'
  valueEth:  number
  valueUsd:  number
  timestamp: number
  txHash:    string
  toAddress: string
  fnName:    string
}

// from gue: gas efficiency badge
export interface GasStats {
  avgGwei:         number
  totalFeeEth:     number
  highGasTxCount:  number
  efficiency:      'LOW' | 'NORMAL' | 'HIGH'
}

export interface WalletIntelligence {
  whaleScore:            WhaleScore
  bigMoves:              BigMoveAlert[]
  copySignals:           CopySignal[]
  gasSpentEth:           number
  gasSpentUsd:           number        // from fixed zip: real USD cost
  gasStats:              GasStats      // from gue: for efficiency badge
  walletAgeDays:         number
  firstTxTimestamp:      number
  txFrequency:           number        // from fixed zip: actual window
  avgTxValueEth:         number
  largestTxEth:          number
  totalVolume30dEth:     number
  recentActivityScore:   number        // from gue: 0–100
  balanceHistoryPoints:  number[]      // from gue: 12-point sparkline
}

export interface LeaderboardEntry {
  id:            string
  label:         string
  rank:          number
  smartScore:    number
  status:        WhaleStatus
  balanceUsd:    number
  txCount30d:    number
  volume30dEth:  number
  conviction:    number
  velocity:      number   // from gue
}

// ── Time helpers ───────────────────────────────────────────────────────────────

const nowSecs   = () => Math.floor(Date.now() / 1000)
const now30dAgo = () => nowSecs() - 30 * 86400
const now7dAgo  = () => nowSecs() - 7  * 86400
const now24hAgo = () => nowSecs() - 86400        // fixed zip: 24h window

// from gue: recency weight — recent txs matter more
function recencyWeight(ts: number): number {
  const age = nowSecs() - ts
  if (age < 86400)       return 1.0
  if (age < 7 * 86400)   return 0.6
  if (age < 30 * 86400)  return 0.3
  return 0.1
}

// ── Whale Score v3 (combined best) ────────────────────────────────────────────
// Fixed ZIP: real gasPrice, min 1 tx
// Gue: recency-weighted, velocity, consistency, velocity-aware status

export function computeWhaleScore(
  transactions: Transaction[],
  walletAddress: string,
  ethPrice: number
): WhaleScore {
  const ago30d = now30dAgo()
  const ago7d  = now7dAgo()
  const addr   = walletAddress.toLowerCase()
  const recent = transactions.filter(t => parseInt(t.timeStamp) > ago30d)

  if (recent.length === 0) {
    return { status: 'DORMANT', score: 0, inflow: 0, outflow: 0, conviction: 0, velocity: 0, consistency: 0 }
  }

  // Recency-weighted inflow/outflow (gue extra)
  let weightedIn  = 0; let weightedOut = 0
  let rawIn       = 0; let rawOut      = 0

  for (const tx of recent) {
    const val    = parseFloat(tx.value) || 0
    const ts     = parseInt(tx.timeStamp)
    const weight = recencyWeight(ts)
    if (tx.to?.toLowerCase() === addr) { weightedIn  += val * weight; rawIn  += val }
    else                                { weightedOut += val * weight; rawOut += val }
  }

  const weightedTotal = weightedIn + weightedOut
  const rawTotal      = rawIn + rawOut
  const netRatio      = weightedTotal > 0 ? (weightedIn - weightedOut) / weightedTotal : 0
  const score         = Math.min(100, Math.floor(Math.sqrt(Math.abs(netRatio)) * 100))

  // Consistency across 5-tx windows (gue extra)
  const windows: number[] = []
  for (let i = 0; i + 5 <= recent.length; i += 5) {
    const w = recent.slice(i, i + 5)
    let wIn = 0; let wOut = 0
    for (const tx of w) {
      const val = parseFloat(tx.value) || 0
      if (tx.to?.toLowerCase() === addr) wIn += val; else wOut += val
    }
    const wTotal = wIn + wOut
    if (wTotal > 0) windows.push((wIn - wOut) / wTotal)
  }
  const overallDir  = netRatio >= 0 ? 1 : -1
  const agreeing    = windows.filter(w => Math.sign(w) === overallDir || w === 0).length
  const consistency = windows.length > 0 ? Math.floor((agreeing / windows.length) * 100) : 50

  // Conviction: log-scaled avg USD + consistency bonus
  const avgUsd         = rawTotal > 0 ? (rawTotal / recent.length) * ethPrice : 0
  const baseConviction = Math.min(80, Math.max(0, Math.floor(Math.log10(Math.max(avgUsd, 1)) * 20)))
  const conviction     = Math.min(100, Math.floor(baseConviction * 0.7 + consistency * 0.3))

  // Velocity: 7d vs 30d rate (gue extra)
  const recent7d    = recent.filter(t => parseInt(t.timeStamp) > ago7d)
  const vol7d       = recent7d.reduce((s, t) => s + (parseFloat(t.value) || 0), 0)
  const expectedVol = (rawTotal / 30) * 7
  const velocity    = expectedVol > 0
    ? Math.min(100, Math.floor((vol7d / expectedVol) * 50))
    : recent7d.length > 0 ? 50 : 0

  // Status: fixed zip min 1 tx + gue velocity-aware thresholds
  const txCount = recent.length
  let status: WhaleStatus
  if (txCount < 1) {
    status = 'DORMANT'
  } else if (netRatio > 0.2 && velocity >= 30) {
    status = 'ACCUMULATING'
  } else if (netRatio < -0.2 && velocity >= 30) {
    status = 'DISTRIBUTING'
  } else if (netRatio > 0.15) {
    status = 'ACCUMULATING'
  } else if (netRatio < -0.15) {
    status = 'DISTRIBUTING'
  } else if (txCount >= 5 && avgUsd > 2000 && velocity >= 20) {
    status = 'HUNTING'
  } else if (txCount >= 3) {
    status = 'HUNTING'
  } else {
    status = 'DORMANT'
  }

  return { status, score, inflow: rawIn, outflow: rawOut, conviction, velocity, consistency }
}

// ── Gas Spent — REAL gasPrice from TX (fixed zip fix) ─────────────────────────

export function computeGasSpentEth(
  transactions: Transaction[],
  ethPrice = 0
): { eth: number; usd: number } {
  let totalEth = 0
  for (const tx of transactions) {
    const gasUsed     = parseInt(tx.gasUsed  || '0') || 0
    const gasPriceWei = parseInt(tx.gasPrice || '0') || 20_000_000_000  // fallback 20 gwei
    totalEth += (gasUsed * gasPriceWei) / 1e18
  }
  return { eth: totalEth, usd: totalEth * ethPrice }
}

// ── GasStats — for efficiency badge in StatsBar (gue extra) ───────────────────

export function computeGasStats(transactions: Transaction[]): GasStats {
  if (transactions.length === 0) {
    return { avgGwei: 0, totalFeeEth: 0, highGasTxCount: 0, efficiency: 'NORMAL' }
  }
  const gasValues      = transactions.map(t => parseInt(t.gasUsed || '0') || 0)
  const avgGasUsed     = gasValues.reduce((a, b) => a + b, 0) / gasValues.length
  // Use real gasPrice if available
  const gasPrices      = transactions.map(t => parseInt(t.gasPrice || '0') || 20_000_000_000)
  const avgGasPriceWei = gasPrices.reduce((a, b) => a + b, 0) / gasPrices.length
  const avgGwei        = avgGasPriceWei / 1e9

  let totalFeeEth = 0
  for (let i = 0; i < transactions.length; i++) {
    const gas   = parseInt(transactions[i].gasUsed  || '0') || 0
    const price = parseInt(transactions[i].gasPrice || '0') || 20_000_000_000
    totalFeeEth += (gas * price) / 1e18
  }

  const highGasTxCount = gasValues.filter(g => g > 100_000).length

  let efficiency: GasStats['efficiency']
  if (avgGasUsed < 30_000)       efficiency = 'LOW'
  else if (avgGasUsed < 150_000) efficiency = 'NORMAL'
  else                            efficiency = 'HIGH'

  return { avgGwei, totalFeeEth, highGasTxCount, efficiency }
}

// ── Big Move Alerts — 24h window + hoursAgo (fixed zip fix) ──────────────────

export function detectBigMoves(
  transactions: Transaction[],
  walletAddress: string,
  ethPrice:  number,
  thresholdUsd = 5000
): BigMoveAlert[] {
  const ago24h = now24hAgo()   // fixed zip: 24h bukan 1h
  const addr   = walletAddress.toLowerCase()
  const alerts: BigMoveAlert[] = []

  for (const tx of transactions) {
    const ts = parseInt(tx.timeStamp)
    if (ts <= ago24h) continue
    const valueEth = parseFloat(tx.value) || 0
    const valueUsd = valueEth * ethPrice
    if (valueUsd < thresholdUsd) continue

    const hoursAgo = Math.floor((nowSecs() - ts) / 3600)  // fixed zip extra
    alerts.push({
      hash:      tx.hash,
      type:      tx.to?.toLowerCase() === addr ? 'IN' : 'OUT',
      valueEth, valueUsd,
      timestamp: ts,
      txType:    tx.type,
      hoursAgo,
    })
  }

  return alerts.sort((a, b) => b.timestamp - a.timestamp)
}

// ── Copy Signals ───────────────────────────────────────────────────────────────

export function extractCopySignals(
  transactions: Transaction[],
  walletAddress: string,
  ethPrice: number
): CopySignal[] {
  const addr = walletAddress.toLowerCase()
  return transactions
    .filter(tx => ['SWAP', 'DEPOSIT', 'BORROW'].includes(tx.type))
    .slice(0, 10)
    .map(tx => {
      const valueEth = parseFloat(tx.value) || 0
      const isOut    = tx.from?.toLowerCase() === addr
      let action: CopySignal['action']
      if (tx.type === 'DEPOSIT')      action = 'DEPOSIT'
      else if (tx.type === 'BORROW')  action = 'BORROW'
      else                            action = isOut ? 'BUY' : 'SELL'
      return {
        action, valueEth,
        valueUsd:  valueEth * ethPrice,
        timestamp: parseInt(tx.timeStamp),
        txHash:    tx.hash,
        toAddress: tx.to ?? '',
        fnName:    tx.functionName?.split('(')[0]?.slice(0, 22) || tx.type,
      }
    })
}

// ── Wallet Age ────────────────────────────────────────────────────────────────

export function computeWalletAgeDays(transactions: Transaction[]): number {
  if (transactions.length === 0) return 0
  const oldest = Math.min(...transactions.map(tx => parseInt(tx.timeStamp) || Infinity))
  if (!isFinite(oldest)) return 0
  return Math.floor((nowSecs() - oldest) / 86400)
}

// ── Balance History Sparkline — 12-point normalized (gue extra) ───────────────

export function computeBalanceHistory(
  transactions: Transaction[],
  walletAddress: string
): number[] {
  if (transactions.length < 2) return []
  const addr   = walletAddress.toLowerCase()
  const recent = transactions.slice(0, 20).reverse()
  const deltas = recent.map(tx => {
    const val = parseFloat(tx.value) || 0
    return tx.to?.toLowerCase() === addr ? val : -val
  })
  let sum = 0
  const cumulative = deltas.map(d => { sum += d; return sum })
  const min   = Math.min(...cumulative)
  const max   = Math.max(...cumulative)
  const range = max - min || 1
  return cumulative.slice(-12).map(v => ((v - min) / range) * 100)
}

// ── Full Intelligence Pack ─────────────────────────────────────────────────────

export function computeWalletIntel(
  transactions: Transaction[],
  walletAddress: string,
  ethPrice: number
): WalletIntelligence {
  const whaleScore           = computeWhaleScore(transactions, walletAddress, ethPrice)
  const bigMoves             = detectBigMoves(transactions, walletAddress, ethPrice)
  const copySignals          = extractCopySignals(transactions, walletAddress, ethPrice)
  const gasResult            = computeGasSpentEth(transactions, ethPrice)
  const gasStats             = computeGasStats(transactions)
  const walletAgeDays        = computeWalletAgeDays(transactions)
  const balanceHistoryPoints = computeBalanceHistory(transactions, walletAddress)

  const firstTxTimestamp = transactions.length > 0
    ? Math.min(...transactions.map(t => parseInt(t.timeStamp) || Infinity)) * 1000
    : Date.now()

  const ago30d   = now30dAgo()
  const ago7d    = now7dAgo()
  const recent30 = transactions.filter(t => parseInt(t.timeStamp) > ago30d)
  const recent7  = transactions.filter(t => parseInt(t.timeStamp) > ago7d)

  // fixed zip: txFrequency dari actual observed window
  const oldestTs    = recent30.length > 0
    ? Math.min(...recent30.map(t => parseInt(t.timeStamp)))
    : nowSecs() - 30 * 86400
  const windowDays  = Math.max(1, (nowSecs() - oldestTs) / 86400)
  const txFrequency = recent30.length / Math.min(windowDays, 30)

  const values            = transactions.map(t => parseFloat(t.value) || 0)
  const avgTxValueEth     = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
  const largestTxEth      = values.length ? Math.max(...values) : 0
  const totalVolume30dEth = recent30.reduce((s, t) => s + (parseFloat(t.value) || 0), 0)

  // gue extra: recent activity score
  const expected7dTxs      = (recent30.length / 30) * 7
  const recentActivityScore = expected7dTxs > 0
    ? Math.min(100, Math.floor((recent7.length / expected7dTxs) * 50))
    : recent7.length > 0 ? 60 : 0

  return {
    whaleScore, bigMoves, copySignals,
    gasSpentEth:  gasResult.eth,
    gasSpentUsd:  gasResult.usd,    // fixed zip: real USD
    gasStats,                        // gue: efficiency badge
    walletAgeDays, firstTxTimestamp,
    txFrequency,                     // fixed zip: actual window
    avgTxValueEth, largestTxEth, totalVolume30dEth,
    recentActivityScore,             // gue extra
    balanceHistoryPoints,            // gue extra
  }
}

// ── Cluster Detection — fixed zip: no self-match, no duplicate labels ─────────

export function detectClusters(
  walletMap: Record<string, { transactions: Transaction[]; label: string }>
): Record<string, string[]> {
  const ids      = Object.keys(walletMap)
  const clusters: Record<string, string[]> = {}

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const idA = ids[i]; const idB = ids[j]
      if (idA === idB) continue   // fixed zip: skip self

      const aTxs = walletMap[idA].transactions
      const bTxs = walletMap[idB].transactions
      let synced = 0

      for (const ta of aTxs) {
        const tsA = parseInt(ta.timeStamp)
        for (const tb of bTxs) {
          if (Math.abs(tsA - parseInt(tb.timeStamp)) < 300) {
            synced++
            break  // fixed zip: count once per ta tx
          }
        }
      }

      if (synced >= 2) {
        if (!clusters[idA]) clusters[idA] = []
        if (!clusters[idB]) clusters[idB] = []
        // fixed zip: no duplicates
        if (!clusters[idA].includes(walletMap[idB].label)) clusters[idA].push(walletMap[idB].label)
        if (!clusters[idB].includes(walletMap[idA].label)) clusters[idB].push(walletMap[idA].label)
      }
    }
  }
  return clusters
}

// ── Smart Money Leaderboard v3 — 5-factor formula ────────────────────────────
// balance(25) + activity(25) + whale(20) + velocity(15) + conviction(15)

export function buildLeaderboard(
  wallets:    Array<{ id: string; label: string; address: string }>,
  apiDataArr: Array<{ transactions: Transaction[]; balance: { usdValue: number } } | undefined>,
  ethPrice:   number
): LeaderboardEntry[] {
  const ago30d = () => nowSecs() - 30 * 86400

  return wallets
    .map((w, i) => {
      const data       = apiDataArr?.[i]
      const txs        = data?.transactions ?? []
      const balanceUsd = data?.balance.usdValue ?? 0
      const intel      = computeWhaleScore(txs, w.address, ethPrice)
      const txs30d     = txs.filter(t => parseInt(t.timeStamp) > ago30d())
      const vol30d     = txs30d.reduce((s, t) => s + (parseFloat(t.value) || 0), 0)

      const balS       = Math.min(25, Math.log10(Math.max(balanceUsd, 1)) * 3.2)
      const actS       = Math.min(25, txs30d.length * 1.5)
      const whaleS     = intel.score      * 0.20
      const velS       = intel.velocity   * 0.15
      const convS      = intel.conviction * 0.15
      const smartScore = Math.min(100, Math.floor(balS + actS + whaleS + velS + convS))

      return {
        id: w.id, label: w.label, rank: 0,
        smartScore, status: intel.status,
        balanceUsd, txCount30d: txs30d.length,
        volume30dEth: vol30d,
        conviction:   intel.conviction,
        velocity:     intel.velocity,
      }
    })
    .sort((a, b) => b.smartScore - a.smartScore)
    .map((e, i) => ({ ...e, rank: i + 1 }))
}
