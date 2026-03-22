'use client';

import { Order } from '@/lib/engine';
import Tooltip from './Tooltip';

interface Props {
  bids: Order[];
  asks: Order[];
  isDark: boolean;
  onCancel?: (id: string) => void;
}

function computeRows(orders: Order[], maxRows: number) {
  const displayed = orders.slice(0, maxRows);
  let cumulative = 0;
  return displayed.map((order) => {
    cumulative += order.quantity;
    return { ...order, cumulative };
  });
}

export default function OrderBookView({ bids, asks, isDark, onCancel }: Props) {
  const bidRows = computeRows(bids, bids.length);
  const maxBidCum = bidRows.length > 0 ? Math.max(...bidRows.map((r) => r.cumulative)) : 1;

  const askRows = computeRows(asks, asks.length);
  const maxAskCum = askRows.length > 0 ? Math.max(...askRows.map((r) => r.cumulative)) : 1;

  const bestBid = bids[0]?.price ?? null;
  const bestAsk = asks[0]?.price ?? null;
  const spread  = bestBid !== null && bestAsk !== null ? (bestAsk - bestBid).toFixed(2) : '—';

  const totalBidVol = bids.reduce((s, o) => s + o.quantity, 0);
  const totalAskVol = asks.reduce((s, o) => s + o.quantity, 0);

  const d = isDark;
  const divider = d ? 'border-zinc-800' : 'border-zinc-200';

  const cols = onCancel ? 'grid-cols-[5rem_3.5rem_4rem_1rem]' : 'grid-cols-[5rem_3.5rem_4rem]';

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
      <div className={`grid ${cols} px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-b shrink-0 ${d ? 'text-zinc-500 border-zinc-800' : 'text-zinc-500 border-zinc-200'}`}>
        <span>Prezzo</span>
        <span className="text-right">Qtà</span>
        <span className="text-right">Totale</span>
        {onCancel && <span />}
      </div>

      {/* ASK label + total volume */}
      <div className={`px-3 py-0.5 flex items-center justify-between shrink-0 ${d ? 'bg-zinc-900' : 'bg-white'}`}>
        <span className={`text-[9px] font-bold uppercase tracking-widest ${d ? 'text-red-500' : 'text-red-600'}`}>Ask</span>
        <span className={`text-[9px] tabular-nums ${d ? 'text-zinc-600' : 'text-zinc-400'}`}>Vol {totalAskVol.toLocaleString()}</span>
      </div>

      {/* ASKS — flex-col-reverse: index 0 renders at bottom (nearest spread) = best ask */}
      <div className="flex flex-col-reverse flex-1 overflow-y-auto">
        {askRows.map((row, i) => {
          const pct = ((row.cumulative / maxAskCum) * 100).toFixed(1);
          const isBest = i === 0;
          return (
            <div
              key={row.id}
              className={`group relative grid ${cols} px-3 text-xs transition-colors
                ${isBest ? (d ? 'py-1 bg-red-950/40' : 'py-1 bg-red-50') : 'py-0.75'}
                ${d ? 'hover:bg-red-950/30' : 'hover:bg-red-50'}`}
              style={!isBest ? { background: `linear-gradient(to left, ${d ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.10)'} ${pct}%, transparent ${pct}%)` } : undefined}
            >
              <span className={`font-semibold tabular-nums ${isBest ? (d ? 'text-red-300' : 'text-red-700') : (d ? 'text-red-400' : 'text-red-600')}`}>
                {isBest && <span className={`mr-1 text-[8px] font-bold ${d ? 'text-red-400' : 'text-red-500'}`}>▶</span>}
                {row.price.toFixed(2)}
              </span>
              <span className={`text-right tabular-nums ${isBest ? 'font-bold' : ''} ${d ? 'text-zinc-300' : 'text-zinc-700'}`}>{row.quantity}</span>
              <span className={`text-right tabular-nums ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>{(row.price * row.quantity).toFixed(0)}</span>
              {onCancel && (
                <button
                  onClick={() => onCancel(row.id)}
                  className={`ml-1 opacity-0 group-hover:opacity-100 text-[10px] font-bold transition-opacity leading-none
                    ${d ? 'text-zinc-500 hover:text-red-400' : 'text-zinc-400 hover:text-red-600'}`}
                  title="Cancella ordine"
                >
                  ×
                </button>
              )}
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

      {/* BID label + total volume */}
      <div className={`px-3 py-0.5 flex items-center justify-between shrink-0 ${d ? 'bg-zinc-900' : 'bg-white'}`}>
        <span className={`text-[9px] font-bold uppercase tracking-widest ${d ? 'text-emerald-500' : 'text-emerald-600'}`}>Bid</span>
        <span className={`text-[9px] tabular-nums ${d ? 'text-zinc-600' : 'text-zinc-400'}`}>Vol {totalBidVol.toLocaleString()}</span>
      </div>

      {/* BIDS */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {bidRows.map((row, i) => {
          const pct = ((row.cumulative / maxBidCum) * 100).toFixed(1);
          const isBest = i === 0;
          return (
            <div
              key={row.id}
              className={`group relative grid ${cols} px-3 text-xs transition-colors
                ${isBest ? (d ? 'py-1 bg-emerald-950/40' : 'py-1 bg-emerald-50') : 'py-0.75'}
                ${d ? 'hover:bg-emerald-950/30' : 'hover:bg-emerald-50'}`}
              style={!isBest ? { background: `linear-gradient(to left, ${d ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.10)'} ${pct}%, transparent ${pct}%)` } : undefined}
            >
              <span className={`font-semibold tabular-nums ${isBest ? (d ? 'text-emerald-300' : 'text-emerald-700') : (d ? 'text-emerald-400' : 'text-emerald-600')}`}>
                {isBest && <span className={`mr-1 text-[8px] font-bold ${d ? 'text-emerald-400' : 'text-emerald-500'}`}>▶</span>}
                {row.price.toFixed(2)}
              </span>
              <span className={`text-right tabular-nums ${isBest ? 'font-bold' : ''} ${d ? 'text-zinc-300' : 'text-zinc-700'}`}>{row.quantity}</span>
              <span className={`text-right tabular-nums ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>{(row.price * row.quantity).toFixed(0)}</span>
              {onCancel && (
                <button
                  onClick={() => onCancel(row.id)}
                  className={`ml-1 opacity-0 group-hover:opacity-100 text-[10px] font-bold transition-opacity leading-none
                    ${d ? 'text-zinc-500 hover:text-red-400' : 'text-zinc-400 hover:text-red-600'}`}
                  title="Cancella ordine"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
