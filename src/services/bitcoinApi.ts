/**
 * ZERØ WATCH — Bitcoin API Service v1
 * =======================================
 * Bitcoin wallet tracking via Blockstream Esplora API (free, no key).
 * Tracks: Satoshi genesis, MicroStrategy, Mt.Gox trustee, early whales.
 *
 * Note: BTC uses different address format (P2PKH, P2SH, Bech32)
 * AbortController ✓  mountedRef compatible ✓
 */

const BTC_API   = 'https://blockstream.info/api'
const BTC_PRICE = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'

// ── Known BTC Whales ─────────────────────────────────────────────────────────

export const BTC_WHALE_LABELS: Record<string, { label: string; description: string; category: string }> = {
  // Satoshi Nakamoto
  '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa': {
    label: 'Satoshi Genesis',
    description: 'Genesis block coinbase — first ever Bitcoin. ~1M BTC. Never moved.',
    category: 'Legend',
  },
  '12cbQLTFMXRnSzktFkuoG3eHoMeFtpTu3S': {
    label: 'Satoshi Block 1',
    description: 'Satoshi early mining wallet. Part of ~1M BTC untouched.',
    category: 'Legend',
  },
  // MicroStrategy / Michael Saylor
  'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh': {
    label: 'MicroStrategy',
    description: 'MicroStrategy main BTC holdings. 214,246+ BTC ($14B+). Saylor thesis.',
    category: 'Institution',
  },
  // Mt. Gox Trustee (Nobuaki Kobayashi)
  '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF': {
    label: 'Mt.Gox Trustee',
    description: 'Mt.Gox bankruptcy trustee. 142K BTC remaining. Repayment = sell pressure.',
    category: 'CEX Whale',
  },
  '16ftSEQ4ctQFDtVZiUBusQUjRrGhM3JYwe': {
    label: 'Mt.Gox Cold',
    description: 'Mt.Gox cold storage. Monitor for large outflows = market sell pressure.',
    category: 'CEX Whale',
  },
  // Binance BTC
  '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo': {
    label: 'Binance BTC Cold',
    description: 'Binance Bitcoin cold wallet. $7B+ BTC. Inflow = sell pressure signal.',
    category: 'CEX Whale',
  },
  // Coinbase BTC
  'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97': {
    label: 'Coinbase BTC Cold',
    description: 'Coinbase Bitcoin cold storage. ETF custody flows go here.',
    category: 'CEX Whale',
  },
  // Bitfinex
  '3D2oetdNuZUqQHPJmcMDDHYoqkyNVsFk9r': {
    label: 'Bitfinex BTC',
    description: 'Bitfinex cold wallet. ~168K BTC.',
    category: 'CEX Whale',
  },
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BtcBalance {
  address:    string
  btcBalance: string    // in BTC
  usdValue:   number
  confirmed:  number    // satoshis
  unconfirmed:number
}

export interface BtcTransaction {
  txid:      string
  blockTime: number
  valueIn:   number    // satoshis received
  valueOut:  number    // satoshis sent
  fee:       number
  type:      'IN' | 'OUT'
  valueBtc:  number
  valueUsd:  number
}

export interface BtcWalletData {
  address:      string
  balance:      BtcBalance
  transactions: BtcTransaction[]
  lastUpdated:  number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

let _btcPriceCache: { usd: number; ts: number } | null = null

export async function getBtcPrice(signal?: AbortSignal): Promise<number> {
  if (_btcPriceCache && Date.now() - _btcPriceCache.ts < 60_000) {
    return _btcPriceCache.usd
  }
  try {
    const res  = await fetch(BTC_PRICE, { signal })
    const data = await res.json()
    const usd  = data?.bitcoin?.usd ?? 65000
    _btcPriceCache = { usd, ts: Date.now() }
    return usd
  } catch {
    return _btcPriceCache?.usd ?? 65000
  }
}

// ── Fetch BTC wallet ──────────────────────────────────────────────────────────

export async function fetchBtcWalletData(
  address: string,
  signal?: AbortSignal
): Promise<BtcWalletData> {
  const btcPrice = await getBtcPrice(signal)

  // Fetch balance
  const [addrRes, txRes] = await Promise.all([
    fetch(`${BTC_API}/address/${address}`, { signal }),
    fetch(`${BTC_API}/address/${address}/txs`, { signal }),
  ])

  const addrData = await addrRes.json()
  const txData   = await txRes.json() as Array<{
    txid: string; status: { block_time?: number }
    vin: Array<{ prevout?: { scriptpubkey_address?: string; value?: number } }>
    vout: Array<{ scriptpubkey_address?: string; value?: number }>
    fee: number
  }>

  const confirmedBalance   = addrData?.chain_stats?.funded_txo_sum - addrData?.chain_stats?.spent_txo_sum
  const unconfirmedBalance = addrData?.mempool_stats?.funded_txo_sum - addrData?.mempool_stats?.spent_txo_sum
  const totalSats          = (confirmedBalance ?? 0) + (unconfirmedBalance ?? 0)
  const btcBalance         = (totalSats / 1e8).toFixed(8)
  const usdValue           = (totalSats / 1e8) * btcPrice

  // Parse transactions
  const transactions: BtcTransaction[] = (txData ?? []).slice(0, 20).map(tx => {
    const received  = (tx.vout ?? [])
      .filter(o => o.scriptpubkey_address === address)
      .reduce((s, o) => s + (o.value ?? 0), 0)
    const sent      = (tx.vin ?? [])
      .filter(i => i.prevout?.scriptpubkey_address === address)
      .reduce((s, i) => s + (i.prevout?.value ?? 0), 0)
    const net       = received - sent
    const valueBtc  = Math.abs(net) / 1e8
    const valueUsd  = valueBtc * btcPrice

    return {
      txid:      tx.txid,
      blockTime: (tx.status?.block_time ?? 0) * 1000,
      valueIn:   received,
      valueOut:  sent,
      fee:       tx.fee ?? 0,
      type:      net >= 0 ? 'IN' : 'OUT',
      valueBtc,
      valueUsd,
    }
  })

  return {
    address,
    balance: {
      address,
      btcBalance,
      usdValue,
      confirmed:   confirmedBalance ?? 0,
      unconfirmed: unconfirmedBalance ?? 0,
    },
    transactions,
    lastUpdated: Date.now(),
  }
}

export function isValidBtcAddress(addr: string): boolean {
  // P2PKH (starts with 1), P2SH (starts with 3), Bech32 (starts with bc1)
  return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(addr) ||
         /^bc1[a-z0-9]{6,90}$/.test(addr)
}
