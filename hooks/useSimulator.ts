'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Engine, Order, Trade, Account, emptyAccount } from '@/lib/engine';

export interface SimulatorState {
  bids: Order[];
  asks: Order[];
  trades: Trade[];
  isAuto: boolean;
  setIsAuto: (v: boolean) => void;
  speed: number;
  setSpeed: (v: number) => void;
  lastPrice: number | null;
  vwap: number | null;
  imbalance: number | null;
  /** Prezzo usato per valutare la posizione (mid o ultimo prezzo). */
  markPrice: number | null;
  /** Posizione e P&L dell'utente. */
  userAccount: Account;
  /** Id degli ordini dell'utente ancora aperti nel book. */
  userOrderIds: Set<string>;
  cancelUserOrders: () => void;
  addManualOrder: (price: number, quantity: number, side: 'buy' | 'sell') => Trade[];
  addMarketOrder: (side: 'buy' | 'sell', quantity: number) => Trade[];
  cancelOrder: (id: string) => void;
  seedBook: () => void;
  reset: () => void;
}

// Box-Muller transform: standard normal sample
function randn(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

const LEVELS = 12;
const STEP = 0.10;

function seedEngine(engine: Engine) {
  const base = engine.getMidPrice() ?? engine.getLastPrice() ?? 100;
  const now = Date.now();
  for (let i = 1; i <= LEVELS; i++) {
    engine.addOrder({
      id: crypto.randomUUID(),
      side: 'buy',
      price: parseFloat((base - i * STEP).toFixed(2)),
      quantity: Math.floor(Math.random() * 180) + 20,
      timestamp: now + i,
    });
    engine.addOrder({
      id: crypto.randomUUID(),
      side: 'sell',
      price: parseFloat((base + i * STEP).toFixed(2)),
      quantity: Math.floor(Math.random() * 180) + 20,
      timestamp: now + 100 + i,
    });
  }
}

export function useSimulator(): SimulatorState {
  const engineRef = useRef<Engine | null>(null);

  const [bids, setBids] = useState<Order[]>([]);
  const [asks, setAsks] = useState<Order[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isAuto, setIsAuto] = useState(true);
  const [speed, setSpeed] = useState(500);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [vwap, setVwap] = useState<number | null>(null);
  const [imbalance, setImbalance] = useState<number | null>(null);
  const [markPrice, setMarkPrice] = useState<number | null>(null);
  const [userAccount, setUserAccount] = useState<Account>(emptyAccount());
  const [userOrderIds, setUserOrderIds] = useState<Set<string>>(new Set());
  const seeded = useRef(false);

  // Initialize engine + seed on first mount
  useEffect(() => {
    if (engineRef.current === null) {
      engineRef.current = new Engine();
    }
    if (!seeded.current) {
      seeded.current = true;
      const engine = engineRef.current;
      seedEngine(engine);
      setBids([...engine.bids]);
      setAsks([...engine.asks]);
      setMarkPrice(engine.getMarkPrice());
    }
  }, []);

  const syncState = useCallback((engine: Engine) => {
    setBids([...engine.bids]);
    setAsks([...engine.asks]);
    setTrades([...engine.trades]);
    setLastPrice(engine.getLastPrice());
    setVwap(engine.getVWAP());
    setImbalance(engine.getImbalance());
    setMarkPrice(engine.getMarkPrice());
    setUserAccount(engine.getAccount('user'));
    setUserOrderIds(new Set(engine.getOrdersByOwner('user').map((o) => o.id)));
  }, []);

  // Auto-generate orders
  useEffect(() => {
    if (!isAuto) return;

    const interval = setInterval(() => {
      const engine = engineRef.current;
      if (!engine) return;

      // Auto re-seed if book is too thin (< 3 levels on either side)
      if (engine.bids.length < 3 || engine.asks.length < 3) {
        seedEngine(engine);
      }

      const ref = engine.getMidPrice() ?? engine.getLastPrice() ?? 100;

      // 20% chance of market order
      if (Math.random() < 0.20) {
        const side: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell';
        const quantity = Math.floor(Math.random() * 60) + 1;
        engine.addMarketOrder(side, quantity);
      } else {
        // Log-normal price deviation: realistic skew
        const sigma = 0.003;
        const drift = randn() * sigma * ref;
        const rawPrice = ref + drift;
        const price = Math.max(0.01, parseFloat(rawPrice.toFixed(2)));
        const quantity = Math.floor(Math.random() * 150) + 1;
        const side: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell';

        const order: Order = {
          id: crypto.randomUUID(),
          side,
          price,
          quantity,
          timestamp: Date.now(),
        };
        engine.addOrder(order);
      }

      syncState(engine);
    }, speed);

    return () => clearInterval(interval);
  }, [isAuto, speed, syncState]);

  const addManualOrder = useCallback(
    (price: number, quantity: number, side: 'buy' | 'sell'): Trade[] => {
      const engine = engineRef.current;
      if (!engine) return [];
      const order: Order = {
        id: crypto.randomUUID(),
        side,
        price,
        quantity,
        timestamp: Date.now(),
        owner: 'user',
      };
      const executed = engine.addOrder(order);
      syncState(engine);
      return executed;
    },
    [syncState]
  );

  const addMarketOrder = useCallback(
    (side: 'buy' | 'sell', quantity: number): Trade[] => {
      const engine = engineRef.current;
      if (!engine) return [];
      const executed = engine.addMarketOrder(side, quantity, 'user');
      syncState(engine);
      return executed;
    },
    [syncState]
  );

  const cancelOrder = useCallback(
    (id: string) => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.cancelOrder(id);
      syncState(engine);
    },
    [syncState]
  );

  const cancelUserOrders = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.cancelAllByOwner('user');
    syncState(engine);
  }, [syncState]);

  const seedBook = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    seedEngine(engine);
    syncState(engine);
  }, [syncState]);

  const reset = useCallback(() => {
    engineRef.current = new Engine();
    setBids([]);
    setAsks([]);
    setTrades([]);
    setLastPrice(null);
    setVwap(null);
    setImbalance(null);
    setMarkPrice(null);
    setUserAccount(emptyAccount());
    setUserOrderIds(new Set());
  }, []);

  return {
    bids,
    asks,
    trades,
    isAuto,
    setIsAuto,
    speed,
    setSpeed,
    lastPrice,
    vwap,
    imbalance,
    markPrice,
    userAccount,
    userOrderIds,
    cancelUserOrders,
    addManualOrder,
    addMarketOrder,
    cancelOrder,
    seedBook,
    reset,
  };
}
