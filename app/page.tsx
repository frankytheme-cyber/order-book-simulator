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
    </div>
  );
}
