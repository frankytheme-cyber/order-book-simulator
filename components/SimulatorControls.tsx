'use client';

import { useState } from 'react';
import { Play, Pause, RefreshCw, TrendingUp, TrendingDown, DatabaseZap, Zap } from 'lucide-react';
import { SimulatorState } from '@/hooks/useSimulator';
import { Order } from '@/lib/engine';
import Tooltip from './Tooltip';

type Props = Pick<
  SimulatorState,
  | 'isAuto' | 'setIsAuto' | 'speed' | 'setSpeed' | 'lastPrice'
  | 'addManualOrder' | 'addMarketOrder' | 'seedBook' | 'reset'
  | 'trades' | 'bids' | 'asks'
> & { isDark: boolean; onToast?: (msg: string) => void };

type OrderType = 'limit' | 'market';
type Side = 'buy' | 'sell';

function estimateMarket(book: Order[], qty: number) {
  let remaining = qty;
  let totalValue = 0;
  for (const o of book) {
    if (remaining <= 0) break;
    const fill = Math.min(remaining, o.quantity);
    totalValue += fill * o.price;
    remaining -= fill;
  }
  const filled = qty - remaining;
  if (filled === 0) return null;
  return { avgPrice: totalValue / filled, filled, unfilled: remaining };
}

export default function SimulatorControls({
  isAuto, setIsAuto, speed, setSpeed, lastPrice,
  addManualOrder, addMarketOrder, seedBook, reset,
  trades, bids, asks, isDark, onToast,
}: Props) {
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [limitSide, setLimitSide] = useState<Side>('buy');
  const [price, setPrice]         = useState('');
  const [quantity, setQuantity]   = useState('');

  const d = isDark;
  const spread = bids[0] && asks[0] ? (asks[0].price - bids[0].price).toFixed(2) : '—';

  // Market order estimate
  const mktQty    = parseInt(quantity) || 0;
  const mktBook   = limitSide === 'buy' ? asks : bids;
  const estimate  = orderType === 'market' && mktQty > 0 ? estimateMarket(mktBook, mktQty) : null;

  const handleLimitOrder = () => {
    const p = parseFloat(price);
    const q = parseInt(quantity);
    if (!p || !q || p <= 0 || q <= 0) return;
    addManualOrder(p, q, limitSide);
    onToast?.(`Ordine ${limitSide === 'buy' ? 'Buy' : 'Sell'} Limit inserito — ${q} @ ${p.toFixed(2)}`);
    setPrice(''); setQuantity('');
  };

  const handleMarketOrder = (side: Side) => {
    const q = parseInt(quantity);
    if (!q || q <= 0) return;
    addMarketOrder(side, q);
    onToast?.(`Ordine ${side === 'buy' ? 'Buy' : 'Sell'} Market inviato — Qtà ${q}`);
    setQuantity('');
  };

  // ── style shortcuts ──
  const divider  = d ? 'border-zinc-800'  : 'border-zinc-200';
  const muted    = d ? 'text-zinc-500'    : 'text-zinc-500';
  const inputCls = `w-full rounded-lg px-3 py-2.5 text-sm font-medium border-2 focus:outline-none focus:ring-2 tabular-nums transition-colors
    ${d ? 'bg-zinc-900 border-zinc-600 text-white placeholder-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
        : 'bg-white border-zinc-400 text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:ring-emerald-500/20'}`;

  const tabActive   = (on: boolean, color: 'emerald' | 'amber') => on
    ? color === 'emerald'
      ? (d ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-emerald-100 text-emerald-700 border-emerald-500')
      : (d ? 'bg-amber-500/20   text-amber-400   border-amber-500/50'  : 'bg-amber-100   text-amber-700   border-amber-500')
    : (d ? 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200'
         : 'bg-zinc-100 text-zinc-500 border-zinc-300 hover:bg-zinc-200 hover:text-zinc-700');

  return (
    <div className={`rounded-lg border p-4 space-y-4 transition-colors duration-300 ${d ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-300'}`}>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Last Price',   value: lastPrice !== null ? lastPrice.toFixed(2) : '—',
            tip: 'Prezzo dell\'ultimo trade eseguito nel motore di matching.' },
          { label: 'Spread',       value: spread,
            tip: 'Best Ask − Best Bid. Costo implicito di un ordine a mercato.' },
          { label: 'Total Trades', value: String(trades.length),
            tip: 'Numero totale di trade eseguiti dall\'avvio della sessione.' },
        ].map(({ label, value, tip }) => (
          <div key={label} className={`rounded-lg px-3 py-2.5 border ${d ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center ${muted}`}>
              {label}
              <Tooltip isDark={isDark} content={tip} side="top" />
            </div>
            <div className={`text-base font-bold tabular-nums ${d ? 'text-white' : 'text-zinc-900'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Controls row ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Auto/Manual toggle */}
        <button
          onClick={() => setIsAuto(!isAuto)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold tracking-widest uppercase border transition-colors ${
            isAuto
              ? (d ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30'
                   : 'bg-emerald-100 text-emerald-700 border-emerald-500 hover:bg-emerald-200')
              : (d ? 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700 hover:text-white'
                   : 'bg-zinc-200 text-zinc-700 border-zinc-400 hover:bg-zinc-300 hover:text-zinc-900')
          }`}
        >
          {isAuto ? <Pause size={13} /> : <Play size={13} />}
          {isAuto ? 'Auto' : 'Manual'}
        </button>

        {/* Speed slider */}
        {isAuto && (
          <div className="flex items-center gap-3 flex-1 min-w-48">
            <span className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap flex items-center ${muted}`}>
              Intervallo
              <Tooltip isDark={isDark} content="Frequenza di generazione ordini automatici. Valori bassi = mercato più frenetico." side="top" />
            </span>
            <input
              type="range" min={100} max={2000} step={100} value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className={`flex-1 h-1.5 rounded-full ${d ? 'accent-emerald-400' : 'accent-emerald-600'}`}
            />
            <span className={`text-xs font-bold tabular-nums w-14 text-right ${d ? 'text-emerald-400' : 'text-emerald-700'}`}>
              {speed}ms
            </span>
          </div>
        )}

        {/* Seed + Reset */}
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={seedBook} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors
            ${d ? 'text-amber-400 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-500/60'
                : 'text-amber-700 border-amber-500 bg-amber-50 hover:bg-amber-100'}`}>
            <DatabaseZap size={12} /> Popola
          </button>
          <button onClick={reset} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors
            ${d ? 'text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-500 hover:bg-zinc-800'
                : 'text-zinc-500 border-zinc-300 hover:text-zinc-900 hover:border-zinc-500 hover:bg-zinc-100'}`}>
            <RefreshCw size={12} /> Reset
          </button>
        </div>
      </div>

      {/* ── Manual order form ── */}
      {!isAuto && (
        <div className={`border-t pt-4 space-y-3 ${divider}`}>

          {/* Order type tabs */}
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${muted}`}>Tipo ordine</span>
            <div className="flex gap-1 ml-2">
              <button
                onClick={() => setOrderType('limit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide border transition-colors ${tabActive(orderType === 'limit', 'emerald')}`}
              >
                <TrendingUp size={11} /> Limit
              </button>
              <button
                onClick={() => setOrderType('market')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide border transition-colors ${tabActive(orderType === 'market', 'amber')}`}
              >
                <Zap size={11} /> Market
              </button>
            </div>
            <Tooltip isDark={isDark}
              content={orderType === 'limit'
                ? 'Limit: inserisce l\'ordine nel book al prezzo specificato. Viene eseguito solo quando il mercato raggiunge quel prezzo.'
                : 'Market: esegue immediatamente al miglior prezzo disponibile, consumando la liquidità del book.'
              }
              side="top"
            />
          </div>

          {/* ── LIMIT form ── */}
          {orderType === 'limit' && (
            <div className="space-y-3">
              {/* Side selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setLimitSide('buy')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold uppercase border transition-colors
                    ${limitSide === 'buy'
                      ? (d ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/60' : 'bg-emerald-100 text-emerald-700 border-emerald-500')
                      : (d ? 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300' : 'bg-zinc-100 text-zinc-400 border-zinc-300 hover:text-zinc-600')
                    }`}
                >
                  <TrendingUp size={12} /> Buy
                </button>
                <button
                  onClick={() => setLimitSide('sell')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold uppercase border transition-colors
                    ${limitSide === 'sell'
                      ? (d ? 'bg-red-500/25 text-red-300 border-red-500/60' : 'bg-red-100 text-red-700 border-red-500')
                      : (d ? 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300' : 'bg-zinc-100 text-zinc-400 border-zinc-300 hover:text-zinc-600')
                    }`}
                >
                  <TrendingDown size={12} /> Sell
                </button>
              </div>

              {/* Price + Qty inputs */}
              <div className="flex gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className={`text-xs font-bold uppercase tracking-widest ${d ? 'text-zinc-300' : 'text-zinc-700'}`}>Prezzo</label>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                    placeholder={bids[0] ? bids[0].price.toFixed(2) : '0.00'} step="0.01"
                    className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className={`text-xs font-bold uppercase tracking-widest ${d ? 'text-zinc-300' : 'text-zinc-700'}`}>Quantità</label>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                    placeholder="100" step="1" min="1"
                    className={inputCls} />
                </div>
              </div>

              <button
                onClick={handleLimitOrder}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest border transition-colors
                  ${limitSide === 'buy'
                    ? (d ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-500 hover:bg-emerald-200')
                    : (d ? 'bg-red-500/20    text-red-300    border-red-500/50    hover:bg-red-500/30'    : 'bg-red-100    text-red-700    border-red-500    hover:bg-red-200')
                  }`}
              >
                {limitSide === 'buy' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                Piazza ordine {limitSide === 'buy' ? 'Buy' : 'Sell'} Limit
              </button>
            </div>
          )}

          {/* ── MARKET form ── */}
          {orderType === 'market' && (
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <label className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1 ${d ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  Quantità
                  <Tooltip isDark={isDark} content="L'ordine a mercato consuma la liquidità esistente partendo dal miglior prezzo disponibile." side="top" />
                </label>
                <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                  placeholder="100" step="1" min="1"
                  className={inputCls} />
              </div>

              {/* Estimate preview */}
              {estimate && (
                <div className={`rounded-lg px-3 py-2.5 border text-xs space-y-1 ${d ? 'bg-zinc-950 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-widest ${muted}`}>Stima esecuzione</div>
                  <div className="flex items-center justify-between">
                    <span className={muted}>Prezzo medio</span>
                    <span className={`font-bold tabular-nums ${d ? 'text-amber-400' : 'text-amber-700'}`}>{estimate.avgPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={muted}>Quantità eseguita</span>
                    <span className={`font-bold tabular-nums ${d ? 'text-white' : 'text-zinc-900'}`}>{estimate.filled}</span>
                  </div>
                  {estimate.unfilled > 0 && (
                    <div className="flex items-center justify-between">
                      <span className={muted}>Non eseguita</span>
                      <span className={`font-bold tabular-nums ${d ? 'text-red-400' : 'text-red-600'}`}>{estimate.unfilled}</span>
                    </div>
                  )}
                </div>
              )}

              {!estimate && mktQty > 0 && (
                <div className={`rounded-lg px-3 py-2 text-xs ${d ? 'bg-zinc-950 border border-zinc-700 text-zinc-500' : 'bg-zinc-50 border border-zinc-200 text-zinc-400'}`}>
                  Book vuoto — nessuna liquidità disponibile
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => handleMarketOrder('buy')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest border transition-colors
                    ${d ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                        : 'bg-emerald-100 text-emerald-700 border-emerald-500 hover:bg-emerald-200'}`}>
                  <Zap size={12} /> Buy Market
                </button>
                <button onClick={() => handleMarketOrder('sell')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest border transition-colors
                    ${d ? 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30'
                        : 'bg-red-100 text-red-700 border-red-500 hover:bg-red-200'}`}>
                  <Zap size={12} /> Sell Market
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
