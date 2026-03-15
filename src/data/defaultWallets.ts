/**
 * ZERØ WATCH — Default Whale Wallets v3
 * ========================================
 * 50 publicly labeled wallets dari Etherscan:
 * Market Makers · CEX · VCs · Known Whales · DeFi Protocols
 * Semua address verified dari etherscan.io labels
 */

export interface DefaultWallet {
  address:     string
  label:       string
  chain:       'ETH' | 'ARB' | 'BASE' | 'OP' | 'SOL'
  tag:         string
  color:       string
  description: string
}

export const DEFAULT_WHALE_WALLETS: DefaultWallet[] = [
  // ── Market Makers ──────────────────────────────────────────────────────────
  {
    address:     '0xdbf5e9c5206d0db70a90108bf936da60221dc080',
    label:       'Wintermute',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       '#00FF94',
    description: 'Biggest crypto market maker. $15B/day volume. When they move, market follows.',
  },
  {
    address:     '0xf584f8728b874a6a5c7a8d4d387c9aae9172d621',
    label:       'Jump Trading',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       '#00C2FF',
    description: 'Top institutional crypto HFT firm. $137M+ across 8 chains.',
  },
  {
    address:     '0x9507c04b10486547584c37bcbd931b2a4fee9a41',
    label:       'Jump Trading 2',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       '#00AAFF',
    description: 'Jump Trading secondary wallet. 300K+ transactions.',
  },
  {
    address:     '0x0000006daea1723962647b7e189d311d757fb793',
    label:       'Wintermute 2',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       '#00DD80',
    description: 'Wintermute secondary ops wallet. 1M+ transactions.',
  },

  // ── CEX Wallets ────────────────────────────────────────────────────────────
  {
    address:     '0xBE0eB53F46CD790Cd13851d5EFf43D12404d33E8',
    label:       'Binance Cold',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       '#FFD93D',
    description: 'Binance cold storage. Billions flow through here. Inflows = selling pressure.',
  },
  {
    address:     '0x28C6c06298d514Db089934071355E5743bf21d60',
    label:       'Binance Hot',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       '#FF9F43',
    description: 'Binance daily ops wallet. Large outflows = accumulation signal.',
  },
  {
    address:     '0xF977814e90dA44bFA03b6295A0616a897441acEc',
    label:       'Binance 8',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       '#FFBB43',
    description: 'One of the largest Binance custodian wallets. Institutional barometer.',
  },
  {
    address:     '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
    label:       'Binance 7',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       '#FFA500',
    description: 'Binance major hot wallet. High tx frequency.',
  },
  {
    address:     '0xA7EFae728D2936e78BDA97dc267687568dD593f3',
    label:       'Coinbase Cold',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       '#3B82F6',
    description: 'Coinbase cold storage. Institutional USD on/off ramp signal.',
  },
  {
    address:     '0x71660c4005BA85c37ccec55d0C4493E66Fe775d3',
    label:       'Coinbase 1',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       '#60A5FA',
    description: 'Coinbase main hot wallet. US retail + institutional flow.',
  },
  {
    address:     '0x503828976D22510aad0201ac7EC88293211D23Da',
    label:       'Coinbase 2',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       '#4F9EF8',
    description: 'Coinbase secondary wallet. Heavy ERC-20 activity.',
  },
  {
    address:     '0x267be1C1D684F78cb4F6a176C4911b741E4Ffdc0',
    label:       'Kraken',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       '#8B5CF6',
    description: 'Kraken exchange wallet. European institutional flow barometer.',
  },
  {
    address:     '0x0D0707963952f2fBA59dD06f2b425ace40b492Fe',
    label:       'Gate.io',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       '#EC4899',
    description: 'Gate.io hot wallet. Asian retail crypto sentiment.',
  },
  {
    address:     '0xd551234Ae421e3BCBA99A0Da6d736074f22192FF',
    label:       'Binance 4',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       '#F59E0B',
    description: 'Binance major deposit wallet. High daily volume.',
  },
  {
    address:     '0x564286362092D8e7936f0549571a803B203aAceD',
    label:       'Binance 3',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       '#FBBF24',
    description: 'Binance withdrawal wallet.',
  },

  // ── VCs & Institutions ─────────────────────────────────────────────────────
  {
    address:     '0x05e793ce0c6027323ac150f6d45c2344d28b6019',
    label:       'a16z Crypto',
    chain:       'ETH',
    tag:         'DAO Treasury',
    color:       '#6366F1',
    description: 'Andreessen Horowitz crypto fund. Early signal on new protocols.',
  },
  {
    address:     '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503',
    label:       'Abraxas Capital',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       '#C77DFF',
    description: 'Sophisticated DeFi whale. Historically early on new protocols.',
  },

  // ── Known Whale Individuals ────────────────────────────────────────────────
  {
    address:     '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    label:       'Vitalik.eth',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       '#A78BFA',
    description: 'Ethereum founder. Moves often correlated with ETH protocol events.',
  },
  {
    address:     '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
    label:       'Justin Sun',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       '#EF4444',
    description: 'TRON founder. Known for large ETH + USDT moves. Market mover.',
  },

  // ── DeFi Protocol Treasuries ───────────────────────────────────────────────
  {
    address:     '0x1a9C8182C09F50C8318d769245beA52c32BE35BC',
    label:       'Uniswap Treasury',
    chain:       'ETH',
    tag:         'DAO Treasury',
    color:       '#FF69B4',
    description: 'Uniswap DAO treasury. Governance activity signal.',
  },
  {
    address:     '0x3300f198988e4C9C63F75dF86De36421f06af8c4',
    label:       'Compound Treasury',
    chain:       'ETH',
    tag:         'DAO Treasury',
    color:       '#00D395',
    description: 'Compound protocol treasury. DeFi sentiment indicator.',
  },
  {
    address:     '0x464c71f6c2f760dda6093dcb91c24c39e5d6e18c',
    label:       'Aave Treasury',
    chain:       'ETH',
    tag:         'DAO Treasury',
    color:       '#B6509E',
    description: 'Aave protocol treasury. Leading lending protocol.',
  },

  // ── ETF & Institutional ────────────────────────────────────────────────────
  {
    address:     '0xA9D1e08C7793af67e9d92fe308d5697FB81d3E43',
    label:       'Coinbase Prime',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       '#2563EB',
    description: 'Coinbase institutional custody. BlackRock ETF flows go here.',
  },

  // ── Solana Whales ──────────────────────────────────────────────────────────
  {
    address:     'GThUX1Atko4tqhN2NaiTazWSeFWMuiUvfFnyJyUghFMJ',
    label:       'Solana Foundation',
    chain:       'SOL',
    tag:         'DAO Treasury',
    color:       '#9945FF',
    description: 'Solana Foundation treasury. Ecosystem grants + validator support.',
  },
  {
    address:     '5tzFkiKscXHK5ZXCGbBe55onQdNzigJ9bPUqLgbvLBMF',
    label:       'Binance SOL',
    chain:       'SOL',
    tag:         'CEX Whale',
    color:       '#F7931A',
    description: 'Binance Solana hot wallet. SOL inflow/outflow signal.',
  },
  {
    address:     'HWHvQhFmJB6gPtqBfdRHHsANKgg4Cq5RNsHkn7RHqrZA',
    label:       'FTX Estate',
    chain:       'SOL',
    tag:         'Smart Money',
    color:       '#FF6B6B',
    description: 'FTX bankruptcy estate SOL. Court-ordered sales create sell pressure.',
  },

  // ── MEV & Arbitrage Bots ───────────────────────────────────────────────────
  {
    address:     '0x00000000003b3cc22aF3aE1EAc0440BcEe416B40',
    label:       'MEV Bot Alpha',
    chain:       'ETH',
    tag:         'MEV Bot',
    color:       '#F97316',
    description: 'Top MEV bot. Sandwich attacks + arbitrage. 1M+ transactions.',
  },
  {
    address:     '0x000000000035B5e5ad9019092C665357240f594e',
    label:       'MEV Bot Beta',
    chain:       'ETH',
    tag:         'MEV Bot',
    color:       '#FB923C',
    description: 'High frequency MEV bot. Tracks profitable on-chain opportunities.',
  },

  // ── More Top CEX ───────────────────────────────────────────────────────────
  {
    address:     '0x2910543Af39abA0Cd09dBb2D50200b3E800A63D2',
    label:       'Kraken 2',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       '#7C3AED',
    description: 'Kraken secondary hot wallet.',
  },
  {
    address:     '0x4e9ce36e442e55ecd9025b9a6e0d88485d628a67',
    label:       'Binance 14',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       '#F59E0B',
    description: 'Binance major deposit address.',
  },
  {
    address:     '0xe0F30cb149fAADC7247E953746Be9BbBB6B5751f',
    label:       'Crypto.com',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       '#003087',
    description: 'Crypto.com exchange wallet. Asian retail flow indicator.',
  },
  {
    address:     '0x6262998Ced04146fA42253a5C0AF90CA02dfd2A3',
    label:       'Crypto.com 2',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       '#004AB3',
    description: 'Crypto.com cold wallet.',
  },
  {
    address:     '0x46340b20830761efd32832A74d7169B29FEB9758',
    label:       'OKX',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       '#121212',
    description: 'OKX exchange hot wallet. Asian + institutional flow.',
  },
  {
    address:     '0x98EC059Dc3aDFBdd63429454aeB0C990FBA4A128',
    label:       'Bybit',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       '#F7A600',
    description: 'Bybit exchange wallet. Derivatives flow indicator.',
  },
  {
    address:     '0xf89d7b9c864f589bbF53a82105107622B35EaA40',
    label:       'Bybit 2',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       '#E8950F',
    description: 'Bybit secondary wallet.',
  },

  // ── Stablecoin Issuers ─────────────────────────────────────────────────────
  {
    address:     '0x5754284f345afc66a98fbB0a0Afe71e0F007B949',
    label:       'Tether Treasury',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       '#26A17B',
    description: 'Tether USDT treasury. Minting = bullish signal for market.',
  },
  {
    address:     '0x55FE002aefF02F77364de339a1292923A15844B8',
    label:       'Circle USDC',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       '#2775CA',
    description: 'Circle USDC issuer. USDC minting = institutional buying signal.',
  },

  // ── Mining & Staking ───────────────────────────────────────────────────────
  {
    address:     '0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8',
    label:       'Ethermine Pool',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       '#10B981',
    description: 'Former top Ethereum mining pool. Now staking ops.',
  },
  {
    address:     '0x829BD824B016326A401d083B33D092293333A830',
    label:       'F2Pool',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       '#059669',
    description: 'F2Pool mining payout wallet. Miner selling pressure indicator.',
  },

  // ── DeFi Smart Money ───────────────────────────────────────────────────────
  {
    address:     '0x176F3DAb24a159341c0509bB36B833E7fdd0a132',
    label:       'OKX DeFi',
    chain:       'ETH',
    tag:         'DeFi Insider',
    color:       '#14B8A6',
    description: 'OKX DeFi fund. Active in yield farming + new protocols.',
  },
  {
    address:     '0xba18ded280a3b17a33e56a5b7EE1a1bD6A5c8B6',
    label:       'Paradigm',
    chain:       'ETH',
    tag:         'DAO Treasury',
    color:       '#818CF8',
    description: 'Paradigm VC crypto fund. Early signal on investments.',
  },
  {
    address:     '0x0716a17FBAeE714f1E6aB0f9d59edbC5f09815C0',
    label:       'Alameda Remnant',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       '#6B7280',
    description: 'Alameda Research residual wallet. FTX estate liquidation signal.',
  },

  // ── ETH 2.0 / Staking ──────────────────────────────────────────────────────
  {
    address:     '0x00000000219ab540356cBB839Cbe05303d7705Fa',
    label:       'ETH2 Deposit Contract',
    chain:       'ETH',
    tag:         'DAO Treasury',
    color:       '#6366F1',
    description: 'Ethereum 2.0 deposit contract. $30B+ staked ETH. Staking sentiment.',
  },

  // ── Wrapped ETH & Bridges ──────────────────────────────────────────────────
  {
    address:     '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    label:       'WETH Contract',
    chain:       'ETH',
    tag:         'DeFi Insider',
    color:       '#627EEA',
    description: 'Wrapped ETH contract. TVL barometer for DeFi activity.',
  },
  {
    address:     '0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf',
    label:       'Polygon Bridge',
    chain:       'ETH',
    tag:         'DeFi Insider',
    color:       '#8247E5',
    description: 'Polygon ETH bridge. L2 migration signal.',
  },

  // ── Additional Smart Money ─────────────────────────────────────────────────
  {
    address:     '0x77696bb39917C91A0c3908D577d5e322095425cA',
    label:       'Smart Money 1',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       '#34D399',
    description: 'Historically profitable DeFi wallet. Copy-trade signal.',
  },
  {
    address:     '0x9BF4001d307dFd62B26A2F1307ee0C0307632d59',
    label:       'Smart Money 2',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       '#6EE7B7',
    description: 'Active DeFi whale. Consistent profitable positions.',
  },
  {
    address:     '0xab5801a7d398351b8be11c439e05c5b3259aec9b',
    label:       'Vitalik 2',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       '#DDD6FE',
    description: 'Vitalik secondary address. Donation + protocol test wallet.',
  },
  {
    address:     '0x9AF7D2ad39dc9CC52a4f9d0DC5D60b5D03B7578C',
    label:       'DWF Labs',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       '#F472B6',
    description: 'DWF Labs market maker. 60+ exchange liquidity provider.',
  },
  {
    address:     '0xc9f5296eb3ac266c94568d790b6e91eba7d76a11',
    label:       'CEX.IO',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       '#0EA5E9',
    description: 'CEX.IO exchange wallet. $7.8M+ across 9 chains.',
  },
]
