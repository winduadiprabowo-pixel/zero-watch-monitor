/**
 * ZERØ WATCH — Default Whale Wallets v6
 * ========================================
 * v6: + entity field — group addresses by whale person/org
 *     Entity grouping powers the new entity-row table view
 *
 * rgba() only ✓  verified dari Etherscan/TronGrid labels ✓
 */

export interface DefaultWallet {
  address:     string
  label:       string
  chain:       'ETH' | 'ARB' | 'BASE' | 'OP' | 'SOL' | 'BTC' | 'TRX' | 'BNB'
  tag:         string
  color:       string
  description: string
  entity:      string   // group key — e.g. 'Justin Sun', 'Wintermute', 'FTX Estate'
  pinned?:     boolean  // always show at top regardless of activity (BLACK SWAN watch)
}

export const DEFAULT_WHALE_WALLETS: DefaultWallet[] = [

  // ── 🏦 Market Makers (9) ───────────────────────────────────────────────────

  {
    address:     '0xdbf5e9c5206d0db70a90108bf936da60221dc080',
    label:       'Wintermute',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(230,161,71,1)',
    description: 'Biggest crypto market maker. 152K+ txs. When they move, market follows.',
    entity:      'Wintermute',
  },
  {
    address:     '0x00000000ae347930bd1e7b0f35588b92280f9e75',
    label:       'Wintermute 2',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(230,161,71,0.8)',
    description: 'Wintermute secondary wallet. High-frequency ops.',
    entity:      'Wintermute',
  },
  {
    address:     '0xf584f8728b874a6a5c7a8d4d387c9aae9172d621',
    label:       'Jump Trading',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(0,194,255,1)',
    description: 'Top institutional crypto HFT firm. $137M+ across 8 chains.',
    entity:      'Jump Trading',
  },
  {
    address:     '0x9507c04b10486547584c37bcbd931b2a4fee9a41',
    label:       'Jump Trading 2',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(0,170,255,1)',
    description: 'Jump Trading secondary wallet. 300K+ txs.',
    entity:      'Jump Trading',
  },
  {
    address:     '0xddacad3b1edee8e2f5b2e84f658202534fcb0374',
    label:       'DWF Labs',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(20,184,166,1)',
    description: 'DWF Labs market maker. Invest + pump small caps. Watch for accumulation.',
    entity:      'DWF Labs',
  },
  {
    address:     '0xF0984860f1F31a784c0FF0bb4d1322e377f97631',
    label:       'DWF Labs 2',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(20,184,166,0.8)',
    description: 'DWF Labs official secondary market wallet.',
    entity:      'DWF Labs',
  },
  {
    address:     'HwDkuDCUipJHHKodBBCjffFvrjhmd4iVVh7fq25fShvt',
    label:       'DWF Labs SOL',
    chain:       'SOL',
    tag:         'Smart Money',
    color:       'rgba(20,184,166,0.9)',
    description: 'DWF Labs official Solana wallet — disclosed May 2025.',
    entity:      'DWF Labs',
  },
  {
    address:     'TR6s2mRQSV2voe5wT2HBGyeNYikDRjKsRb',
    label:       'DWF Labs TRON',
    chain:       'TRX',
    tag:         'Smart Money',
    color:       'rgba(20,184,166,0.7)',
    description: 'DWF Labs official TRON wallet — disclosed May 2025.',
    entity:      'DWF Labs',
  },
  {
    address:     '0x33566c9d8be6cf0b23795e0d380e112be9d75836',
    label:       'Cumberland DRW',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(168,85,247,1)',
    description: 'Cumberland — institutional crypto trading desk, arm of DRW.',
    entity:      'Cumberland DRW',
  },

  // ── 🧠 Smart Money / Manipulators (6) ─────────────────────────────────────

  {
    address:     '0x3DdfA8eC3052539b6c9549F12cEA2C295cfF5296',
    label:       'Justin Sun',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(239,68,68,1)',
    description: 'TRON founder. $12.5B net worth. Notorious market mover — gerak = news.',
    entity:      'Justin Sun',
  },
  {
    address:     '0x176F3DAb24a159341c0509bB36B833E7fdd0a132',
    label:       'Justin Sun 2',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(220,38,38,1)',
    description: 'Justin Sun secondary ETH. $719M across 8 chains. HTX exchange owner.',
    entity:      'Justin Sun',
  },
  {
    address:     'TGddFQCnL913P6tpKdcwXxQTb3tgx5SAsp',
    label:       'Justin Sun TRON',
    chain:       'TRX',
    tag:         'Smart Money',
    color:       'rgba(239,68,68,0.95)',
    description: 'Justin Sun primary TRON wallet. TRON founder. Pre-dump signal.',
    entity:      'Justin Sun',
  },
  {
    address:     'TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N',
    label:       'Justin Sun TRON 2',
    chain:       'TRX',
    tag:         'Smart Money',
    color:       'rgba(239,68,68,0.8)',
    description: 'Justin Sun secondary TRON. $138M TRX + $225M USDD.',
    entity:      'Justin Sun',
  },
  {
    address:     '8NBEbxLknGv5aRYefFrW2qFXoDZyi9fSHJNiJRvEcMBE',
    label:       'Justin Sun / HTX SOL',
    chain:       'SOL',
    tag:         'Smart Money',
    color:       'rgba(239,68,68,0.9)',
    description: 'Justin Sun HTX cold wallet SOL. TRUMP dinner wallet.',
    entity:      'Justin Sun',
  },
  {
    address:     '0x4862733b5fddfd35f35ea8ccf08f5045e57388b0',
    label:       'Abraxas Capital',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(199,125,255,1)',
    description: 'DeFi insider. Historically early on new protocols. Copy-trade signal.',
    entity:      'Abraxas Capital',
  },

  // ── 🏛️ Institutional (2) ──────────────────────────────────────────────────

  {
    address:     '0xcec55e6734a2e80d9257fb9d54a7a037dab0be1f',
    label:       'BlackRock ETHA',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(255,255,255,0.85)',
    description: 'BlackRock iShares Ethereum ETF primary wallet. $63B+ AUM.',
    entity:      'BlackRock',
  },
  {
    address:     '1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ',
    label:       'MicroStrategy',
    chain:       'BTC',
    tag:         'Smart Money',
    color:       'rgba(255,107,53,1)',
    description: 'Michael Saylor thesis. 500K+ BTC accumulated. Accumulating since 2020.',
    entity:      'MicroStrategy',
  },

  // ── 💰 CEX (12) ───────────────────────────────────────────────────────────

  {
    address:     '0xBE0eB53F46CD790Cd13851d5EFf43D12404d33E8',
    label:       'Binance Cold',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(255,217,61,1)',
    description: 'Binance cold storage $4B+. Large inflow = sell pressure. Bearish signal.',
    entity:      'Binance',
  },
  {
    address:     '0x28C6c06298d514Db089934071355E5743bf21d60',
    label:       'Binance Hot 14',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(255,201,61,1)',
    description: 'Binance main hot wallet #14. Daily ops — large outflows = accumulation.',
    entity:      'Binance',
  },
  {
    address:     '0x21a31Ee1afC51d94C2efCCaa2092Ad1028285549',
    label:       'Binance Hot 15',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(255,185,61,1)',
    description: 'Binance hot wallet #15. High daily volume.',
    entity:      'Binance',
  },
  {
    address:     '0xA9D1e08C7793af67e9d92fe308d5697FB81d3E43',
    label:       'Coinbase Prime',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(59,130,246,1)',
    description: 'Coinbase institutional custody. BlackRock ETF inflows go HERE. Watch closely.',
    entity:      'Coinbase',
  },
  {
    address:     '0x71660c4005BA85c37ccec55d0C4493E66Fe775d3',
    label:       'Coinbase 2',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(96,165,250,1)',
    description: 'Coinbase main hot wallet. US retail + institutional flow indicator.',
    entity:      'Coinbase',
  },
  {
    address:     '0x267be1C1D684F78cb4F6a176C4911b741E4Ffdc0',
    label:       'Kraken 1',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(139,92,246,1)',
    description: 'Kraken exchange wallet. European institutional flow barometer.',
    entity:      'Kraken',
  },
  {
    address:     '0x2910543Af39abA0Cd09dBb2D50200b3E800A63D2',
    label:       'Kraken 2',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(124,58,237,1)',
    description: 'Kraken secondary hot wallet.',
    entity:      'Kraken',
  },
  {
    address:     '0x6cC5F688a315f3dC28A7781717a9A798a59fDA7b',
    label:       'OKX',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(52,211,153,1)',
    description: 'OKX exchange hot wallet. Asian + institutional flow.',
    entity:      'OKX',
  },
  {
    address:     '0x98EC059Dc3aDFBdd63429454aeB0C990FBA4A128',
    label:       'Bybit Hot',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(247,166,0,1)',
    description: 'Bybit exchange wallet. Derivatives flow indicator.',
    entity:      'Bybit',
  },
  {
    address:     '0xaB5C66752a9e8167967685F1450532fB96d5d24f',
    label:       'HTX / Huobi 1',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(0,150,255,1)',
    description: 'HTX (Huobi) exchange wallet. Justin Sun controlled exchange.',
    entity:      'HTX / Huobi',
  },
  {
    address:     '0x0D0707963952f2fBA59dD06f2b425ace40b492Fe',
    label:       'Gate.io',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(236,72,153,1)',
    description: 'Gate.io hot wallet. Asian retail crypto sentiment.',
    entity:      'Gate.io',
  },
  {
    address:     '0x6262998Ced04146fA42253a5C0AF90CA02dfd2A3',
    label:       'Crypto.com',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(0,48,135,1)',
    description: 'Crypto.com exchange wallet. Retail flow indicator.',
    entity:      'Crypto.com',
  },

  // ── ⚡ MEV Bots (2) ────────────────────────────────────────────────────────

  {
    address:     '0x00000000003b3cc22aF3aE1EAc0440BcEe416B40',
    label:       'MEV Bot Alpha',
    chain:       'ETH',
    tag:         'MEV Bot',
    color:       'rgba(249,115,22,1)',
    description: 'Top MEV bot. 1M+ txs. Profitable opportunities = market inefficiency signal.',
    entity:      'MEV Bots',
  },
  {
    address:     '0x6b75d8AF000000e20B7a7DDf000Ba900b4009A80',
    label:       'MEV Bot Beta',
    chain:       'ETH',
    tag:         'MEV Bot',
    color:       'rgba(251,146,60,1)',
    description: 'High frequency MEV. Tracks sandwich attacks + arb opportunities.',
    entity:      'MEV Bots',
  },

  // ── 🌐 Solana (2) ─────────────────────────────────────────────────────────

  {
    address:     'CgrqYCMdBhR3UAVSM5DGDaM7SfqMBMGbLQkMxv8TmZMf',
    label:       'Solana Foundation',
    chain:       'SOL',
    tag:         'DAO Treasury',
    color:       'rgba(153,69,255,1)',
    description: 'Solana Foundation treasury. Ecosystem grants + validator ops.',
    entity:      'Solana Foundation',
  },
  {
    address:     '5tzFkiKscXHK5ZXCGbCAbZC5hBt2U4p2V9SEP7p7FHRB',
    label:       'Binance SOL Hot',
    chain:       'SOL',
    tag:         'CEX Whale',
    color:       'rgba(247,147,26,1)',
    description: 'Binance Solana hot wallet. SOL inflow/outflow signal.',
    entity:      'Binance',
  },

  // ── ₿ BTC Active (3) ──────────────────────────────────────────────────────

  {
    address:     '1Kfoe5X38WxbSNZHHnGKsMZFy6BZeqNqwD',
    label:       'Mt.Gox Trustee',
    chain:       'BTC',
    tag:         'CEX Whale',
    color:       'rgba(239,68,68,1)',
    description: 'Mt.Gox bankruptcy trustee. 142K BTC repayment ongoing. Outflows = SELL PRESSURE.',
    entity:      'Mt.Gox Trustee',
    pinned:      true,
  },
  {
    address:     '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo',
    label:       'Binance BTC Cold',
    chain:       'BTC',
    tag:         'CEX Whale',
    color:       'rgba(251,191,36,1)',
    description: 'Binance Bitcoin cold wallet. $7B+ BTC. CEX inflow barometer.',
    entity:      'Binance',
  },
  {
    address:     'bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw8',
    label:       'Bitfinex BTC',
    chain:       'BTC',
    tag:         'CEX Whale',
    color:       'rgba(139,92,246,1)',
    description: 'Bitfinex cold wallet. ~168K BTC. Watch for large outflows.',
    entity:      'Bitfinex',
  },

  // ── 🌑 Satoshi-Era Dormant (2) ────────────────────────────────────────────
  // 🌋 BLACK_SWAN level — movement = extreme market event

  {
    address:     '1HLoD9E4SDFFPDiYfNYnkBLQ85Y51J3Zb1',
    label:       'Satoshi (Hal Finney TX)',
    chain:       'BTC',
    tag:         'Smart Money',
    color:       'rgba(251,191,36,1)',
    description: 'First BTC tx ever to Hal Finney. Dormant since 2009. If moves = BLACK SWAN.',
    entity:      'Satoshi-Era',
    pinned:      true,
  },
  {
    address:     '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF',
    label:       'Satoshi-era (79K BTC)',
    chain:       'BTC',
    tag:         'Smart Money',
    color:       'rgba(251,191,36,0.8)',
    description: '79,957 BTC dormant. Satoshi-era wallet. Movement = extreme market event.',
    entity:      'Satoshi-Era',
    pinned:      true,
  },

  // ── 💀 Ghost / FTX Estate (4) ─────────────────────────────────────────────

  {
    address:     '0x2FAF487A4414fe77e2327F0bf4AE2a264a776AD2',
    label:       'FTX Estate',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(239,68,68,1)',
    description: 'FTX bankruptcy estate. Masih aktif jual aset buat kreditor.',
    entity:      'FTX Estate',
    pinned:      true,
  },
  {
    address:     '0xC098B2a3Aa256D2140208C3de6543AaEf5cd3A94',
    label:       'FTX Estate 2',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(239,68,68,0.8)',
    description: 'FTX secondary estate wallet.',
    entity:      'FTX Estate',
    pinned:      true,
  },
  {
    address:     '0x59aBf3837Fa962d6853b4Cc0a19513Aa031fd32b',
    label:       'FTX Drainer',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(239,68,68,0.6)',
    description: 'FTX hack drainer wallet. $477M stolen Nov 2022. Tracked by all analysts.',
    entity:      'FTX Estate',
    pinned:      true,
  },
  {
    address:     '0x3507e4978e0Eb83315D20dF86CA0b976c0E40CcB',
    label:       'Alameda Research',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(239,68,68,0.7)',
    description: 'Alameda Research remnant wallet. FTX sister company.',
    entity:      'FTX Estate',
    pinned:      true,
  },

  // ── 💵 Stablecoin Issuers (2) ─────────────────────────────────────────────

  {
    address:     '0x5754284f345afc66a98fbB0a0Afe71e0F007B949',
    label:       'Tether Treasury',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(38,161,123,1)',
    description: 'Tether USDT issuer. Minting large amounts = bullish market signal.',
    entity:      'Tether',
  },
  {
    address:     '0x55FE002aefF02F77364de339a1292923A15844B8',
    label:       'Circle USDC',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(39,117,202,1)',
    description: 'Circle USDC issuer. Large minting = institutional buying pressure.',
    entity:      'Circle',
  },
]
