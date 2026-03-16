/**
 * ZERØ WATCH — entityLabels v1
 * ==============================
 * Extracted from useCrossWalletFlow to break circular dependency.
 * useCrossWalletFlow → usePatternRecognition (type) was causing
 * "Cannot access 'b' before initialization" in Vite bundled output.
 *
 * Import from here — NOT from useCrossWalletFlow.
 */

export const ENTITY_LABELS: Record<string, string> = {
  // Market Makers
  '0xdbf5e9c5206d0db70a90108bf936da60221dc080': 'Wintermute',
  '0x0000006daea1723962647b7e189d311d757fb793': 'Wintermute',
  '0xf584f8728b874a6a5c7a8d4d387c9aae9172d621': 'Jump Trading',
  '0x9507c04b10486547584c37bcbd931b2a4fee9a41': 'Jump Trading',
  '0xddacad3b1edee8e2f5b2e84f658202534fcb0374': 'DWF Labs',
  '0xd4b69e8d62c880e9dd55d419d5e07435c3538342': 'DWF Labs',
  // Justin Sun
  '0x3ddfa8ec3052539b6c9549f12cea2c295cff5296': 'Justin Sun',
  '0x176f3dab24a159341c0509bb36b833e7fdd0a132': 'Justin Sun',
  // Binance
  '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8': 'Binance',
  '0x28c6c06298d514db089934071355e5743bf21d60': 'Binance',
  '0xf977814e90da44bfa03b6295a0616a897441acec': 'Binance',
  '0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be': 'Binance',
  '0xd551234ae421e3bcba99a0da6d736074f22192ff': 'Binance',
  '0x564286362092d8e7936f0549571a803b203aaced': 'Binance',
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': 'Binance',
  // Coinbase
  '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43': 'Coinbase',
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': 'Coinbase',
  '0x503828976d22510aad0201ac7ec88293211d23da': 'Coinbase',
  '0xa7efae728d2936e78bda97dc267687568dd593f3': 'Coinbase',
  // OKX
  '0x46340b20830761efd32832a74d7169b29feb9758': 'OKX',
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b': 'OKX',
  // Bybit
  '0x98ec059dc3adfbdd63429454aeb0c990fba4a128': 'Bybit',
  '0xf89d7b9c864f589bbf53a82105107622b35eaa40': 'Bybit',
  // Kraken
  '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0': 'Kraken',
  '0x2910543af39aba0cd09dbb2d50200b3e800a63d2': 'Kraken',
  // Tether / Circle
  '0x5754284f345afc66a98fbb0a0afe71e0f007b949': 'Tether',
  '0x55fe002aeff02f77364de339a1292923a15844b8': 'Circle',
}
