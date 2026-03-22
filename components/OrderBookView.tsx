'use client';

import { Order } from '@/lib/engine';
import Tooltip from './Tooltip';

interface Props {
  bids: Order[];
  asks: Order[];
  isDark: boolean;
}

function computeRows(orders: Order[], maxRows: number) {
  const displayed = orders.slice(0, maxRows);
  let cumulative = 0;
  return displayed.map((order) => {
    cumulative += order.quantity;
    return { ...order, cumulative };
  });
}

export default function OrderBookView({ bids, asks, isDark }: Props) {
  const bidRows = computeRows(bids, bids.length);
  const maxBidCum = bidRows.length > 0 ? Math.max(...bidRows.map((r) => r.cumulative)) : 1;

  // Asks reversed so best ask is nearest to spread line
  const askRows = computeRows(asks, asks.length);
  const maxAskCum = askRows.length > 0 ? Math.max(...askRows.map((r) => r.cumulative)) : 1;

  const bestBid = bids[0]?.price ?? null;
  const bestAsk = asks[0]?.price ?? null;
  const spread  = bestBid !== null && bestAsk !== null ? (bestAsk - bestBid).toFixed(2) : '—';

  const d = isDark;
  const divider = d ? 'border-zinc-800' : 'border-zinc-200';

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-colors duration-300 ${d ? 'bg-zinc-900' : 'bg-white'}`}>

      {/* Header */}
      <div className={`px-3 py-2.5 border-b flex items-center justify-between shrink-0 ${divider}`}>
        <span className={`text-xs font-bold tracking-widest uppercase ${d ? 'text-zinc-300' : 'text-zinc-600'}`}>
          Registro Ordini
        </span>
        <Tooltip isDark={isDark} content="Asks (vendita) in rosso sopra lo spread, bids (acquisto) in verde sotto." side="top" />
      </div>

      {/* Column headers */}
      <div className={`grid grid-cols-3 px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-b shrink-0 ${d ? 'text-zinc-500 border-zinc-800' : 'text-zinc-500 border-zinc-200'}`}>
        <span>Prezzo</span>
        <span className="text-right">Qtà</span>
        <span className="text-right">Totale</span>
      </div>

      {/* ASKS — reversed so best ask sits just above spread, scrollable upward */}
      <div className="flex flex-col-reverse flex-1 overflow-y-auto">
        {askRows.map((row) => {
          const pct = ((row.cumulative / maxAskCum) * 100).toFixed(1);
          return (
            <div
              key={row.id}
              className={`relative grid grid-cols-3 px-3 py-0.75 text-xs transition-colors ${d ? 'hover:bg-red-950/30' : 'hover:bg-red-50'}`}
              style={{ background: `linear-gradient(to left, ${d ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.10)'} ${pct}%, transparent ${pct}%)` }}
            >
              <span className={`font-semibold tabular-nums ${d ? 'text-red-400' : 'text-red-600'}`}>{row.price.toFixed(2)}</span>
              <span className={`text-right tabular-nums ${d ? 'text-zinc-300' : 'text-zinc-700'}`}>{row.quantity}</span>
              <span className={`text-right tabular-nums ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>{(row.price * row.quantity).toFixed(0)}</span>
            </div>
          );
        })}
      </div>

      {/* Spread row */}
      <div className={`px-3 py-1.5 border-y flex items-center justify-between shrink-0 ${divider} ${d ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
        <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>
          Spread
          <Tooltip isDark={isDark} content="Best Ask − Best Bid. Costo implicito di un ordine a mercato." side="top" />
        </span>
        <span className={`text-xs font-bold tabular-nums ${d ? 'text-zinc-200' : 'text-zinc-800'}`}>{spread}</span>
      </div>

      {/* BIDS */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {bidRows.map((row) => {
          const pct = ((row.cumulative / maxBidCum) * 100).toFixed(1);
          return (
            <div
              key={row.id}
              className={`relative grid grid-cols-3 px-3 py-0.75 text-xs transition-colors ${d ? 'hover:bg-emerald-950/30' : 'hover:bg-emerald-50'}`}
              style={{ background: `linear-gradient(to left, ${d ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.10)'} ${pct}%, transparent ${pct}%)` }}
            >
              <span className={`font-semibold tabular-nums ${d ? 'text-emerald-400' : 'text-emerald-600'}`}>{row.price.toFixed(2)}</span>
              <span className={`text-right tabular-nums ${d ? 'text-zinc-300' : 'text-zinc-700'}`}>{row.quantity}</span>
              <span className={`text-right tabular-nums ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>{(row.price * row.quantity).toFixed(0)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
