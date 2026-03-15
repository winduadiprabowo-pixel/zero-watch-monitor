/**
 * ZERØ WATCH — Default Whale Wallets v4
 * ========================================
 * Curated list — verified dari Etherscan labels
 * Focus: alpha wallets yang beneran market moving
 * Hapus: Vitalik (donate bukan alpha), smart contracts, bridges
 * v4 fix: BTC wallets masuk ke dalam array (orphan bug fixed)
 */

export interface DefaultWallet {
  address:     string
  label:       string
  chain:       'ETH' | 'ARB' | 'BASE' | 'OP' | 'SOL' | 'BTC'
  tag:         string
  color:       string
  description: string
}

export const DEFAULT_WHALE_WALLETS: DefaultWallet[] = [

  // ── 🔥 Ultra Active — Market Moving ────────────────────────────────────────

  {
    address:     '0xdbf5e9c5206d0db70a90108bf936da60221dc080',
    label:       'Wintermute',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(230,161,71,1)',
    description: 'Biggest crypto market maker. 152K+ txs. When they move, market follows.',
  },
  {
    address:     '0x0000006daea1723962647b7e189d311d757fb793',
    label:       'Wintermute 2',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(0,221,128,1)',
    description: 'Wintermute secondary ops. 1M+ transactions — HFT scale.',
  },
  {
    address:     '0xf584f8728b874a6a5c7a8d4d387c9aae9172d621',
    label:       'Jump Trading',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(0,194,255,1)',
    description: 'Top institutional crypto HFT firm. $137M+ across 8 chains.',
  },
  {
    address:     '0x9507c04b10486547584c37bcbd931b2a4fee9a41',
    label:       'Jump Trading 2',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(0,170,255,1)',
    description: 'Jump Trading secondary wallet. 300K+ txs.',
  },
  {
    address:     '0xddacad3b1edee8e2f5b2e84f658202534fcb0374',
    label:       'DWF Labs',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(244,114,182,1)',
    description: 'DWF Labs market maker. Invest + pump small caps. Watch for accumulation.',
  },
  {
    address:     '0xd4b69e8d62c880e9dd55d419d5e07435c3538342',
    label:       'DWF Labs 2',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(236,72,153,1)',
    description: 'DWF Labs secondary wallet. 60+ exchange liquidity provider.',
  },

  // ── 🧠 Smart Money — Justin Sun ────────────────────────────────────────────

  {
    address:     '0x3DdfA8eC3052539b6c9549F12cEA2C295cfF5296',
    label:       'Justin Sun',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(239,68,68,1)',
    description: 'TRON founder. $12.5B net worth. Notorious market mover — gerak = news.',
  },
  {
    address:     '0x176F3DAb24a159341c0509bB36B833E7fdd0a132',
    label:       'Justin Sun 4',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(220,38,38,1)',
    description: 'Justin Sun whale wallet. $719M across 8 chains. HTX exchange owner.',
  },

  // ── 🧠 Smart Money — Abraxas ───────────────────────────────────────────────

  {
    address:     '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503',
    label:       'Abraxas Capital',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(199,125,255,1)',
    description: 'DeFi insider. Historically early on new protocols. Copy-trade signal.',
  },

  // ── 💰 CEX Flow — Binance ──────────────────────────────────────────────────

  {
    address:     '0xBE0eB53F46CD790Cd13851d5EFf43D12404d33E8',
    label:       'Binance Cold',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(255,217,61,1)',
    description: 'Binance cold storage $4B+. Large inflow = sell pressure. Bearish signal.',
  },
  {
    address:     '0x28C6c06298d514Db089934071355E5743bf21d60',
    label:       'Binance Hot',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(255,159,67,1)',
    description: 'Binance daily ops. Large outflows = accumulation signal. Bullish.',
  },
  {
    address:     '0xF977814e90dA44bFA03b6295A0616a897441acEc',
    label:       'Binance 8',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(255,187,67,1)',
    description: 'Binance custodian wallet. Institutional barometer.',
  },
  {
    address:     '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE',
    label:       'Binance 7',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(255,165,0,1)',
    description: 'Binance major hot wallet. High daily volume.',
  },
  {
    address:     '0xd551234Ae421e3BCBA99A0Da6d736074f22192FF',
    label:       'Binance 4',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(245,158,11,1)',
    description: 'Binance major deposit wallet. High daily flow.',
  },

  // ── 💰 CEX Flow — Coinbase ─────────────────────────────────────────────────

  {
    address:     '0xA9D1e08C7793af67e9d92fe308d5697FB81d3E43',
    label:       'Coinbase Prime',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(59,130,246,1)',
    description: 'Coinbase institutional custody. BlackRock ETF inflows go HERE. Watch closely.',
  },
  {
    address:     '0x71660c4005BA85c37ccec55d0C4493E66Fe775d3',
    label:       'Coinbase Hot',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(96,165,250,1)',
    description: 'Coinbase main hot wallet. US retail + institutional flow indicator.',
  },
  {
    address:     '0x503828976D22510aad0201ac7EC88293211D23Da',
    label:       'Coinbase 2',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(79,158,248,1)',
    description: 'Coinbase secondary. Heavy ERC-20 activity.',
  },
  {
    address:     '0xA7EFae728D2936e78BDA97dc267687568dD593f3',
    label:       'Coinbase Cold',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(37,99,235,1)',
    description: 'Coinbase cold storage. Institutional USD on/off ramp signal.',
  },

  // ── 💰 CEX Flow — Kraken ──────────────────────────────────────────────────

  {
    address:     '0x267be1C1D684F78cb4F6a176C4911b741E4Ffdc0',
    label:       'Kraken',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(139,92,246,1)',
    description: 'Kraken exchange wallet. European institutional flow barometer.',
  },
  {
    address:     '0x2910543Af39abA0Cd09dBb2D50200b3E800A63D2',
    label:       'Kraken 2',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(124,58,237,1)',
    description: 'Kraken secondary hot wallet.',
  },

  // ── 💰 CEX Flow — OKX + Bybit ─────────────────────────────────────────────

  {
    address:     '0x46340b20830761efd32832A74d7169B29FEB9758',
    label:       'OKX',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(31,41,55,1)',
    description: 'OKX exchange hot wallet. Asian + institutional flow.',
  },
  {
    address:     '0x98EC059Dc3aDFBdd63429454aeB0C990FBA4A128',
    label:       'Bybit',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(247,166,0,1)',
    description: 'Bybit exchange wallet. Derivatives flow indicator.',
  },
  {
    address:     '0xf89d7b9c864f589bbF53a82105107622B35EaA40',
    label:       'Bybit 2',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(232,149,15,1)',
    description: 'Bybit secondary wallet. Perpetual futures flow.',
  },

  // ── 💰 CEX Flow — Others ──────────────────────────────────────────────────

  {
    address:     '0x0D0707963952f2fBA59dD06f2b425ace40b492Fe',
    label:       'Gate.io',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(236,72,153,1)',
    description: 'Gate.io hot wallet. Asian retail crypto sentiment.',
  },
  {
    address:     '0xe0F30cb149fAADC7247E953746Be9BbBB6B5751f',
    label:       'Crypto.com',
    chain:       'ETH',
    tag:         'CEX Whale',
    color:       'rgba(0,48,135,1)',
    description: 'Crypto.com exchange wallet. Retail flow indicator.',
  },

  // ── 💵 Stablecoin Issuers ──────────────────────────────────────────────────

  {
    address:     '0x5754284f345afc66a98fbB0a0Afe71e0F007B949',
    label:       'Tether Treasury',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(38,161,123,1)',
    description: 'Tether USDT issuer. Minting large amounts = bullish market signal.',
  },
  {
    address:     '0x55FE002aefF02F77364de339a1292923A15844B8',
    label:       'Circle USDC',
    chain:       'ETH',
    tag:         'Smart Money',
    color:       'rgba(39,117,202,1)',
    description: 'Circle USDC issuer. Large minting = institutional buying pressure.',
  },

  // ── ⚡ MEV Bots ────────────────────────────────────────────────────────────

  {
    address:     '0x00000000003b3cc22aF3aE1EAc0440BcEe416B40',
    label:       'MEV Bot Alpha',
    chain:       'ETH',
    tag:         'MEV Bot',
    color:       'rgba(249,115,22,1)',
    description: 'Top MEV bot. 1M+ txs. Profitable opportunities = market inefficiency signal.',
  },
  {
    address:     '0x000000000035B5e5ad9019092C665357240f594e',
    label:       'MEV Bot Beta',
    chain:       'ETH',
    tag:         'MEV Bot',
    color:       'rgba(251,146,60,1)',
    description: 'High frequency MEV. Tracks sandwich attacks + arb opportunities.',
  },

  // ── 🌐 Solana Whales ───────────────────────────────────────────────────────

  {
    address:     'GThUX1Atko4tqhN2NaiTazWSeFWMuiUvfFnyJyUghFMJ',
    label:       'Solana Foundation',
    chain:       'SOL',
    tag:         'DAO Treasury',
    color:       'rgba(153,69,255,1)',
    description: 'Solana Foundation treasury. Ecosystem grants + validator ops.',
  },
  {
    address:     '5tzFkiKscXHK5ZXCGbBe55onQdNzigJ9bPUqLgbvLBMF',
    label:       'Binance SOL',
    chain:       'SOL',
    tag:         'CEX Whale',
    color:       'rgba(247,147,26,1)',
    description: 'Binance Solana hot wallet. SOL inflow/outflow signal.',
  },

  // ── ₿ Bitcoin Legends ─────────────────────────────────────────────────────

  {
    address:     '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    label:       'Satoshi Genesis',
    chain:       'BTC',
    tag:         'Smart Money',
    color:       'rgba(247,147,26,1)',
    description: 'Genesis block — first ever Bitcoin. ~1M BTC untouched. $65B+. The OG.',
  },
  {
    address:     'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    label:       'MicroStrategy',
    chain:       'BTC',
    tag:         'Smart Money',
    color:       'rgba(255,107,53,1)',
    description: 'Michael Saylor thesis. 214,246 BTC ($14B+). Accumulating since 2020.',
  },
  {
    address:     '1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF',
    label:       'Mt.Gox Trustee',
    chain:       'BTC',
    tag:         'CEX Whale',
    color:       'rgba(239,68,68,1)',
    description: 'Mt.Gox bankruptcy trustee. 142K BTC repayment ongoing. Outflows = SELL PRESSURE.',
  },
  {
    address:     '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo',
    label:       'Binance BTC Cold',
    chain:       'BTC',
    tag:         'CEX Whale',
    color:       'rgba(251,191,36,1)',
    description: 'Binance Bitcoin cold wallet. $7B+ BTC. CEX inflow barometer.',
  },
  {
    address:     '3D2oetdNuZUqQHPJmcMDDHYoqkyNVsFk9r',
    label:       'Bitfinex BTC',
    chain:       'BTC',
    tag:         'CEX Whale',
    color:       'rgba(139,92,246,1)',
    description: 'Bitfinex cold wallet. ~168K BTC. Watch for large outflows.',
  },
]
