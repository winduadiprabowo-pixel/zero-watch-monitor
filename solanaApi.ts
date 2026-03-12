/**
 * ZERØ WATCH — Solana API Service v2
 * =====================================
 * v2 FIXES (Grok + Windu combined):
 * ─────────────────────────────────────────────────────────────────────────────
 * FIX #1: getMultipleParsedTransactions → getParsedTransactions (method valid)
 *   → v1 pakai method yang tidak exist di public RPC → selalu null → no TX data
 * FIX #2: Retry logic buat Solana public RPC (sering rate limit)
 * FIX #3: SOL price fallback ke CoinGecko via proxy kalau tersedia
 * FIX #4: getSolTokens — tambah lebih banyak known SPL tokens
 * FIX #5: getSolTransactions — fallback graceful kalau parsed TX gagal
 * FIX #6: isValidSolAddress — lebih strict validation
 */

const PROXY = (import.meta.env.VITE_PROXY_URL as string | undefined)?.replace(/\/$/, '') ?? '';

// Public Solana RPC — rate limited, tapi free
const SOL_RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',  // backup
];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SolTokenHolding {
  symbol:      string;
  name:        string;
  balance:     string;
  usdValue:    number;
  mintAddress: string;
}

export interface SolWalletBalance {
  address:    string;
  solBalance: string;
  usdValue:   number;
  tokens:     SolTokenHolding[];
}

export interface SolTransaction {
  signature:   string;
  blockTime:   number;
  type:        'TRANSFER' | 'SWAP' | 'UNKNOWN';
  valueSOL:    number;
  from:        string;
  to:          string;
  err:         boolean;
}

export interface SolWalletData {
  address:      string;
  balance:      SolWalletBalance;
  transactions: SolTransaction[];
  lastUpdated:  number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function isValidSolAddress(addr: string): boolean {
  // Base58: no 0, O, I, l — exactly 32-44 chars
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr.trim());
}

// v2: retry helper buat rate limited Solana RPC
async function rpcPost<T>(
  method: string,
  params: unknown[],
  signal?: AbortSignal,
  retries = 2
): Promise<T | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const endpoint = SOL_RPC_ENDPOINTS[attempt % SOL_RPC_ENDPOINTS.length];
    try {
      const res = await fetch(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        signal,
      });
      if (res.status === 429) {
        // Rate limited — wait dan retry
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
          continue;
        }
        return null;
      }
      if (!res.ok) return null;
      const json = await res.json() as { result?: T; error?: { message?: string } };
      if (json.error) {
        console.warn('[ZERØ SOL] RPC error:', json.error.message);
        return null;
      }
      return json.result ?? null;
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') throw e;
      if (attempt === retries) return null;
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  return null;
}

// ── SOL Price — proxy dulu kalau ada, fallback CoinGecko direct ──────────────

let _cachedSolPrice: number | null = null;
let _solPriceCacheTime = 0;

export async function getSolPrice(signal?: AbortSignal): Promise<number> {
  const now = Date.now();
  if (_cachedSolPrice && now - _solPriceCacheTime < 60_000) return _cachedSolPrice;

  // Via proxy kalau ada (avoids CORS di beberapa browser)
  const url = PROXY
    ? `${PROXY}/coingecko/simple/price?ids=solana&vs_currencies=usd`
    : 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';

  try {
    const res  = await fetch(url, { signal });
    if (!res.ok) return _cachedSolPrice ?? 150;
    const data = await res.json() as { solana?: { usd?: number } };
    const price = data.solana?.usd ?? 0;
    if (price > 0) {
      _cachedSolPrice    = price;
      _solPriceCacheTime = now;
    }
    return _cachedSolPrice ?? 150;
  } catch {
    return _cachedSolPrice ?? 150;
  }
}

// ── SOL Balance ───────────────────────────────────────────────────────────────

export async function getSolBalance(
  address: string,
  signal?: AbortSignal
): Promise<string> {
  const result = await rpcPost<number>(
    'getBalance',
    [address, { commitment: 'confirmed' }],
    signal
  );
  if (result === null) return '0';
  const sol = (result as unknown as number) / 1e9;
  return sol.toFixed(4);
}

// ── SPL Token Accounts ────────────────────────────────────────────────────────

interface TokenAccountResult {
  account: {
    data: {
      parsed: {
        info: {
          mint:        string;
          tokenAmount: { uiAmountString: string };
        };
      };
    };
  };
}

// v2: Extended known SPL tokens list
const KNOWN_SPL: Record<string, { symbol: string; name: string; priceType: 'stable' | 'sol' | 'fetch' }> = {
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC',    name: 'USD Coin',       priceType: 'stable' },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT',    name: 'Tether',          priceType: 'stable' },
  'So11111111111111111111111111111111111111112':    { symbol: 'wSOL',    name: 'Wrapped SOL',     priceType: 'sol'    },
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': { symbol: 'mSOL',    name: 'Marinade SOL',    priceType: 'sol'    },
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn': { symbol: 'JitoSOL', name: 'Jito SOL',        priceType: 'sol'    },
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': { symbol: 'BONK',    name: 'Bonk',            priceType: 'fetch'  },
  'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk':   { symbol: 'WEN',     name: 'WEN',             priceType: 'fetch'  },
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm': { symbol: 'WIF',     name: 'dogwifhat',       priceType: 'fetch'  },
  'A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM':  { symbol: 'USDCet',  name: 'USDC (Portal)',   priceType: 'stable' },
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs': { symbol: 'ETH',     name: 'Ethereum (Worm)', priceType: 'fetch'  },
  '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E': { symbol: 'BTC',     name: 'Bitcoin (Worm)',  priceType: 'fetch'  },
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE':  { symbol: 'ORCA',    name: 'Orca',            priceType: 'fetch'  },
  'MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey':  { symbol: 'MNDE',    name: 'Marinade',        priceType: 'fetch'  },
};

// Simple SPL price fetcher via CoinGecko symbol mapping
const SPL_GECKO_IDS: Record<string, string> = {
  'BONK': 'bonk', 'WIF': 'dogwifcoin', 'ORCA': 'orca',
  'ETH': 'ethereum', 'BTC': 'bitcoin', 'WEN': 'wen-4',
};

let _splPriceCache: Record<string, number> = {};
let _splPriceCacheTime = 0;

async function fetchSplPrices(signal?: AbortSignal): Promise<Record<string, number>> {
  const now = Date.now();
  if (Object.keys(_splPriceCache).length > 0 && now - _splPriceCacheTime < 5 * 60_000) {
    return _splPriceCache;
  }

  const ids = Object.values(SPL_GECKO_IDS).join(',');
  const url = PROXY
    ? `${PROXY}/coingecko/simple/price?ids=${ids}&vs_currencies=usd`
    : `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return _splPriceCache;
    const data = await res.json() as Record<string, { usd?: number }>;
    const prices: Record<string, number> = {};
    for (const [sym, geckoId] of Object.entries(SPL_GECKO_IDS)) {
      prices[sym] = data[geckoId]?.usd ?? 0;
    }
    _splPriceCache = prices;
    _splPriceCacheTime = now;
    return prices;
  } catch {
    return _splPriceCache;
  }
}

export async function getSolTokens(
  address: string,
  solPrice: number,
  signal?: AbortSignal
): Promise<SolTokenHolding[]> {
  const result = await rpcPost<{ value: TokenAccountResult[] }>(
    'getTokenAccountsByOwner',
    [
      address,
      { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
      { encoding: 'jsonParsed' },
    ],
    signal
  );

  if (!result?.value) return [];

  // Fetch SPL prices once
  const splPrices = await fetchSplPrices(signal);

  const holdings: SolTokenHolding[] = [];

  for (const acct of result.value.slice(0, 20)) {
    const info   = acct.account.data.parsed.info;
    const mint   = info.mint;
    const bal    = parseFloat(info.tokenAmount.uiAmountString) || 0;
    if (bal <= 0) continue;

    const known = KNOWN_SPL[mint];
    if (!known) continue;

    let usdValue = 0;
    if (known.priceType === 'stable') {
      usdValue = bal;
    } else if (known.priceType === 'sol') {
      usdValue = bal * solPrice;
    } else if (known.priceType === 'fetch') {
      usdValue = bal * (splPrices[known.symbol] ?? 0);
    }

    holdings.push({
      symbol:      known.symbol,
      name:        known.name,
      balance:     bal >= 1_000_000 ? `${(bal / 1_000_000).toFixed(2)}M`
                 : bal >= 1_000     ? `${(bal / 1_000).toFixed(1)}K`
                 : bal.toFixed(4),
      usdValue,
      mintAddress: mint,
    });
  }

  return holdings.sort((a, b) => b.usdValue - a.usdValue);
}

// ── Transactions ──────────────────────────────────────────────────────────────

interface SignatureInfo {
  signature: string;
  blockTime:  number | null;
  err:        unknown;
}

interface ParsedTx {
  blockTime: number | null;
  meta: { err: unknown; preBalances: number[]; postBalances: number[] } | null;
  transaction: {
    message: {
      accountKeys: Array<{ pubkey: string }>;
      instructions: Array<{ program?: string; programId?: string }>;
    };
  };
}

export async function getSolTransactions(
  address: string,
  limit = 20,
  signal?: AbortSignal
): Promise<SolTransaction[]> {
  // Step 1: get signatures
  const sigs = await rpcPost<SignatureInfo[]>(
    'getSignaturesForAddress',
    [address, { limit, commitment: 'confirmed' }],
    signal
  );
  if (!sigs || sigs.length === 0) return [];

  // Step 2: FIX #1 — correct method name: getParsedTransactions (bukan getMultipleParsedTransactions)
  const txSigs = sigs.slice(0, 10).map(s => s.signature);
  const parsed = await rpcPost<(ParsedTx | null)[]>(
    'getParsedTransactions',
    [txSigs, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
    signal
  );

  // FIX #5: graceful fallback dari signature data kalau parsed gagal
  if (!parsed || !Array.isArray(parsed)) {
    return sigs.slice(0, limit).map(sig => ({
      signature: sig.signature,
      blockTime: sig.blockTime ?? Math.floor(Date.now() / 1000),
      type:      'UNKNOWN' as const,
      valueSOL:  0,
      from:      address,
      to:        '',
      err:       sig.err != null,
    }));
  }

  const results: SolTransaction[] = [];

  for (let i = 0; i < txSigs.length; i++) {
    const tx  = parsed[i];
    const sig = sigs[i];
    if (!tx) {
      // Fallback buat TX yang gagal diparsed
      results.push({
        signature: sig.signature,
        blockTime: sig.blockTime ?? Math.floor(Date.now() / 1000),
        type:      'UNKNOWN',
        valueSOL:  0,
        from:      address,
        to:        '',
        err:       sig.err != null,
      });
      continue;
    }

    const accts    = tx.transaction.message.accountKeys.map(k => k.pubkey);
    const preBals  = tx.meta?.preBalances  ?? [];
    const postBals = tx.meta?.postBalances ?? [];
    const addrIdx  = accts.indexOf(address);
    const balDelta = addrIdx >= 0
      ? Math.abs((postBals[addrIdx] ?? 0) - (preBals[addrIdx] ?? 0)) / 1e9
      : 0;

    const instrs = tx.transaction.message.instructions;
    const hasSwap = instrs.some(ix =>
      (ix.program ?? ix.programId ?? '').toLowerCase().includes('swap') ||
      (ix.programId ?? '') === 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB' || // Jupiter v4
      (ix.programId ?? '') === 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'    // Jupiter v6
    );

    results.push({
      signature: sig.signature,
      blockTime: tx.blockTime ?? sig.blockTime ?? Math.floor(Date.now() / 1000),
      type:      hasSwap ? 'SWAP' : balDelta > 0.001 ? 'TRANSFER' : 'UNKNOWN',
      valueSOL:  balDelta,
      from:      accts[0] ?? address,
      to:        accts[1] ?? '',
      err:       tx.meta?.err != null,
    });
  }

  return results;
}

// ── Main fetch ────────────────────────────────────────────────────────────────

export async function fetchSolWalletData(
  address: string,
  signal?: AbortSignal
): Promise<SolWalletData> {
  const [solPrice, solBalance, transactions] = await Promise.all([
    getSolPrice(signal),
    getSolBalance(address, signal),
    getSolTransactions(address, 20, signal),
  ]);

  const tokens   = await getSolTokens(address, solPrice, signal);
  const solUsd   = parseFloat(solBalance) * solPrice;
  const tokenUsd = tokens.reduce((s, t) => s + t.usdValue, 0);

  return {
    address,
    balance: {
      address,
      solBalance,
      usdValue: solUsd + tokenUsd,
      tokens,
    },
    transactions,
    lastUpdated: Date.now(),
  };
}
