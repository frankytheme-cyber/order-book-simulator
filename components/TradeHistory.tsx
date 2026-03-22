'use client';

import { useEffect, useState } from 'react';
import { Trade } from '@/lib/engine';

interface Props {
  trades: Trade[];
  isDark: boolean;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('it-IT', { hour12: false });
}

export default function TradeHistory({ trades, isDark }: Props) {
  const [newTradeId, setNewTradeId] = useState<string | null>(null);

  useEffect(() => {
    if (trades.length === 0) return;
    const latest = trades.at(-1)!;
    setNewTradeId(latest.id);
    const t = setTimeout(() => setNewTradeId(null), 600);
    return () => clearTimeout(t);
  }, [trades.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayed = [...trades].reverse().slice(0, 50);
  const d = isDark;

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-colors duration-300 ${d ? 'bg-zinc-900' : 'bg-white'}`}>

      {/* Header */}
      <div className={`px-4 py-2.5 border-b flex items-center justify-between shrink-0 ${d ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <span className={`text-xs font-bold tracking-widest uppercase ${d ? 'text-zinc-300' : 'text-zinc-600'}`}>Trade History</span>
        <span className={`text-xs font-semibold tabular-nums ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>{trades.length} trades</span>
      </div>

      {/* Column headers */}
      <div className={`grid grid-cols-3 px-4 py-1 text-[10px] font-semibold uppercase tracking-widest border-b shrink-0 ${d ? 'text-zinc-500 border-zinc-800 bg-zinc-950' : 'text-zinc-500 border-zinc-200 bg-zinc-50'}`}>
        <span>Time</span>
        <span className="text-right">Price</span>
        <span className="text-right">Qty</span>
      </div>

      {/* Trade list */}
      <div className="flex-1 overflow-y-auto">
        {displayed.length === 0 ? (
          <div className={`px-4 py-12 text-center text-xs ${d ? 'text-zinc-600' : 'text-zinc-400'}`}>No trades yet</div>
        ) : displayed.map((trade) => {
          const isBuyAggressor = trade.aggressor === 'buy';
          const isNew = trade.id === newTradeId;

          return (
            <div
              key={trade.id}
              className={`grid grid-cols-3 px-4 py-[5px] text-xs border-b transition-colors
                ${d ? 'border-zinc-800/60 hover:bg-zinc-800' : 'border-zinc-100 hover:bg-zinc-50'}
                ${isNew ? 'flash-in' : ''}`}
            >
              <span className={`tabular-nums ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>{formatTime(trade.timestamp)}</span>
              <span className={`text-right flex items-center justify-end gap-1 tabular-nums font-bold
                ${isBuyAggressor ? (d ? 'text-emerald-400' : 'text-emerald-600') : (d ? 'text-red-400' : 'text-red-600')}`}
              >
                <span className="text-[8px]">{isBuyAggressor ? '▲' : '▼'}</span>
                {trade.price.toFixed(2)}
              </span>
              <span className={`text-right tabular-nums font-medium ${d ? 'text-zinc-300' : 'text-zinc-700'}`}>{trade.quantity}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
