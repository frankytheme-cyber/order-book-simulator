# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Start production server
```

No test runner is configured.

## Architecture

**Stack:** Next.js (App Router) + React 19 + TypeScript + Tailwind CSS 4

The app is a browser-based limit order book simulator with Price/Time priority matching.

### Core Data Flow

```
lib/engine.ts          → pure order matching logic (no React)
hooks/useSimulator.ts  → holds Engine ref, manages React state, auto-order generation
app/page.tsx           → root client component, orchestrates layout and passes state down
components/            → pure display components (OrderBookView, TradeHistory, SimulatorControls, InfoPanel)
```

### Key modules

- **`lib/engine.ts`** — `Engine` class with `bids`/`asks` sorted arrays (best price at index 0). `addOrder()` inserts a limit order and calls `matchOrders()` (FIFO, maker price). `addMarketOrder()` walks the book consuming liquidity.

- **`hooks/useSimulator.ts`** — single hook used by `page.tsx`. Wraps `Engine` in a `useRef` (not state) to avoid re-renders on every tick. Exposes `bids`, `asks`, `trades`, `lastPrice`, `isAuto`, `speed`, and handlers (`submitOrder`, `submitMarketOrder`, `toggleAuto`, `resetBook`). Seeds 12 bid/ask levels on first mount. Auto-generation interval is controlled by `speed` (100–2000 ms).

- **`app/page.tsx`** — client component (`'use client'`). Owns toast notifications and theme state (light/dark). All child components receive props from `useSimulator`.

### Conventions

- All components under `components/` are client components (`'use client'`).
- The `@/*` path alias resolves to the project root (configured in `tsconfig.json`).
- UI text is in Italian; metadata/SEO is in English.
- Tailwind utility classes only — no CSS modules or styled-components.
