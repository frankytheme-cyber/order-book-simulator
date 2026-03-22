'use client';

import { useState } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, DatabaseZap, Zap, Bot, User } from 'lucide-react';
import { SimulatorState } from '@/hooks/useSimulator';
import { Order } from '@/lib/engine';
import Tooltip from './Tooltip';

type Props = Pick<
  SimulatorState,
  | 'isAuto' | 'setIsAuto' | 'speed' | 'setSpeed' | 'lastPrice' | 'vwap' | 'imbalance'
  | 'addManualOrder' | 'addMarketOrder' | 'cancelOrder' | 'seedBook' | 'reset'
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
  isAuto, setIsAuto, speed, setSpeed, lastPrice, vwap, imbalance,
  addManualOrder, addMarketOrder, seedBook, reset,
  trades, bids, asks, isDark, onToast,
}: Props) {
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [side, setSide]           = useState<Side>('buy');
  const [price, setPrice]         = useState('');
  const [quantity, setQuantity]   = useState('');

  const d = isDark;
  const spread = bids[0] && asks[0] ? (asks[0].price - bids[0].price).toFixed(2) : '—';

  const mktQty   = parseInt(quantity) || 0;
  const mktBook  = side === 'buy' ? asks : bids;
  const estimate = orderType === 'market' && mktQty > 0 ? estimateMarket(mktBook, mktQty) : null;

  const handleLimitOrder = () => {
    const p = parseFloat(price);
    const q = parseInt(quantity);
    if (!p || !q || p <= 0 || q <= 0) return;
    addManualOrder(p, q, side);
    onToast?.(`Ordine ${side === 'buy' ? 'Buy' : 'Sell'} Limit inserito — ${q} @ ${p.toFixed(2)}`);
    setPrice(''); setQuantity('');
  };

  const handleMarketOrder = () => {
    const q = parseInt(quantity);
    if (!q || q <= 0) return;
    addMarketOrder(side, q);
    onToast?.(`Ordine ${side === 'buy' ? 'Buy' : 'Sell'} Market inviato — Qtà ${q}`);
    setQuantity('');
  };

  const muted   = d ? 'text-zinc-500' : 'text-zinc-500';
  const divider = d ? 'border-zinc-800' : 'border-zinc-200';
  const inputCls = `w-full rounded-md px-3 py-2 text-sm font-medium border focus:outline-none focus:ring-2 tabular-nums transition-colors
    ${d ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
        : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:ring-emerald-500/20'}`;

  const isBuy = side === 'buy';

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-colors duration-300 ${d ? 'bg-zinc-900' : 'bg-white'}`}>

      {/* ── Modalità simulatore ── */}
      <div className={`px-4 py-2 border-b shrink-0 ${divider}`}>
        <div className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1 ${muted}`}>
          Modalità simulatore
          <Tooltip
            isDark={isDark}
            content="Auto: il simulatore genera ordini casuali in autonomia per animare il book. Manuale: sei tu a inserire ogni ordine."
            side="top"
          />
        </div>

        {/* Toggle Auto / Manuale */}
        <div className={`flex rounded-lg overflow-hidden border ${divider}`}>
          <button
            onClick={() => setIsAuto(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold tracking-wide transition-colors
              ${isAuto
                ? (d ? 'bg-emerald-600 text-white' : 'bg-emerald-600 text-white')
                : (d ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-750' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200')
              }`}
          >
            <Bot size={13} />
            Auto
          </button>
          <button
            onClick={() => setIsAuto(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold tracking-wide transition-colors
              ${!isAuto
                ? (d ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                : (d ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200')
              }`}
          >
            <User size={13} />
            Manuale
          </button>
        </div>

        {/* Speed slider (solo auto) */}
        {isAuto && (
          <div className="mt-2 space-y-1">
            <div className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${muted}`}>
              Velocità
              <Tooltip
                isDark={isDark}
                content="Intervallo tra un ordine automatico e il successivo. Valori bassi = mercato più frenetico e rapido."
                side="top"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] ${muted}`}>Lento</span>
              <input
                type="range" min={100} max={2000} step={100} value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className={`flex-1 h-1.5 rounded-full ${d ? 'accent-emerald-400' : 'accent-emerald-600'}`}
              />
              <span className={`text-[10px] ${muted}`}>Rapido</span>
              <span className={`text-[11px] font-bold tabular-nums w-12 text-right ${d ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {speed}ms
              </span>
            </div>
          </div>
        )}

        {/* Seed + Reset */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={seedBook}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-semibold border transition-colors
              ${d ? 'text-amber-400 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20'
                  : 'text-amber-700 border-amber-400 bg-amber-50 hover:bg-amber-100'}`}
          >
            <DatabaseZap size={11} />
            Popola book
            <Tooltip isDark={isDark} content="Aggiunge livelli di liquidità attorno al prezzo attuale per riempire il book." side="top" />
          </button>
          <button
            onClick={reset}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold border transition-colors
              ${d ? 'text-zinc-400 border-zinc-700 hover:text-white hover:bg-zinc-800'
                  : 'text-zinc-500 border-zinc-300 hover:text-zinc-900 hover:bg-zinc-100'}`}
          >
            <RefreshCw size={11} />
            Reset
            <Tooltip isDark={isDark} content="Svuota completamente il book e azzera tutti i trade della sessione." side="top" />
          </button>
        </div>
      </div>

      {/* ── Form ordini ── */}
      <div className="flex flex-col flex-1 px-4 pt-2 pb-2 space-y-2">

        {/* Buy / Sell tabs */}
        <div className={`flex rounded-lg overflow-hidden border shrink-0 ${divider}`}>
          <button
            onClick={() => setSide('buy')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide transition-colors
              ${isBuy
                ? (d ? 'bg-emerald-600 text-white' : 'bg-emerald-600 text-white')
                : (d ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-700')
              }`}
          >
            Acquista
          </button>
          <button
            onClick={() => setSide('sell')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide transition-colors
              ${!isBuy
                ? (d ? 'bg-red-600 text-white' : 'bg-red-600 text-white')
                : (d ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-700')
              }`}
          >
            Vendi
          </button>
        </div>

        {/* Limit / Market tabs */}
        <div className={`flex items-center gap-1 shrink-0 p-1 rounded-lg ${d ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
          <button
            onClick={() => setOrderType('limit')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-bold tracking-wide transition-colors
              ${orderType === 'limit'
                ? (d ? 'bg-zinc-700 text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm')
                : (d ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600')
              }`}
          >
            <TrendingUp size={11} />
            Limite
          </button>
          <button
            onClick={() => setOrderType('market')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-bold tracking-wide transition-colors
              ${orderType === 'market'
                ? (d ? 'bg-zinc-700 text-white shadow-sm' : 'bg-white text-zinc-900 shadow-sm')
                : (d ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600')
              }`}
          >
            <Zap size={11} />
            Mercato
          </button>
        </div>

        {/* Price (limit only) */}
        {orderType === 'limit' && (
          <div className="space-y-1 shrink-0">
            <label className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${muted}`}>
              Prezzo limite
              <Tooltip
                isDark={isDark}
                content={`Il tuo prezzo massimo (acquisto) o minimo (vendita). L'ordine resta nel book finché il mercato non raggiunge questo livello. Best ask attuale: ${asks[0]?.price.toFixed(2) ?? '—'}`}
                side="top"
              />
            </label>
            <input
              type="number" value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={asks[0] ? asks[0].price.toFixed(2) : '0.00'}
              step="0.01"
              className={inputCls}
            />
          </div>
        )}

        {/* Quantity */}
        <div className="space-y-1 shrink-0">
          <label className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${muted}`}>
            Quantità
            <Tooltip
              isDark={isDark}
              content={orderType === 'market'
                ? 'Numero di unità da eseguire subito al mercato. L\'ordine consuma la liquidità disponibile livello per livello.'
                : 'Numero di unità da inserire nel book al prezzo specificato.'}
              side="top"
            />
          </label>
          <input
            type="number" value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="100" step="1" min="1"
            className={inputCls}
          />
        </div>

        {/* Market estimate */}
        {estimate && (
          <div className={`rounded-md px-3 py-2 border text-xs space-y-1.5 shrink-0 ${d ? 'bg-zinc-950 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${muted}`}>
              Stima esecuzione
              <Tooltip isDark={isDark} content="Simulazione di come verrebbe eseguito l'ordine data la liquidità attuale nel book." side="top" />
            </div>
            <div className="flex items-center justify-between">
              <span className={muted}>Prezzo medio</span>
              <span className={`font-bold tabular-nums ${d ? 'text-amber-400' : 'text-amber-700'}`}>{estimate.avgPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={muted}>Eseguita</span>
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

        {!estimate && orderType === 'market' && mktQty > 0 && (
          <div className={`rounded-md px-3 py-2 text-xs border shrink-0 ${d ? 'bg-zinc-950 border-zinc-700 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400'}`}>
            Book vuoto — nessuna liquidità disponibile
          </div>
        )}

        {/* Submit */}
        <button
          onClick={orderType === 'limit' ? handleLimitOrder : handleMarketOrder}
          className={`w-full flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-colors shrink-0
            ${isBuy
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
        >
          {orderType === 'market' ? <Zap size={13} /> : (isBuy ? <TrendingUp size={13} /> : <TrendingDown size={13} />)}
          {isBuy ? 'Acquista' : 'Vendi'} {orderType === 'limit' ? 'a Limite' : 'a Mercato'}
        </button>

        {/* ── Stats ── */}
        <div className={`border-t pt-2 space-y-1.5 shrink-0 ${divider}`}>
          {[
            {
              label: 'Last Price',
              value: lastPrice !== null ? lastPrice.toFixed(2) : '—',
              tip: 'Prezzo dell\'ultimo trade eseguito nel motore di matching. Si aggiorna ad ogni esecuzione.',
            },
            {
              label: 'VWAP',
              value: vwap !== null ? vwap.toFixed(2) : '—',
              tip: 'Volume Weighted Average Price: media dei prezzi di esecuzione ponderata per le quantità. Indica il prezzo "giusto" della sessione.',
            },
            {
              label: 'Spread',
              value: spread,
              tip: 'Differenza tra Best Ask e Best Bid. Rappresenta il costo implicito di un ordine a mercato: minore è lo spread, più è liquido il mercato.',
            },
            {
              label: 'Trades',
              value: String(trades.length),
              tip: 'Numero totale di esecuzioni avvenute dall\'inizio della sessione.',
            },
          ].map(({ label, value, tip }) => (
            <div key={label} className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center ${muted}`}>
                {label}
                <Tooltip isDark={isDark} content={tip} side="top" />
              </span>
              <span className={`text-sm font-bold tabular-nums ${d ? 'text-white' : 'text-zinc-900'}`}>{value}</span>
            </div>
          ))}

          {/* Imbalance bar */}
          {imbalance !== null && (
            <div className="space-y-1">
              <div className={`text-[10px] font-bold uppercase tracking-widest flex items-center ${muted}`}>
                Imbalance
                <Tooltip isDark={isDark} content="Rapporto tra volume bid e volume totale (bid+ask). Sopra 0.5 = pressione buy, sotto 0.5 = pressione sell." side="top" />
              </div>
              <div className={`relative h-2 rounded-full overflow-hidden ${d ? 'bg-zinc-700' : 'bg-zinc-200'}`}>
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-300 bg-emerald-500"
                  style={{ width: `${(imbalance * 100).toFixed(1)}%` }}
                />
                <div
                  className="absolute right-0 top-0 h-full rounded-full transition-all duration-300 bg-red-500"
                  style={{ width: `${((1 - imbalance) * 100).toFixed(1)}%`, left: 'auto' }}
                />
              </div>
              <div className="flex justify-between">
                <span className={`text-[10px] font-semibold ${d ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  Bid {(imbalance * 100).toFixed(0)}%
                </span>
                <span className={`text-[10px] font-semibold ${d ? 'text-red-400' : 'text-red-600'}`}>
                  Ask {((1 - imbalance) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
