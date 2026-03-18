/**
 * ZERØ WATCH — Default Whale Wallets v7
 * ========================================
 * v7: + logo field — Cloudinary CDN URLs per entity
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
  entity:      string
  logo?:       string   // Cloudinary URL
  pinned?:     boolean
}

// ── Logo map per entity ───────────────────────────────────────────────────────

const LOGOS: Record<string, string> = {
  'Wintermute':        'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778608/wintermute_boorij.png',
  'Jump Trading':      'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778608/jane-street_r1tbdi.png',
  'DWF Labs':          'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778608/dwf-labs_ubiaiy.png',
  'Cumberland DRW':    'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778608/wintermute_boorij.png',
  'Justin Sun':        'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778611/justin-sun_o6izm4.png',
  'Abraxas Capital':   'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778607/abraxas-capital-heka-funds_yyl2nq.png',
  'BlackRock':         'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778608/blackrock_piukrp.png',
  'MicroStrategy':     'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778609/microstrategy_fyjukh.jpg',
  'Binance':           'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778608/binance_eedqsv.png',
  'Coinbase':          'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778607/coinbase_jg9bmg.png',
  'Kraken':            'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778607/kraken_ex9lpg.png',
  'OKX':               'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778607/okx_fr8nvu.png',
  'Bybit':             'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778608/binance_eedqsv.png',
  'HTX / Huobi':       'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778605/huobi_xvlnh1.png',
  'Gate.io':           'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778606/gate-io_b8eken.png',
  'Crypto.com':        'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778606/crypto-com_duljia.png',
  'MEV Bots':          'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778605/mev-protocol_ny9yih.png',
  'Solana Foundation': 'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778605/solana_1_z6ghxh.png',
  'Mt.Gox Trustee':    'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778605/mt-gox_gbk4v9.png',
  'Bitfinex':          'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778604/bitcoin_bremw8.webp',
  'Satoshi-Era':       'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778613/satoshi-nakamoto_aryhtf.png',
  'FTX Estate':        'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778604/ftx_o9uxcx.png',
  'Alameda Research':  'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778609/alameda-research_r9xvf0.png',
  'Tether':            'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778605/tether_lyexlr.webp',
  'Circle':            'https://res.cloudinary.com/dju1hggdi/image/upload/v1773778604/usd-coin_b3rawx.webp',
}

// ── Helper ────────────────────────────────────────────────────────────────────

const w = (
  address: string, label: string,
  chain: DefaultWallet['chain'], tag: string, color: string,
  description: string, entity: string, pinned?: boolean
): DefaultWallet => ({
  address, label, chain, tag, color, description, entity,
  logo: LOGOS[entity],
  ...(pinned ? { pinned: true } : {}),
})

export const DEFAULT_WHALE_WALLETS: DefaultWallet[] = [

  // ── 🏦 Market Makers ──────────────────────────────────────────────────────
  w('0xdbf5e9c5206d0db70a90108bf936da60221dc080', 'Wintermute',        'ETH', 'Smart Money', 'rgba(0, 212, 255, 1)',    'Biggest crypto market maker. 152K+ txs. When they move, market follows.',       'Wintermute'),
  w('0x00000000ae347930bd1e7b0f35588b92280f9e75', 'Wintermute 2',      'ETH', 'Smart Money', 'rgba(0, 212, 255, 0.8)', 'Wintermute secondary wallet. High-frequency ops.',                              'Wintermute'),
  w('0xf584f8728b874a6a5c7a8d4d387c9aae9172d621', 'Jump Trading',      'ETH', 'Smart Money', 'rgba(0,194,255,1)',    'Top institutional crypto HFT firm. $137M+ across 8 chains.',                   'Jump Trading'),
  w('0x9507c04b10486547584c37bcbd931b2a4fee9a41', 'Jump Trading 2',    'ETH', 'Smart Money', 'rgba(0,170,255,1)',    'Jump Trading secondary wallet. 300K+ txs.',                                    'Jump Trading'),
  w('0xddacad3b1edee8e2f5b2e84f658202534fcb0374', 'DWF Labs',          'ETH', 'Smart Money', 'rgba(20,184,166,1)',   'DWF Labs market maker. Invest + pump small caps. Watch for accumulation.',      'DWF Labs'),
  w('0xF0984860f1F31a784c0FF0bb4d1322e377f97631', 'DWF Labs 2',        'ETH', 'Smart Money', 'rgba(20,184,166,0.8)','DWF Labs official secondary market wallet.',                                    'DWF Labs'),
  w('HwDkuDCUipJHHKodBBCjffFvrjhmd4iVVh7fq25fShvt', 'DWF Labs SOL',  'SOL', 'Smart Money', 'rgba(20,184,166,0.9)','DWF Labs official Solana wallet — disclosed May 2025.',                         'DWF Labs'),
  w('TR6s2mRQSV2voe5wT2HBGyeNYikDRjKsRb',         'DWF Labs TRON',   'TRX', 'Smart Money', 'rgba(20,184,166,0.7)','DWF Labs official TRON wallet — disclosed May 2025.',                           'DWF Labs'),
  w('0x33566c9d8be6cf0b23795e0d380e112be9d75836', 'Cumberland DRW',    'ETH', 'Smart Money', 'rgba(168,85,247,1)',   'Cumberland — institutional crypto trading desk, arm of DRW.',                  'Cumberland DRW'),

  // ── 🧠 Smart Money / Manipulators ─────────────────────────────────────────
  w('0x3DdfA8eC3052539b6c9549F12cEA2C295cfF5296', 'Justin Sun',        'ETH', 'Smart Money', 'rgba(239,68,68,1)',    'TRON founder. $12.5B net worth. Notorious market mover — gerak = news.',        'Justin Sun'),
  w('0x176F3DAb24a159341c0509bB36B833E7fdd0a132', 'Justin Sun 2',      'ETH', 'Smart Money', 'rgba(220,38,38,1)',    'Justin Sun secondary ETH. $719M across 8 chains. HTX exchange owner.',         'Justin Sun'),
  w('TGddFQCnL913P6tpKdcwXxQTb3tgx5SAsp',         'Justin Sun TRON',  'TRX', 'Smart Money', 'rgba(239,68,68,0.95)','Justin Sun primary TRON wallet. TRON founder. Pre-dump signal.',               'Justin Sun'),
  w('TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N',         'Justin Sun TRON 2','TRX', 'Smart Money', 'rgba(239,68,68,0.8)', 'Justin Sun secondary TRON. $138M TRX + $225M USDD.',                           'Justin Sun'),
  w('8NBEbxLknGv5aRYefFrW2qFXoDZyi9fSHJNiJRvEcMBE','Justin Sun / HTX SOL','SOL','Smart Money','rgba(239,68,68,0.9)','Justin Sun HTX cold wallet SOL. TRUMP dinner wallet.',                         'Justin Sun'),
  w('0x4862733b5fddfd35f35ea8ccf08f5045e57388b0', 'Abraxas Capital',   'ETH', 'Smart Money', 'rgba(199,125,255,1)',  'DeFi insider. Historically early on new protocols. Copy-trade signal.',         'Abraxas Capital'),

  // ── 🏛️ Institutional ──────────────────────────────────────────────────────
  w('0xcec55e6734a2e80d9257fb9d54a7a037dab0be1f', 'BlackRock ETHA',    'ETH', 'Smart Money', 'rgba(255,255,255,0.85)','BlackRock iShares Ethereum ETF primary wallet. $63B+ AUM.',                   'BlackRock'),
  w('1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ',         'MicroStrategy',    'BTC', 'Smart Money', 'rgba(255,107,53,1)',   'Michael Saylor thesis. 500K+ BTC accumulated. Accumulating since 2020.',       'MicroStrategy'),

  // ── 💰 CEX ────────────────────────────────────────────────────────────────
  w('0xBE0eB53F46CD790Cd13851d5EFf43D12404d33E8', 'Binance Cold',      'ETH', 'CEX Whale',   'rgba(255,217,61,1)',   'Binance cold storage $4B+. Large inflow = sell pressure. Bearish signal.',      'Binance'),
  w('0x28C6c06298d514Db089934071355E5743bf21d60', 'Binance Hot 14',     'ETH', 'CEX Whale',   'rgba(255,201,61,1)',   'Binance main hot wallet #14. Daily ops — large outflows = accumulation.',       'Binance'),
  w('0x21a31Ee1afC51d94C2efCCaa2092Ad1028285549', 'Binance Hot 15',     'ETH', 'CEX Whale',   'rgba(255,185,61,1)',   'Binance hot wallet #15. High daily volume.',                                    'Binance'),
  w('0xA9D1e08C7793af67e9d92fe308d5697FB81d3E43', 'Coinbase Prime',     'ETH', 'CEX Whale',   'rgba(59,130,246,1)',   'Coinbase institutional custody. BlackRock ETF inflows go HERE. Watch closely.', 'Coinbase'),
  w('0x71660c4005BA85c37ccec55d0C4493E66Fe775d3', 'Coinbase 2',         'ETH', 'CEX Whale',   'rgba(96,165,250,1)',   'Coinbase main hot wallet. US retail + institutional flow indicator.',           'Coinbase'),
  w('0x267be1C1D684F78cb4F6a176C4911b741E4Ffdc0', 'Kraken 1',           'ETH', 'CEX Whale',   'rgba(139,92,246,1)',   'Kraken exchange wallet. European institutional flow barometer.',                'Kraken'),
  w('0x2910543Af39abA0Cd09dBb2D50200b3E800A63D2', 'Kraken 2',           'ETH', 'CEX Whale',   'rgba(124,58,237,1)',   'Kraken secondary hot wallet.',                                                  'Kraken'),
  w('0x6cC5F688a315f3dC28A7781717a9A798a59fDA7b', 'OKX',                'ETH', 'CEX Whale',   'rgba(52,211,153,1)',   'OKX exchange hot wallet. Asian + institutional flow.',                          'OKX'),
  w('0x98EC059Dc3aDFBdd63429454aeB0C990FBA4A128', 'Bybit Hot',          'ETH', 'CEX Whale',   'rgba(247,166,0,1)',    'Bybit exchange wallet. Derivatives flow indicator.',                            'Bybit'),
  w('0xaB5C66752a9e8167967685F1450532fB96d5d24f', 'HTX / Huobi 1',      'ETH', 'CEX Whale',   'rgba(0,150,255,1)',    'HTX (Huobi) exchange wallet. Justin Sun controlled exchange.',                  'HTX / Huobi'),
  w('0x0D0707963952f2fBA59dD06f2b425ace40b492Fe', 'Gate.io',            'ETH', 'CEX Whale',   'rgba(236,72,153,1)',   'Gate.io hot wallet. Asian retail crypto sentiment.',                            'Gate.io'),
  w('0x6262998Ced04146fA42253a5C0AF90CA02dfd2A3', 'Crypto.com',         'ETH', 'CEX Whale',   'rgba(0,48,135,1)',     'Crypto.com exchange wallet. Retail flow indicator.',                            'Crypto.com'),

  // ── ⚡ MEV Bots ───────────────────────────────────────────────────────────
  w('0x00000000003b3cc22aF3aE1EAc0440BcEe416B40', 'MEV Bot Alpha',      'ETH', 'MEV Bot',     'rgba(249,115,22,1)',   'Top MEV bot. 1M+ txs. Profitable opportunities = market inefficiency signal.', 'MEV Bots'),
  w('0x6b75d8AF000000e20B7a7DDf000Ba900b4009A80', 'MEV Bot Beta',       'ETH', 'MEV Bot',     'rgba(251,146,60,1)',   'High frequency MEV. Tracks sandwich attacks + arb opportunities.',             'MEV Bots'),

  // ── 🌐 Solana ─────────────────────────────────────────────────────────────
  w('CgrqYCMdBhR3UAVSM5DGDaM7SfqMBMGbLQkMxv8TmZMf','Solana Foundation','SOL','DAO Treasury','rgba(153,69,255,1)',   'Solana Foundation treasury. Ecosystem grants + validator ops.',                 'Solana Foundation'),
  w('5tzFkiKscXHK5ZXCGbCAbZC5hBt2U4p2V9SEP7p7FHRB','Binance SOL Hot', 'SOL', 'CEX Whale',   'rgba(247,147,26,1)',   'Binance Solana hot wallet. SOL inflow/outflow signal.',                         'Binance'),

  // ── ₿ BTC Active ──────────────────────────────────────────────────────────
  w('1Kfoe5X38WxbSNZHHnGKsMZFy6BZeqNqwD',         'Mt.Gox Trustee',   'BTC', 'CEX Whale',   'rgba(239,68,68,1)',    'Mt.Gox bankruptcy trustee. 142K BTC repayment ongoing. Outflows = SELL PRESSURE.','Mt.Gox Trustee', true),
  w('34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo',         'Binance BTC Cold',  'BTC', 'CEX Whale',   'rgba(251,191,36,1)',   'Binance Bitcoin cold wallet. $7B+ BTC. CEX inflow barometer.',                  'Binance'),
  w('bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw8','Bitfinex BTC','BTC','CEX Whale','rgba(139,92,246,1)','Bitfinex cold wallet. ~168K BTC. Watch for large outflows.','Bitfinex'),

  // ── 🌑 Satoshi-Era Dormant ────────────────────────────────────────────────
  w('1HLoD9E4SDFFPDiYfNYnkBLQ85Y51J3Zb1',         'Satoshi (Hal Finney TX)','BTC','Smart Money','rgba(251,191,36,1)','First BTC tx ever to Hal Finney. Dormant since 2009. If moves = BLACK SWAN.', 'Satoshi-Era', true),
  w('1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF',         'Satoshi-era (79K BTC)', 'BTC','Smart Money','rgba(251,191,36,0.8)','79,957 BTC dormant. Satoshi-era wallet. Movement = extreme market event.',   'Satoshi-Era', true),

  // ── 💀 FTX Estate ─────────────────────────────────────────────────────────
  w('0x2FAF487A4414fe77e2327F0bf4AE2a264a776AD2', 'FTX Estate',         'ETH', 'Smart Money', 'rgba(239,68,68,1)',    'FTX bankruptcy estate. Masih aktif jual aset buat kreditor.',                   'FTX Estate', true),
  w('0xC098B2a3Aa256D2140208C3de6543AaEf5cd3A94', 'FTX Estate 2',       'ETH', 'Smart Money', 'rgba(239,68,68,0.8)', 'FTX secondary estate wallet.',                                                  'FTX Estate', true),
  w('0x59aBf3837Fa962d6853b4Cc0a19513Aa031fd32b', 'FTX Drainer',        'ETH', 'Smart Money', 'rgba(239,68,68,0.6)', 'FTX hack drainer wallet. $477M stolen Nov 2022. Tracked by all analysts.',     'FTX Estate', true),
  w('0x3507e4978e0Eb83315D20dF86CA0b976c0E40CcB', 'Alameda Research',   'ETH', 'Smart Money', 'rgba(239,68,68,0.7)', 'Alameda Research remnant wallet. FTX sister company.',                          'FTX Estate', true),

  // ── 💵 Stablecoin Issuers ─────────────────────────────────────────────────
  w('0x5754284f345afc66a98fbB0a0Afe71e0F007B949', 'Tether Treasury',    'ETH', 'Smart Money', 'rgba(38,161,123,1)',   'Tether USDT issuer. Minting large amounts = bullish market signal.',            'Tether'),
  w('0x55FE002aefF02F77364de339a1292923A15844B8', 'Circle USDC',        'ETH', 'Smart Money', 'rgba(39,117,202,1)',   'Circle USDC issuer. Large minting = institutional buying pressure.',            'Circle'),
]
