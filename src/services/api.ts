/**
 * ZERØ WATCH — API Service v11
 * ==============================
 * v11 changes:
 * - Token spam filter: skip token tanpa harga CoinGecko atau USD < $1
 * - CoinGecko free tier untuk token USD pricing (no key needed)
 * - DEMO_WALLETS constant: 5 active whale wallets siap pakai
 * - Total portfolio USD = ETH + token values (bukan ETH-only)
 */

const PROXY = (import.meta.env.VITE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? '';

if (!PROXY && import.meta.env.PROD) {
  console.error('[ZERØ] VITE_PROXY_URL not set — API calls will fail in production');
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

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  isError: string;
  functionName: string;
  gasUsed: string;
  type: TxType;
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
    label: 'Binance Deployer',
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

// ── Chain config ──────────────────────────────────────────────────────────────

const CHAIN_ID: Record<Chain, number> = {
  ETH:  1,
  ARB:  42161,
  BASE: 8453,
  OP:   10,
};

// ── Legit ERC-20 contracts ────────────────────────────────────────────────────

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

// ── CoinGecko price fetcher (via proxy) ───────────────────────────────────────

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
    try {
      const ids = needFetch.slice(0, 30).join(',');
      const url = `${PROXY}/coingecko/token_price/ethereum?contract_addresses=${ids}&vs_currencies=usd`;
      const res = await fetch(url, { signal });
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
      // CoinGecko gagal — lanjut tanpa price
    }
  }

  return result;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

async function etherscanGet<T>(
  params: Record<string, string | number>,
  signal?: AbortSignal
): Promise<T> {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  ).toString();
  const url = `${PROXY}/etherscan?${qs}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Etherscan proxy ${res.status}`);
  return res.json() as Promise<T>;
}

async function alchemyPost<T>(
  chain: Chain,
  method: string,
  params: unknown[],
  signal?: AbortSignal
): Promise<T> {
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

// ── ETH Price ─────────────────────────────────────────────────────────────────

let _cachedEthPrice: number | null = null;
let _ethPriceCacheTime = 0;

export async function getEthPrice(signal?: AbortSignal): Promise<number> {
  const now = Date.now();
  if (_cachedEthPrice && now - _ethPriceCacheTime < 60_000) return _cachedEthPrice;

  try {
    const data = await etherscanGet<{ status: string; result: { ethusd: string } }>(
      { chainid: 1, module: 'stats', action: 'ethprice' },
      signal
    );
    if (data.status === '1') {
      _cachedEthPrice = parseFloat(data.result.ethusd);
      _ethPriceCacheTime = now;
      return _cachedEthPrice;
    }
  } catch (e) {
    if ((e as Error).name !== 'AbortError') console.error('[ZERØ] ETH price failed', e);
  }

  return _cachedEthPrice ?? 1968;
}

// ── Wallet Balance ────────────────────────────────────────────────────────────

export async function getWalletBalance(
  address: string,
  chain: Chain = 'ETH',
  signal?: AbortSignal
): Promise<string> {
  try {
    const data = await etherscanGet<{ status: string; result: string }>(
      { chainid: CHAIN_ID[chain], module: 'account', action: 'balance', address, tag: 'latest' },
      signal
    );
    if (data.status === '1') {
      return (Number(BigInt(data.result)) / 1e18).toFixed(4);
    }
  } catch (e) {
    if ((e as Error).name !== 'AbortError') console.error('[ZERØ] Balance failed', e);
  }
  return '0';
}

// ── Token Holdings v2 ─────────────────────────────────────────────────────────

export async function getTokenHoldings(
  address: string,
  signal?: AbortSignal
): Promise<TokenHolding[]> {
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

      if (!isLegit && (price === 0 || usdValue < 1)) continue;

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
    if ((e as Error).name !== 'AbortError') console.error('[ZERØ] Token holdings failed', e);
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
  chain: Chain = 'ETH',
  limit = 25,
  signal?: AbortSignal
): Promise<Transaction[]> {
  try {
    const data = await etherscanGet<{
      status: string;
      result: {
        hash: string; from: string; to: string; value: string;
        timeStamp: string; isError: string; functionName: string;
        input: string; gasUsed: string;
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
        type: classifyTx(tx),
      }));
    }
  } catch (e) {
    if ((e as Error).name !== 'AbortError') console.error('[ZERØ] TX fetch failed', e);
  }
  return [];
}

// ── Main fetch ────────────────────────────────────────────────────────────────

export async function fetchWalletData(
  address: string,
  chain: Chain = 'ETH',
  signal?: AbortSignal
): Promise<WalletData> {
  const [ethBalance, tokens, transactions, ethPrice] = await Promise.all([
    getWalletBalance(address, chain, signal),
    getTokenHoldings(address, signal),
    getTransactions(address, chain, 25, signal),
    getEthPrice(signal),
  ]);

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
