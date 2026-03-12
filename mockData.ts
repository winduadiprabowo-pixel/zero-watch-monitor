/**
 * ZERØ WATCH — mockData v2
 * ==========================
 * FIX: Chain type include SOL (sebelumnya tidak ada SOL → type error kalau wallet SOL masuk sini)
 */

export type WalletTag = "CEX Whale" | "DeFi Insider" | "Smart Money" | "DAO Treasury" | "MEV Bot";
// FIX: tambah SOL ke Chain type
export type Chain = "ETH" | "ARB" | "BASE" | "OP" | "SOL";
export type ActionType = "SWAP" | "DEPOSIT" | "TRANSFER" | "BORROW" | "UNKNOWN";

export interface Wallet {
  id: string;
  label: string;
  address: string;
  tag: WalletTag;
  chain: Chain;
  balance: string;
  pnl: number;
  active: boolean;
  lastMove: string;
  txNew: number;
  sparkData: number[];
}

export interface ActivityEvent {
  id: string;
  walletId: string;
  walletLabel: string;
  action: ActionType;
  detail: string;
  usdSize: string;
  timestamp: string;
}

export const wallets: Wallet[] = [
  {
    id: "w1",
    label: "Abraxas Fund",
    address: "0x3f5C...f0bE",
    tag: "CEX Whale",
    chain: "ETH",
    balance: "$14.2M",
    pnl: 18.4,
    active: true,
    lastMove: "2m ago",
    txNew: 3,
    sparkData: [2, 5, 3, 8, 6, 9, 7, 10, 8, 12],
  },
  {
    id: "w2",
    label: "Obsidian Capital",
    address: "0xd8dA...6045",
    tag: "DeFi Insider",
    chain: "ETH",
    balance: "$6.7M",
    pnl: 34.1,
    active: true,
    lastMove: "11m ago",
    txNew: 1,
    sparkData: [1, 3, 2, 6, 8, 5, 9, 11, 10, 14],
  },
  {
    id: "w3",
    label: "Unknown Accumulator",
    address: "0xBE0e...33E8",
    tag: "Smart Money",
    chain: "BASE",
    balance: "$31.5M",
    pnl: -2.1,
    active: false,
    lastMove: "6h ago",
    txNew: 0,
    sparkData: [8, 7, 9, 6, 5, 4, 6, 5, 4, 3],
  },
  {
    id: "w4",
    label: "Meridian Vault",
    address: "0x47ac...D503",
    tag: "DAO Treasury",
    chain: "ARB",
    balance: "$9.8M",
    pnl: 55.2,
    active: true,
    lastMove: "1h ago",
    txNew: 2,
    sparkData: [1, 2, 4, 3, 6, 8, 7, 10, 12, 15],
  },
  {
    id: "w5",
    label: "Null Signal",
    address: "0x2208...A9D",
    tag: "MEV Bot",
    chain: "OP",
    balance: "$5.1M",
    pnl: 9.8,
    active: false,
    lastMove: "3h ago",
    txNew: 0,
    sparkData: [3, 4, 5, 4, 6, 5, 7, 6, 8, 7],
  },
];

export const activityEvents: ActivityEvent[] = [
  {
    id: "e1",
    walletId: "w1",
    walletLabel: "Abraxas Fund",
    action: "SWAP",
    detail: "14,200 USDC → 8.2 ETH",
    usdSize: "$14.2K",
    timestamp: "2m ago",
  },
  {
    id: "e2",
    walletId: "w1",
    walletLabel: "Abraxas Fund",
    action: "DEPOSIT",
    detail: "500 ETH to Aave v3",
    usdSize: "$1.3M",
    timestamp: "7m ago",
  },
  {
    id: "e3",
    walletId: "w2",
    walletLabel: "Obsidian Capital",
    action: "SWAP",
    detail: "2.1M USDC → 1,210 ETH",
    usdSize: "$2.1M",
    timestamp: "11m ago",
  },
  {
    id: "e4",
    walletId: "w4",
    walletLabel: "Meridian Vault",
    action: "TRANSFER",
    detail: "400K USDC to Gnosis Safe",
    usdSize: "$400K",
    timestamp: "1h ago",
  },
  {
    id: "e5",
    walletId: "w5",
    walletLabel: "Null Signal",
    action: "BORROW",
    detail: "800K USDC from Compound",
    usdSize: "$800K",
    timestamp: "3h ago",
  },
];

export const filterTags = ["ALL", "CEX Whale", "DeFi Insider", "Smart Money", "DAO Treasury", "MEV Bot"] as const;
