# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Start production server
```

npm test         # Unit test del motore (node:test + --experimental-strip-types, Node ≥ 22.6)
```

I test vivono in `tests/` e sono esclusi da `tsconfig.json` (importano `../lib/engine.ts` con estensione esplicita).

```bash

## Architecture

**Stack:** Next.js (App Router) + React 19 + TypeScript + Tailwind CSS 4

The app is a browser-based limit order book simulator with Price/Time priority matching.

### Core Data Flow

```
lib/engine.ts                     → pure order matching logic + per-owner accounts (no React)
lib/manipulation.ts               → manipulation scenarios: phases, scripted steps, noise (no React)
hooks/useSimulator.ts             → holds Engine ref, manages React state, auto-order generation
hooks/useManipulationSimulator.ts → plays a scenario step by step on its own Engine
app/page.tsx                      → main simulator page
app/manipulation/page.tsx         → market manipulation teaching page (/manipulation)
components/                       → display components (OrderBookView, TradeHistory, SimulatorControls,
                                    ManipulationControls, EventLog, PriceChart, DepthChart, InfoPanel)
```

### Key modules

- **`lib/engine.ts`** — `Engine` class with `bids`/`asks` sorted arrays (best price at index 0). `addOrder()` rounds to the 0.01 tick, inserts by binary search (price, then arrival `seq`) and calls `matchOrders()` (FIFO, maker price). `addMarketOrder(side, qty, owner, preventSelfTrade)` walks the book consuming liquidity. Every order has an `owner` (`user` | `manipulator` | `bot`); trades carry `buyOwner`/`sellOwner` and update per-owner accounts (position, average cost, realized P&L) — read them with `getAccount()` + `accountPnl()`. Self-trades only increment `selfTradeVolume`. `trades` is capped at `MAX_TRADES`; VWAP/volume are cumulative running totals.

- **`lib/manipulation.ts`** — five scenarios (spoofing, pump-and-dump, bear-raid, wash-trading, layering). Each is a list of `ScenarioStep { phase, noiseBias, action }`; `generateNoise()` simulates the other participants. Manipulator helpers: `manipLimit` (wall/layer orders tracked in `ctx.manipIds`), `manipPassive`/`distribute` (passive orders that improve the best price by one tick), `unwind` (market close of the residual), `washTrade`. When changing a script, check that the manipulator still ends with a positive P&L in most runs.

- **`hooks/useSimulator.ts`** — single hook used by `page.tsx`. Wraps `Engine` in a `useRef` (not state) to avoid re-renders on every tick. Exposes `bids`, `asks`, `trades`, `lastPrice`, `vwap`, `imbalance`, `markPrice`, `userAccount`, `userOrderIds`, `isAuto`, `speed`, and handlers (`addManualOrder`/`addMarketOrder` return the executed trades, `cancelOrder`, `cancelUserOrders`, `seedBook`, `reset`). Manual orders are tagged `owner: 'user'`. Seeds 12 bid/ask levels on first mount. Auto-generation interval is controlled by `speed` (100–2000 ms).

- **`hooks/useManipulationSimulator.ts`** — runs the selected scenario (play/pause/step/reset, speed 200–2000 ms) and exposes the manipulator's account, start price, total vs self-trade volume. The page binds Space / → / R as shortcuts.

- **`app/page.tsx`** — client component (`'use client'`). Owns toast notifications and theme state (light/dark). All child components receive props from `useSimulator`.

### Conventions

- All components under `components/` are client components (`'use client'`).
- The `@/*` path alias resolves to the project root (configured in `tsconfig.json`).
- UI text is in Italian; metadata/SEO is in English.
- Tailwind utility classes only — no CSS modules or styled-components.
