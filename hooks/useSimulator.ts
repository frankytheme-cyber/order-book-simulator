'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Engine, Order, Trade } from '@/lib/engine';

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
  addManualOrder: (price: number, quantity: number, side: 'buy' | 'sell') => void;
  addMarketOrder: (side: 'buy' | 'sell', quantity: number) => void;
  seedBook: () => void;
  reset: () => void;
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
  const seeded = useRef(false);

  // Initialize engine client-side only + seed on first mount
  useEffect(() => {
    if (engineRef.current === null) {
      engineRef.current = new Engine();
    }
    if (!seeded.current) {
      seeded.current = true;
      const engine = engineRef.current;
      const base = 100;
      const now = Date.now();
      const LEVELS = 12;
      const STEP = 0.10;
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
      setBids([...engine.bids]);
      setAsks([...engine.asks]);
    }
  }, []);

  const syncState = useCallback((engine: Engine) => {
    setBids([...engine.bids]);
    setAsks([...engine.asks]);
    setTrades([...engine.trades]);
    setLastPrice(engine.getLastPrice());
    setVwap(engine.getVWAP());
  }, []);

  // Auto-generate orders
  useEffect(() => {
    if (!isAuto) return;

    const interval = setInterval(() => {
      const engine = engineRef.current;
      if (!engine) return;

      const ref = engine.getMidPrice() ?? engine.getLastPrice() ?? 100;
      const deviation = ref * 0.005;
      const rawPrice = ref + (Math.random() * 2 - 1) * deviation;
      const price = parseFloat(rawPrice.toFixed(2));
      const quantity = Math.floor(Math.random() * 100) + 1;
      const side: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell';

      const order: Order = {
        id: crypto.randomUUID(),
        side,
        price,
        quantity,
        timestamp: Date.now(),
      };

      engine.addOrder(order);
      syncState(engine);
    }, speed);

    return () => clearInterval(interval);
  }, [isAuto, speed, syncState]);

  const addManualOrder = useCallback(
    (price: number, quantity: number, side: 'buy' | 'sell') => {
      const engine = engineRef.current;
      if (!engine) return;

      const order: Order = {
        id: crypto.randomUUID(),
        side,
        price,
        quantity,
        timestamp: Date.now(),
      };

      engine.addOrder(order);
      syncState(engine);
    },
    [syncState]
  );

  const addMarketOrder = useCallback(
    (side: 'buy' | 'sell', quantity: number) => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.addMarketOrder(side, quantity);
      syncState(engine);
    },
    [syncState]
  );

  const seedBook = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const base = engine.getMidPrice() ?? engine.getLastPrice() ?? 100;
    const now = Date.now();
    const LEVELS = 12;
    const STEP = 0.10;

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

    syncState(engine);
  }, [syncState]);

  const reset = useCallback(() => {
    engineRef.current = new Engine();
    setBids([]);
    setAsks([]);
    setTrades([]);
    setLastPrice(null);
    setVwap(null);
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
    addManualOrder,
    addMarketOrder,
    seedBook,
    reset,
  };
}
