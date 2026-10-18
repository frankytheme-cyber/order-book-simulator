'use client';

import { Owner, Trade } from '@/lib/engine';

interface Props {
  trades: Trade[];
  isDark: boolean;
  /** Evidenzia i trade in cui compare questo owner (utente o manipolatore). */
  markOwner?: Owner;
  markTone?: 'amber' | 'blue';
  markLabel?: string;
}

const MAX_ROWS = 50;

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('it-IT', { hour12: false });
}

export default function TradeHistory({ trades, isDark, markOwner, markTone = 'amber', markLabel }: Props) {
  // Le righe hanno key = id del trade: ogni nuovo trade monta una riga nuova
  // e l'animazione CSS `flash-in` parte da sola, senza stato aggiuntivo.
  const displayed = trades.slice(-MAX_ROWS).reverse();
  const d = isDark;

  const dot = markTone === 'blue'
    ? (d ? 'bg-blue-400' : 'bg-blue-500')
    : (d ? 'bg-amber-400' : 'bg-amber-500');
  const markedBg = markTone === 'blue'
    ? (d ? 'bg-blue-950/30' : 'bg-blue-50')
    : (d ? 'bg-amber-950/30' : 'bg-amber-50');

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-colors duration-300 ${d ? 'bg-zinc-900' : 'bg-white'}`}>

      {/* Header */}
      <div className={`px-4 py-2.5 border-b flex items-center justify-between shrink-0 ${d ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <span className={`text-xs font-bold tracking-widest uppercase ${d ? 'text-zinc-300' : 'text-zinc-600'}`}>Trade History</span>
        <span className={`text-xs font-semibold tabular-nums ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>{trades.length} trade</span>
      </div>

      {markOwner && markLabel && (
        <div className={`px-4 py-1 flex items-center gap-1.5 text-[10px] border-b shrink-0 ${d ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-zinc-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} /> {markLabel}
        </div>
      )}

      {/* Column headers */}
      <div className={`grid grid-cols-3 px-4 py-1 text-[10px] font-semibold uppercase tracking-widest border-b shrink-0 ${d ? 'text-zinc-500 border-zinc-800 bg-zinc-950' : 'text-zinc-500 border-zinc-200 bg-zinc-50'}`}>
        <span>Ora</span>
        <span className="text-right">Prezzo</span>
        <span className="text-right">Qtà</span>
      </div>

      {/* Trade list */}
      <div className="flex-1 overflow-y-auto">
        {displayed.length === 0 ? (
          <div className={`px-4 py-12 text-center text-xs ${d ? 'text-zinc-600' : 'text-zinc-400'}`}>Nessun trade</div>
        ) : displayed.map((trade) => {
          const isBuyAggressor = trade.aggressor === 'buy';
          const isMarked = markOwner !== undefined && (trade.buyOwner === markOwner || trade.sellOwner === markOwner);
          const isSelf = trade.buyOwner === trade.sellOwner && trade.buyOwner !== 'bot';

          return (
            <div
              key={trade.id}
              title={isSelf ? 'Self-trade: compratore e venditore coincidono' : undefined}
              className={`flash-in grid grid-cols-3 px-4 py-[5px] text-xs border-b transition-colors
                ${d ? 'border-zinc-800/60 hover:bg-zinc-800' : 'border-zinc-100 hover:bg-zinc-50'}
                ${isMarked ? markedBg : ''}`}
            >
              <span className={`tabular-nums flex items-center gap-1.5 ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>
                {isMarked && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />}
                {formatTime(trade.timestamp)}
              </span>
              <span className={`text-right flex items-center justify-end gap-1 tabular-nums font-bold
                ${isBuyAggressor ? (d ? 'text-emerald-400' : 'text-emerald-600') : (d ? 'text-red-400' : 'text-red-600')}`}
              >
                <span className="text-[8px]">{isBuyAggressor ? '▲' : '▼'}</span>
                {trade.price.toFixed(2)}
              </span>
              <span className={`text-right tabular-nums font-medium ${d ? 'text-zinc-300' : 'text-zinc-700'}`}>
                {isSelf && <span className={`mr-1 text-[9px] font-bold ${d ? 'text-amber-400' : 'text-amber-600'}`}>W</span>}
                {trade.quantity}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
