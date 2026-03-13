# ZERØ WATCH — Crypto Wallet Monitor

> Multi-chain wallet tracker with whale alerts, portfolio analytics, and real-time push notifications.

[![Live](https://img.shields.io/badge/Live-zero--watch--monitor.pages.dev-brightgreen?style=flat-square)](https://zero-watch-monitor.pages.dev)
[![Stack](https://img.shields.io/badge/Stack-React%2018%20%2B%20TypeScript%20%2B%20Vite-blue?style=flat-square)]()
[![Chains](https://img.shields.io/badge/Chains-ETH%20%7C%20ARB%20%7C%20BASE%20%7C%20OP%20%7C%20SOL-purple?style=flat-square)]()
[![Price](https://img.shields.io/badge/Price-%249%20lifetime-orange?style=flat-square)]()

---

## Overview

ZERØ WATCH is a real-time multi-chain wallet monitoring tool. Track any wallet across Ethereum, Arbitrum, Base, Optimism, and Solana — with whale movement alerts, portfolio sparklines, and browser push notifications. Built for traders and on-chain analysts who need instant awareness of wallet activity.

**Live:** [zero-watch-monitor.pages.dev](https://zero-watch-monitor.pages.dev)

---

## Features

- **Multi-Chain Support** — ETH, ARB, BASE, OP via Etherscan V2 + Alchemy; SOL via public RPC
- **Whale Alerts** — Browser push notifications when tracked wallets move large amounts
- **Portfolio Sparkline** — Visual balance history per wallet
- **Market Tab** — Fear & Greed Index + gas tracker
- **PWA Installable** — Install as native app on mobile and desktop
- **Pro Paywall** — Free: 3 wallets · Pro $9 lifetime: unlimited wallets + CSV export
- **Sentiment Data** — Fear & Greed + funding rate via Binance futures API

---

## Architecture

```
src/
├── pages/
│   └── Index.tsx
├── store/
│   └── walletStore.ts          # Zustand — FREE_LIMIT = 3
├── hooks/
│   ├── useWalletData.ts         # Multi-chain fetch logic
│   ├── useWhaleAlerts.ts        # Browser push notifications
│   └── useSentiment.ts          # Fear & Greed + funding rate
├── services/
│   ├── api.ts                   # ETH/ARB/BASE/OP via CF Worker proxy
│   └── solanaApi.ts             # Solana public RPC — no key needed
└── components/
    ├── WhaleAlertToggle.tsx
    ├── AddWalletModal.tsx
    └── dashboard/
        ├── StatsBar.tsx         # Sparkline SVG
        ├── WalletSidebar.tsx
        ├── WalletTable.tsx
        └── WalletIntelPanel.tsx
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript + Vite |
| State | Zustand + TanStack Query |
| UI | Shadcn/UI + Tailwind CSS |
| Proxy | Cloudflare Worker (zero-watch-proxy) |
| Hosting | Cloudflare Pages |
| Notifications | Web Push API |

---

## Supported Chains

| Chain | Data Source |
|-------|------------|
| Ethereum | Etherscan V2 + Alchemy via CF Worker |
| Arbitrum | Etherscan V2 + Alchemy via CF Worker |
| Base | Etherscan V2 + Alchemy via CF Worker |
| Optimism | Etherscan V2 + Alchemy via CF Worker |
| Solana | Public RPC — no API key required |

---

## Cloudflare Worker Routes

```
REST: /etherscan    → Etherscan V2
REST: /alchemy/ETH  → Alchemy RPC (Ethereum)
REST: /alchemy/ARB  → Alchemy RPC (Arbitrum)
REST: /alchemy/BASE → Alchemy RPC (Base)
REST: /alchemy/OP   → Alchemy RPC (Optimism)
REST: /fapi/*       → https://fapi.binance.com (funding rate)
```

---

## Environment Variables

| Key | Where | Notes |
|-----|-------|-------|
| `VITE_PROXY_URL` | CF Pages → Settings → Environment Variables | Required — if missing, all data returns 0 |

---

## Paywall Logic

```typescript
// ALWAYS use this pattern — never bare isPro
const isUnlocked = isPro || trialActive;
```

- **Free:** 3 wallets
- **Pro ($9 lifetime):** Unlimited wallets + CSV export

---

## Local Development

```bash
git clone https://github.com/winduadiprabowo-pixel/zero-watch-monitor
cd zero-watch-monitor
npm install
echo "VITE_PROXY_URL=https://zero-watch-proxy.winduadiprabowo.workers.dev" > .env
npm run dev
```

---

## Roadmap

- [ ] Whale alert via Telegram bot
- [ ] Jupiter API integration for Solana token prices
- [ ] Rate limiting via CF KV store
- [ ] Multi-wallet CSV export improvements

---

## Author

**Windu Adi Prabowo** · [ZERØ BUILD LAB](https://github.com/winduadiprabowo-pixel) · [@ZerobuildLab](https://twitter.com/ZerobuildLab)
