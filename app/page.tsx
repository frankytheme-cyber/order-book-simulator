'use client';

import { useState } from 'react';
import { useSimulator } from '@/hooks/useSimulator';
import OrderBookView from '@/components/OrderBookView';
import TradeHistory from '@/components/TradeHistory';
import SimulatorControls from '@/components/SimulatorControls';
import InfoPanel from '@/components/InfoPanel';
import { Activity, Sun, Moon, HelpCircle } from 'lucide-react';

export default function Page() {
  const simulator = useSimulator();
  const [isDark, setIsDark]     = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  const d = isDark;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${d ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-900'}`}>

      {/* Header */}
      <header className={`border-b px-6 py-3 flex items-center justify-between ${d ? 'border-zinc-800' : 'border-zinc-300'}`}>
        <div className="flex items-center gap-3">
          <Activity size={16} className={d ? 'text-emerald-400' : 'text-emerald-600'} />
          <h1 className={`text-sm font-bold tracking-[0.2em] uppercase ${d ? 'text-emerald-400' : 'text-emerald-700'}`}>
            Order Book Simulator
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${simulator.isAuto ? 'bg-emerald-400 animate-pulse' : d ? 'bg-zinc-700' : 'bg-zinc-400'}`} />
            <span className={`text-[10px] uppercase tracking-widest ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>
              {simulator.isAuto ? 'Live' : 'Paused'}
            </span>
          </div>

          {/* Help */}
          <button
            onClick={() => setShowInfo(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
              ${d ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
                  : 'bg-white border-zinc-300 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400'}`}
          >
            <HelpCircle size={13} /> Guida
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
              ${d ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
                  : 'bg-white border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900'}`}
          >
            {d ? <Sun size={13} /> : <Moon size={13} />}
            {d ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 p-4 grid grid-cols-2 gap-4 min-h-0">
        <OrderBookView bids={simulator.bids} asks={simulator.asks} isDark={isDark} />
        <TradeHistory trades={simulator.trades} isDark={isDark} />
      </main>

      {/* Controls */}
      <footer className="p-4 pt-0">
        <SimulatorControls
          isAuto={simulator.isAuto}
          setIsAuto={simulator.setIsAuto}
          speed={simulator.speed}
          setSpeed={simulator.setSpeed}
          lastPrice={simulator.lastPrice}
          addManualOrder={simulator.addManualOrder}
          addMarketOrder={simulator.addMarketOrder}
          seedBook={simulator.seedBook}
          reset={simulator.reset}
          trades={simulator.trades}
          bids={simulator.bids}
          asks={simulator.asks}
          isDark={isDark}
        />
      </footer>

      {/* Info modal */}
      {showInfo && <InfoPanel isDark={isDark} onClose={() => setShowInfo(false)} />}

      {/* SEO / GEO content — visible below the fold */}
      <section
        aria-label="About this tool"
        className={`border-t px-6 py-10 text-sm leading-relaxed ${d ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-600'}`}
      >
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className={`text-base font-semibold mb-2 ${d ? 'text-zinc-200' : 'text-zinc-800'}`}>
              What is an Order Book Simulator?
            </h2>
            <p>
              An <strong>order book</strong> is the core mechanism of any financial exchange — stock, crypto, or futures.
              It aggregates all open <strong>limit orders</strong> for a trading pair, sorted by price, showing the full
              supply and demand at any moment. This simulator reproduces that mechanism in real time, directly in your browser,
              with no account or installation required.
            </p>
          </div>

          <div>
            <h2 className={`text-base font-semibold mb-2 ${d ? 'text-zinc-200' : 'text-zinc-800'}`}>
              How does Price/Time Priority matching work?
            </h2>
            <p>
              Orders are matched using <strong>Price/Time Priority</strong> (also called FIFO matching): the best-priced
              order is always matched first. When two orders share the same price, the one submitted earliest takes precedence.
              This is the standard algorithm used by most regulated exchanges worldwide, including NASDAQ, NYSE, and major
              crypto platforms like Binance and Coinbase.
            </p>
          </div>

          <div>
            <h2 className={`text-base font-semibold mb-2 ${d ? 'text-zinc-200' : 'text-zinc-800'}`}>
              Features
            </h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Live order book with real-time bid/ask updates</li>
              <li>Configurable simulation speed</li>
              <li>Manual limit and market order submission</li>
              <li>Trade history with execution price and quantity</li>
              <li>Bid/ask spread and last price tracking</li>
              <li>Dark and light UI theme</li>
              <li>No signup, no install — runs entirely in the browser</li>
            </ul>
          </div>

          <div>
            <h2 className={`text-base font-semibold mb-2 ${d ? 'text-zinc-200' : 'text-zinc-800'}`}>
              Who is this for?
            </h2>
            <p>
              Ideal for <strong>finance students</strong>, <strong>algorithmic traders</strong>, developers building
              trading systems, and anyone curious about <strong>market microstructure</strong>. Use it to understand
              how spreads form, how liquidity depth works, and how orders get executed in a real exchange environment.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
