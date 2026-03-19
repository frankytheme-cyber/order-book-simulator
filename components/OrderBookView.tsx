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
  const MAX_ROWS = 15;

  const bidRows = computeRows(bids, MAX_ROWS);
  const maxBidCum = bidRows.length > 0 ? Math.max(...bidRows.map((r) => r.cumulative)) : 1;

  const askRows = computeRows(asks, MAX_ROWS);
  const maxAskCum = askRows.length > 0 ? Math.max(...askRows.map((r) => r.cumulative)) : 1;

  const bestBid = bids[0]?.price ?? null;
  const bestAsk = asks[0]?.price ?? null;
  const spread   = bestBid !== null && bestAsk !== null ? (bestAsk - bestBid).toFixed(2) : '—';
  const midPrice = bestBid !== null && bestAsk !== null ? ((bestBid + bestAsk) / 2).toFixed(2) : '—';

  const d = isDark;
  const divider = d ? 'border-zinc-800' : 'border-zinc-200';

  const colHead = `grid grid-cols-3 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border-b
    ${d ? `text-zinc-500 ${divider} bg-zinc-950` : `text-zinc-500 ${divider} bg-zinc-50`}`;

  const emptyMsg = `px-3 py-8 text-center text-xs ${d ? 'text-zinc-600' : 'text-zinc-400'}`;

  return (
    <div className={`rounded-lg overflow-hidden flex flex-col border transition-colors duration-300 h-120 ${d ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-300'}`}>

      {/* Header */}
      <div className={`px-4 py-2.5 border-b flex items-center justify-between ${divider}`}>
        <span className={`text-xs font-bold tracking-widest uppercase ${d ? 'text-zinc-300' : 'text-zinc-600'}`}>
          Order Book
        </span>
        <div className="flex items-center gap-5 text-xs">
          <span className={`flex items-center ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Spread
            <Tooltip isDark={isDark} content="Differenza tra il miglior ask e il miglior bid. Misura il costo immediato di un ordine a mercato." />
            <span className={`font-bold ml-2 tabular-nums ${d ? 'text-zinc-200' : 'text-zinc-800'}`}>{spread}</span>
          </span>
          <span className={`flex items-center ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Mid
            <Tooltip isDark={isDark} content="(Best Bid + Best Ask) / 2. Prezzo di riferimento usato dalla simulazione automatica per generare nuovi ordini." />
            <span className={`font-bold ml-2 tabular-nums ${d ? 'text-white' : 'text-zinc-900'}`}>{midPrice}</span>
          </span>
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-2 flex-1 overflow-hidden">

        {/* ── BIDS ── */}
        <div className={`flex flex-col border-r ${divider}`}>
          <div className={colHead}>
            <span className={`flex items-center ${d ? 'text-emerald-400' : 'text-emerald-600'}`}>
              Bids
              <Tooltip isDark={isDark} content="Ordini di acquisto. Ordinati dal prezzo più alto (best bid) al più basso. La barra cresce verso sinistra mostrando il volume cumulativo." />
            </span>
            <span className="text-right">Qty</span>
            <span className={`text-right flex items-center justify-end ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>
              Total
              <Tooltip isDark={isDark} content="Valore totale dell'ordine: Prezzo × Quantità." side="top" />
            </span>
          </div>
          <div className="flex flex-col">
            {bidRows.length === 0 ? (
              <div className={emptyMsg}>No bids</div>
            ) : bidRows.map((row) => {
              const pct = ((row.cumulative / maxBidCum) * 100).toFixed(1);
              return (
                <div
                  key={row.id}
                  className={`relative grid grid-cols-3 px-3 py-[4px] text-xs transition-colors ${d ? 'hover:bg-emerald-950/40' : 'hover:bg-emerald-50'}`}
                  style={{ background: `linear-gradient(to left, ${d ? 'rgba(16,185,129,0.22)' : 'rgba(16,185,129,0.14)'} ${pct}%, transparent ${pct}%)` }}
                >
                  <span className={`font-bold tabular-nums ${d ? 'text-emerald-400' : 'text-emerald-600'}`}>{row.price.toFixed(2)}</span>
                  <span className={`text-right tabular-nums font-medium ${d ? 'text-zinc-300' : 'text-zinc-700'}`}>{row.quantity}</span>
                  <span className={`text-right tabular-nums ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>{(row.price * row.quantity).toFixed(0)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── ASKS ── */}
        <div className="flex flex-col">
          <div className={colHead}>
            <span className={`flex items-center ${d ? 'text-red-400' : 'text-red-600'}`}>
              Asks
              <Tooltip isDark={isDark} content="Ordini di vendita. Ordinati dal prezzo più basso (best ask) al più alto. La barra cresce verso destra mostrando il volume cumulativo." />
            </span>
            <span className="text-right">Qty</span>
            <span className={`text-right flex items-center justify-end ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>
              Total
              <Tooltip isDark={isDark} content="Valore totale dell'ordine: Prezzo × Quantità." side="top" />
            </span>
          </div>
          <div className="flex flex-col">
            {askRows.length === 0 ? (
              <div className={emptyMsg}>No asks</div>
            ) : askRows.map((row) => {
              const pct = ((row.cumulative / maxAskCum) * 100).toFixed(1);
              return (
                <div
                  key={row.id}
                  className={`relative grid grid-cols-3 px-3 py-[4px] text-xs transition-colors ${d ? 'hover:bg-red-950/40' : 'hover:bg-red-50'}`}
                  style={{ background: `linear-gradient(to right, ${d ? 'rgba(239,68,68,0.22)' : 'rgba(239,68,68,0.14)'} ${pct}%, transparent ${pct}%)` }}
                >
                  <span className={`font-bold tabular-nums ${d ? 'text-red-400' : 'text-red-600'}`}>{row.price.toFixed(2)}</span>
                  <span className={`text-right tabular-nums font-medium ${d ? 'text-zinc-300' : 'text-zinc-700'}`}>{row.quantity}</span>
                  <span className={`text-right tabular-nums ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>{(row.price * row.quantity).toFixed(0)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
