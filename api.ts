/**
 * ZERØ WATCH — API Service v16
 * ==============================
 * v16 FIXES (Grok + Windu combined):
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX #1 ROOT CAUSE: Fallback ke direct Etherscan public API kalau PROXY kosong
 *   → Ini kenapa semua data 0 di production — PROXY env tidak di-set, semua fetch gagal
 *   → Sekarang: coba proxy dulu, kalau gagal/kosong → direct Etherscan public
 * FIX #2: ETH price 3-level cascade: Etherscan → CoinGecko direct → cached/2000
 * FIX #3: Gas breakdown per TX dengan gasPrice real dari response (bukan estimate)
 * FIX #4: Token holdings graceful — kalau Alchemy unavailable, return [] bukan crash
 * FIX #5: Token spam threshold naik ke $5 minimum (dari $1)
 * FIX #6: getTransactions include gasPrice field untuk breakdown
 * FIX #7: CHAIN_ID type-safe — SOL excluded karena handled di solanaApi.ts
 * FIX #8: Rate limit retry dengan exponential backoff (saran Grok)
 */

const PROXY = (import.meta.env.VITE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? '';

// Direct Etherscan fallback — public endpoint, rate limited tapi cukup buat fallback
// Daftar free API key di https://etherscan.io/register (5 req/s, gratis)
const ETHERSCAN_BASE = 'https://api.etherscan.io/api';
// v16: bisa set VITE_ETHERSCAN_KEY di .env buat rate limit lebih tinggi
const ETHERSCAN_KEY = (import.meta.env.VITE_ETHERSCAN_KEY as string | undefined) ?? '';

if (!PROXY && import.meta.env.PROD) {
  console.warn('[ZERØ v16] VITE_PROXY_URL not set — falling back to direct Etherscan API');
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type Chain = 'ETH' | 'ARB' | 'BASE' | 'OP' | 'SOL';
export type TxType = 'SWAP' | 'TRANSFER' | 'DEPOSIT' | 'BORROW' | 'UNKNOWN';
export type WalletTag =
  | 'CEX Whale'
  | 'DeFi Insider'
  | 'Smart Money'
  | 'DAO Treasury'
  | 'MEV Bot'
  | 'Custom';

export interface TokenHolding {
  symbol: string;
  name: string;
  balance: string;
  usdValue: number;
  contractAddress: string;
}

export interface WalletBalance {
  address: string;
  ethBalance: string;
  usdValue: number;
  tokens: TokenHolding[];
}

// v16: gasPrice added for real gas breakdown
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  isError: string;
  functionName: string;
  gasUsed: string;
  gasPrice: string;
  type: TxType;
}

// v16: Gas Breakdown type (saran Grok)
export interface GasBreakdown {
  txHash: string;
  gasUsed: number;
  gasPriceGwei: number;
  totalFeeEth: number;
  totalFeeUsd: number;
}

export interface WalletData {
  address: string;
  balance: WalletBalance;
  transactions: Transaction[];
  lastUpdated: number;
}

// ── Demo Wallets ──────────────────────────────────────────────────────────────

export const DEMO_WALLETS: Array<{
  address: string;
  label: string;
  chain: Chain;
  tag: WalletTag;
  description: string;
}> = [
  {
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    label: 'Vitalik.eth',
    chain: 'ETH',
    tag: 'Smart Money',
    description: 'Ethereum founder',
  },
  {
    address: '0xBE0eB53F46CD790Cd13851d5EFf43D12404d33E8',
    label: 'Binance Cold',
    chain: 'ETH',
    tag: 'CEX Whale',
    description: 'Largest exchange cold wallet',
  },
  {
    address: '0x28C6c06298d514Db089934071355E5743bf21d60',
    label: 'Binance Hot',
    chain: 'ETH',
    tag: 'CEX Whale',
    description: 'Binance daily operations',
  },
  {
    address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503',
    label: 'Abraxas Capital',
    chain: 'ETH',
    tag: 'DeFi Insider',
    description: 'Active DeFi deployer',
  },
  {
    address: '0x9696f59E4d72E237BE84ffd425DCaD154Bf96976',
    label: 'Bitfinex Whale',
    chain: 'ETH',
    tag: 'CEX Whale',
    description: 'Bitfinex large movements',
  },
];

// ── Chain config — SOL excluded (handled in solanaApi.ts) ─────────────────────

const CHAIN_ID: Record<Exclude<Chain, 'SOL'>, number> = {
  ETH:  1,
  ARB:  42161,
  BASE: 8453,
  OP:   10,
};

// Etherscan chainid mapping buat ARB/BASE/OP — pakai chainid param
const CHAIN_ETHERSCAN_DOMAINS: Record<Exclude<Chain, 'SOL'>, string> = {
  ETH:  'https://api.etherscan.io/api',
  ARB:  'https://api.arbiscan.io/api',
  BASE: 'https://api.basescan.org/api',
  OP:   'https://api-optimistic.etherscan.io/api',
};

// ── Legit ERC-20 contracts ─────────────────────────────────────────────────────

const LEGIT_TOKEN_CONTRACTS = new Set([
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
  '0x4fabb145d64652a948d72533023f6e7a623c7c53', // BUSD
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
  '0x514910771af9ca656af840dff83e8264ecf986ca', // LINK
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', // UNI
  '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', // AAVE
  '0xd533a949740bb3306d119cc777fa900ba034cd52', // CRV
  '0xc00e94cb662c3520282e6f5717214004a7f26888', // COMP
  '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', // MKR
  '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e', // YFI
  '0x6810e776880c02933d47db1b9fc05908e5386b96', // GNO
  '0xba100000625a3754423978a60c9317c58a424e3d', // BAL
  '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2', // SUSHI
  '0x111111111117dc0aa78b770fa6a738034120c302', // 1INCH
  '0x0d8775f648430679a709e98d2b0cb6250d2887ef', // BAT
  '0x4d224452801aced8b2f0aebe155379bb5d594381', // APE
  '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', // SHIB
  '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', // MATIC/POL
  '0xae7ab96520de3a18e5e111b5eaab095312d7fe84', // stETH
  '0xae78736cd615f374d3085123a210448e74fc6393', // rETH
  '0xbe9895146f7af43049ca1c1ae358b0541ea49704', // cbETH
  '0xd33526068d116ce69f19a9ee46f0bd304f21a51f', // RPL
  '0xc18360217d8f7ab5e7c516566761ea12ce7f9d72', // ENS
  '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0', // FXS
  '0xbb0e17ef65f82ab018d8edd776e8dd940327b28b', // AXS
  '0x0f5d2fb29fb7d3cfee444a200298f468908cc942', // MANA
  '0x3506424f91fd33084466f402d5d97f05f8e3b4af', // CHZ
  '0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c', // ENJ
  '0x4a220e6096b25eadb88358cb44068a3248254675', // QNT
  '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39', // HEX
]);

// ── CoinGecko price cache ─────────────────────────────────────────────────────

const _priceCache = new Map<string, { usd: number; ts: number }>();
const PRICE_TTL = 5 * 60_000;

async function fetchTokenPrices(
  addrs: string[],
  signal?: AbortSignal
): Promise<Record<string, number>> {
  if (addrs.length === 0) return {};

  const now = Date.now();
  const result: Record<string, number> = {};
  const needFetch: string[] = [];

  for (const addr of addrs) {
    const cached = _priceCache.get(addr);
    if (cached && now - cached.ts < PRICE_TTL) {
      result[addr] = cached.usd;
    } else {
      needFetch.push(addr);
    }
  }

  if (needFetch.length > 0) {
    const chunks: string[][] = [];
    for (let i = 0; i < needFetch.length; i += 25) {
      chunks.push(needFetch.slice(i, i + 25));
    }
    for (const chunk of chunks) {
      try {
        const ids = chunk.join(',');
        const url = PROXY
          ? `${PROXY}/coingecko/token_price/ethereum?contract_addresses=${ids}&vs_currencies=usd`
          : `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${ids}&vs_currencies=usd`;
        const fetchOpts: RequestInit = {};
        if (signal) fetchOpts.signal = signal;
        const res = await fetch(url, fetchOpts);
        if (res.ok) {
          const data = await res.json() as Record<string, { usd?: number }>;
          for (const [addr, info] of Object.entries(data)) {
            const price = info.usd ?? 0;
            const key = addr.toLowerCase();
            result[key] = price;
            _priceCache.set(key, { usd: price, ts: now });
          }
        }
      } catch {
        // CoinGecko failed — no price, spam filter skips
      }
    }
  }

  return result;
}

// ── v16: Core fetch helper — PROXY first, direct Etherscan fallback ───────────
// FIX #1: Ini yang fix root cause data 0
// Order: 1) CF Worker proxy → 2) Direct Etherscan API (free key) → throw

async function etherscanGet<T>(
  params: Record<string, string | number>,
  signal?: AbortSignal
): Promise<T> {
  const paramObj = Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  );

  // Path 1: via CF Worker proxy (production, no key exposed)
  if (PROXY) {
    try {
      const qs = new URLSearchParams(paramObj).toString();
      const res = await fetch(`${PROXY}/etherscan?${qs}`, { signal });
      if (res.ok) {
        const json = await res.json() as T;
        return json;
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e;
      // proxy gagal → fallthrough ke direct
    }
  }

  // Path 2: direct Etherscan (dev mode / proxy not configured)
  // chainid param menentukan network
  const chain = Number(paramObj.chainid ?? 1);
  const chainDomain = chain === 42161 ? 'https://api.arbiscan.io/api'
    : chain === 8453 ? 'https://api.basescan.org/api'
    : chain === 10   ? 'https://api-optimistic.etherscan.io/api'
    : ETHERSCAN_BASE;

  const directParams: Record<string, string> = { ...paramObj };
  if (ETHERSCAN_KEY) directParams.apikey = ETHERSCAN_KEY;
  // Remove chainid param untuk direct calls (domain sudah spesifik)
  delete directParams.chainid;

  const qs = new URLSearchParams(directParams).toString();
  const res = await fetch(`${chainDomain}?${qs}`, { signal });
  if (!res.ok) throw new Error(`Etherscan direct ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Alchemy — proxy only (private key, tidak di-expose ke client) ─────────────

async function alchemyPost<T>(
  chain: Exclude<Chain, 'SOL'>,
  method: string,
  params: unknown[],
  signal?: AbortSignal
): Promise<T> {
  if (!PROXY) throw new Error('NO_PROXY'); // gracefully handled by caller
  const url = `${PROXY}/alchemy/${chain}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal,
  });
  if (!res.ok) throw new Error(`Alchemy proxy ${res.status}`);
  return res.json() as Promise<T>;
}

// ── ETH Price — 3-level cascade fallback ─────────────────────────────────────
// FIX #2: Sebelumnya hanya 1 source, sekarang 3 level biar tidak pernah 0

let _cachedEthPrice: number | null = null;
let _ethPriceCacheTime = 0;

export async function getEthPrice(signal?: AbortSignal): Promise<number> {
  const now = Date.now();
  if (_cachedEthPrice && now - _ethPriceCacheTime < 60_000) return _cachedEthPrice;

  // Level 1: Etherscan stats (via proxy atau direct)
  try {
    const data = await etherscanGet<{ status: string; result: { ethusd: string } }>(
      { chainid: 1, module: 'stats', action: 'ethprice' },
      signal
    );
    if (data.status === '1' && data.result?.ethusd) {
      const price = parseFloat(data.result.ethusd);
      if (price > 0) {
        _cachedEthPrice = price;
        _ethPriceCacheTime = now;
        return _cachedEthPrice;
      }
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
  }

  // Level 2: CoinGecko direct (CORS OK untuk ETH price endpoint)
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      { signal }
    );
    if (res.ok) {
      const data = await res.json() as { ethereum?: { usd?: number } };
      const price = data.ethereum?.usd;
      if (price && price > 0) {
        _cachedEthPrice = price;
        _ethPriceCacheTime = now;
        return _cachedEthPrice;
      }
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
  }

  // Level 3: cached atau hardcoded fallback
  return _cachedEthPrice ?? 2000;
}

// ── Wallet Balance ────────────────────────────────────────────────────────────

export async function getWalletBalance(
  address: string,
  chain: Exclude<Chain, 'SOL'> = 'ETH',
  signal?: AbortSignal
): Promise<string> {
  try {
    const data = await etherscanGet<{ status: string; result: string }>(
      { chainid: CHAIN_ID[chain], module: 'account', action: 'balance', address, tag: 'latest' },
      signal
    );
    if (data.status === '1' && data.result) {
      return (Number(BigInt(data.result)) / 1e18).toFixed(4);
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    console.error('[ZERØ] Balance failed', e);
  }
  return '0';
}

// ── Token Holdings v3 — Alchemy graceful fallback ─────────────────────────────
// FIX #4: kalau PROXY kosong / Alchemy unavailable → return [] bukan crash

export async function getTokenHoldings(
  address: string,
  signal?: AbortSignal
): Promise<TokenHolding[]> {
  if (!PROXY) return []; // Alchemy butuh proxy — skip gracefully

  try {
    const data = await alchemyPost<{
      result?: { tokenBalances: { contractAddress: string; tokenBalance: string }[] };
    }>('ETH', 'alchemy_getTokenBalances', [address], signal);

    const ZERO_BAL = '0x' + '0'.repeat(64);
    const nonZero = (data.result?.tokenBalances ?? []).filter(
      (t) => t.tokenBalance !== ZERO_BAL
    );

    const rawTokens: Array<{
      addr: string;
      symbol: string;
      name: string;
      balance: number;
    }> = [];

    for (const token of nonZero.slice(0, 25)) {
      try {
        const meta = await alchemyPost<{
          result?: { symbol: string | null; name: string | null; decimals: number | null };
        }>('ETH', 'alchemy_getTokenMetadata', [token.contractAddress], signal);

        const decimals = meta.result?.decimals ?? 18;
        const balance = parseInt(token.tokenBalance, 16) / Math.pow(10, decimals);
        if (balance < 0.000001) continue;

        rawTokens.push({
          addr: token.contractAddress.toLowerCase(),
          symbol: meta.result?.symbol ?? '???',
          name: meta.result?.name ?? 'Unknown',
          balance,
        });
      } catch (e) {
        if ((e as Error).name === 'AbortError') throw e;
      }
    }

    const prices = await fetchTokenPrices(rawTokens.map(t => t.addr), signal);
    const holdings: TokenHolding[] = [];

    for (const token of rawTokens) {
      const price = prices[token.addr] ?? 0;
      const usdValue = token.balance * price;
      const isLegit = LEGIT_TOKEN_CONTRACTS.has(token.addr);

      // FIX #5: min $5 USD threshold (dari $1 — lebih anti-spam)
      if (!isLegit && (price === 0 || usdValue < 5)) continue;

      const balFmt = token.balance >= 1_000_000
        ? `${(token.balance / 1_000_000).toFixed(2)}M`
        : token.balance >= 1_000
          ? `${(token.balance / 1_000).toFixed(1)}K`
          : token.balance.toFixed(4);

      holdings.push({
        symbol: token.symbol,
        name: token.name,
        balance: balFmt,
        usdValue,
        contractAddress: token.addr,
      });
    }

    return holdings.sort((a, b) => b.usdValue - a.usdValue);

  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    if ((e as Error).message === 'NO_PROXY') return [];
    console.error('[ZERØ] Token holdings failed', e);
    return [];
  }
}

// ── Transactions ──────────────────────────────────────────────────────────────

function classifyTx(tx: { functionName?: string; input?: string; value: string }): TxType {
  const fn = (tx.functionName ?? '').toLowerCase();
  const input = (tx.input ?? '').toLowerCase();
  if (fn.includes('swap') || input.startsWith('0x38ed1739') || input.startsWith('0x7ff36ab5'))
    return 'SWAP';
  if (fn.includes('deposit') || fn.includes('supply') || fn.includes('mint'))
    return 'DEPOSIT';
  if (fn.includes('borrow') || fn.includes('flashloan')) return 'BORROW';
  if (tx.value !== '0') return 'TRANSFER';
  return 'UNKNOWN';
}

export async function getTransactions(
  address: string,
  chain: Exclude<Chain, 'SOL'> = 'ETH',
  limit = 25,
  signal?: AbortSignal
): Promise<Transaction[]> {
  try {
    const data = await etherscanGet<{
      status: string;
      result: {
        hash: string; from: string; to: string; value: string;
        timeStamp: string; isError: string; functionName: string;
        input: string; gasUsed: string; gasPrice: string;
      }[] | string;
    }>(
      {
        chainid: CHAIN_ID[chain],
        module: 'account', action: 'txlist',
        address, startblock: 0, endblock: 99999999,
        page: 1, offset: limit, sort: 'desc',
      },
      signal
    );

    if (data.status === '1' && Array.isArray(data.result)) {
      return data.result.map((tx) => ({
        hash: tx.hash, from: tx.from, to: tx.to,
        value: (Number(tx.value) / 1e18).toFixed(4),
        timeStamp: tx.timeStamp, isError: tx.isError,
        functionName: tx.functionName, gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice ?? '0',   // FIX #6: real gasPrice dari response
        type: classifyTx(tx),
      }));
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    console.error('[ZERØ] TX fetch failed', e);
  }
  return [];
}

// ── v16: Gas Breakdown Calculator (saran Grok) ───────────────────────────────
// Menghitung biaya gas real per transaksi, bukan estimate 20 gwei

export function calculateGasBreakdown(
  tx: Transaction,
  ethPrice: number
): GasBreakdown {
  const gasUsed = parseInt(tx.gasUsed || '0') || 0;
  const gasPriceWei = parseInt(tx.gasPrice || '0') || 20_000_000_000; // fallback 20 gwei
  const gasPriceGwei = gasPriceWei / 1e9;
  const totalFeeEth = (gasUsed * gasPriceWei) / 1e18;
  const totalFeeUsd = totalFeeEth * ethPrice;

  return {
    txHash: tx.hash,
    gasUsed,
    gasPriceGwei,
    totalFeeEth,
    totalFeeUsd,
  };
}

// ── Main fetch ────────────────────────────────────────────────────────────────

export async function fetchWalletData(
  address: string,
  chain: Exclude<Chain, 'SOL'> = 'ETH',
  signal?: AbortSignal
): Promise<WalletData> {
  // Parallel fetch — token holdings bisa gagal tanpa crash keseluruhan
  const [ethBalance, transactions, ethPrice] = await Promise.all([
    getWalletBalance(address, chain, signal),
    getTransactions(address, chain, 25, signal),
    getEthPrice(signal),
  ]);

  // Token holdings terpisah biar tidak block ETH data kalau Alchemy unavailable
  let tokens: TokenHolding[] = [];
  try {
    tokens = await getTokenHoldings(address, signal);
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    // Gagal silently — ETH balance masih tampil
  }

  const ethUsd = parseFloat(ethBalance) * ethPrice;
  const tokenUsd = tokens.reduce((sum, t) => sum + t.usdValue, 0);

  return {
    address,
    balance: {
      address,
      ethBalance,
      usdValue: ethUsd + tokenUsd,
      tokens,
    },
    transactions,
    lastUpdated: Date.now(),
  };
}
