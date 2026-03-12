# ZERØ WATCH — Smart Money Wallet Tracker

> Real-time crypto wallet monitoring. Track whale movements, smart money flows, and DeFi insider activity.

**Live:** [zero-watch-monitor.pages.dev](https://zero-watch-monitor.pages.dev)

---

## Stack

- React 18 + TypeScript 5 + Vite
- TanStack Query · Zustand · Shadcn/UI · Tailwind CSS
- Cloudflare Pages (deploy) · Cloudflare Workers (API proxy)
- Etherscan V2 API · Alchemy · Gumroad License API

## Architecture

```
Browser → CF Pages (static)
       → CF Worker Proxy → Etherscan V2
                        → Alchemy RPC
                        → Gumroad License API
```

API keys **never** exposed in client bundle. All proxied via CF Worker.

## Environment Variables

**Cloudflare Pages** (Settings → Environment Variables):
```
VITE_PROXY_URL = https://zero-watch-proxy.<subdomain>.workers.dev
```

**Cloudflare Worker** (Worker Settings → Variables):
```
ETHERSCAN_API_KEY
ALCHEMY_API_KEY
GUMROAD_PRODUCT_ID
MASTER_KEY
ALLOWED_ORIGIN
```

## Local Development

```sh
npm install
npm run dev
```

> Set `VITE_PROXY_URL` in `.env.local` pointing to your CF Worker.

## Build

```sh
npm run build
```

Output: `dist/` — deploy to Cloudflare Pages.

---

**ZERØ BUILD LAB** · Build in silence. Win in public.
