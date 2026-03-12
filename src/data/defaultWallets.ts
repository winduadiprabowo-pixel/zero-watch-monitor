/**
 * ZERØ WATCH — Default Whale Wallets
 * =====================================
 * Pre-seeded wallets — user buka langsung ada data.
 * Zero empty state. Zero confusion. Instant value.
 */

import type { Chain } from '@/store/walletStore'

export interface DefaultWallet {
  address: string
  label:   string
  chain:   Chain
  color:   string
  tag:     string
  hint:    string  // 1-line why this wallet matters
}

export const DEFAULT_WHALE_WALLETS: DefaultWallet[] = [
  {
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    label:   'Vitalik.eth',
    chain:   'ETH',
    color:   '#00FF94',
    tag:     'Smart Money',
    hint:    'Ethereum founder — every move matters',
  },
  {
    address: '0xBE0eB53F46CD790Cd13851d5EFf43D12404d33E8',
    label:   'Binance Cold',
    chain:   'ETH',
    color:   '#00C2FF',
    tag:     'CEX Whale',
    hint:    'Largest exchange cold wallet — $B moves',
  },
  {
    address: '0x28C6c06298d514Db089934071355E5743bf21d60',
    label:   'Binance Hot',
    chain:   'ETH',
    color:   '#FFD93D',
    tag:     'CEX Whale',
    hint:    'Binance daily ops — watch for outflows',
  },
  {
    address: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503',
    label:   'Abraxas Capital',
    chain:   'ETH',
    color:   '#C77DFF',
    tag:     'DeFi Insider',
    hint:    'Sophisticated DeFi deployer — early alpha',
  },
  {
    address: '0xF977814e90dA44bFA03b6295A0616a897441aceC',
    label:   'Binance Custodian',
    chain:   'ETH',
    color:   '#FF6B6B',
    tag:     'CEX Whale',
    hint:    'High-volume custodian — tracks institutional flow',
  },
]
