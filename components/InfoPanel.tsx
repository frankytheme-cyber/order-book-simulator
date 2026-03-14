'use client';

import { X, BookOpen, Zap, ArrowLeftRight, BarChart2, TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  isDark: boolean;
  onClose: () => void;
}

const FAKE_BIDS = [
  { price: 99.90, qty: 210 },
  { price: 99.80, qty: 155 },
  { price: 99.70, qty: 98 },
  { price: 99.60, qty: 67 },
  { price: 99.50, qty: 40 },
];
const FAKE_ASKS = [
  { price: 100.10, qty: 185 },
  { price: 100.20, qty: 130 },
  { price: 100.30, qty: 88 },
  { price: 100.40, qty: 55 },
  { price: 100.50, qty: 30 },
];
const MAX_QTY = 210;

export default function InfoPanel({ isDark, onClose }: Props) {
  const d = isDark;

  const overlay = 'fixed inset-0 z-50 flex items-center justify-center p-4';
  const panel = `relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl
    ${d ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'}`;

  const sectionTitle = `text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${d ? 'text-zinc-300' : 'text-zinc-700'}`;
  const card = `rounded-xl border p-4 ${d ? 'bg-zinc-800/60 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`;
  const muted = d ? 'text-zinc-400' : 'text-zinc-500';
  const body = `text-xs leading-relaxed ${muted}`;

  return (
    <div className={overlay}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className={panel}>
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b ${d ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'}`}>
          <div className="flex items-center gap-2">
            <BookOpen size={16} className={d ? 'text-emerald-400' : 'text-emerald-600'} />
            <h2 className={`text-sm font-bold tracking-widest uppercase ${d ? 'text-emerald-400' : 'text-emerald-700'}`}>
              Guida all&apos;Order Book
            </h2>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${d ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'}`}>
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-8">

          {/* ── Section 1: What is an order book ── */}
          <section>
            <h3 className={sectionTitle}>
              <BarChart2 size={14} className={d ? 'text-emerald-400' : 'text-emerald-600'} />
              Cos&apos;è un Order Book
            </h3>
            <p className={`${body} mb-4`}>
              Un order book è il registro in tempo reale di tutti gli ordini di acquisto (bid) e vendita (ask)
              non ancora eseguiti per uno strumento finanziario. I prezzi si incontrano al centro: il miglior bid
              è il più alto, il miglior ask è il più basso.
            </p>

            {/* Visual book diagram */}
            <div className={`rounded-xl overflow-hidden border ${d ? 'border-zinc-700' : 'border-zinc-200'}`}>
              {/* Column headers */}
              <div className={`grid grid-cols-2 text-[10px] font-bold uppercase tracking-widest ${d ? 'bg-zinc-950' : 'bg-zinc-100'}`}>
                <div className={`px-4 py-2 border-r ${d ? 'border-zinc-700 text-emerald-400' : 'border-zinc-200 text-emerald-600'}`}>
                  ▲ Bids (Acquisto)
                </div>
                <div className={d ? 'px-4 py-2 text-red-400' : 'px-4 py-2 text-red-600'}>
                  ▼ Asks (Vendita)
                </div>
              </div>

              <div className="grid grid-cols-2">
                {/* Bids */}
                <div className={`border-r ${d ? 'border-zinc-700' : 'border-zinc-200'}`}>
                  {FAKE_BIDS.map((row, i) => {
                    const pct = ((row.qty / MAX_QTY) * 100).toFixed(0);
                    return (
                      <div
                        key={i}
                        className="grid grid-cols-2 px-4 py-1.5 text-xs relative"
                        style={{ background: `linear-gradient(to left, rgba(16,185,129,${d ? '0.22' : '0.14'}) ${pct}%, transparent ${pct}%)` }}
                      >
                        <span className={`font-bold tabular-nums ${d ? 'text-emerald-400' : 'text-emerald-600'}`}>{row.price.toFixed(2)}</span>
                        <span className={`text-right tabular-nums font-medium ${d ? 'text-zinc-300' : 'text-zinc-600'}`}>{row.qty}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Asks */}
                <div>
                  {FAKE_ASKS.map((row, i) => {
                    const pct = ((row.qty / MAX_QTY) * 100).toFixed(0);
                    return (
                      <div
                        key={i}
                        className="grid grid-cols-2 px-4 py-1.5 text-xs relative"
                        style={{ background: `linear-gradient(to right, rgba(239,68,68,${d ? '0.22' : '0.14'}) ${pct}%, transparent ${pct}%)` }}
                      >
                        <span className={`font-bold tabular-nums ${d ? 'text-red-400' : 'text-red-600'}`}>{row.price.toFixed(2)}</span>
                        <span className={`text-right tabular-nums font-medium ${d ? 'text-zinc-300' : 'text-zinc-600'}`}>{row.qty}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Spread callout */}
              <div className={`flex items-center justify-center gap-3 px-4 py-2 border-t text-xs font-semibold ${d ? 'bg-zinc-950 border-zinc-700' : 'bg-zinc-100 border-zinc-200'}`}>
                <span className={d ? 'text-emerald-400' : 'text-emerald-600'}>Best Bid: 99.90</span>
                <ArrowLeftRight size={12} className={muted} />
                <span className={d ? 'text-zinc-400' : 'text-zinc-500'}>Spread: <strong>0.20</strong></span>
                <ArrowLeftRight size={12} className={muted} />
                <span className={d ? 'text-red-400' : 'text-red-600'}>Best Ask: 100.10</span>
              </div>
            </div>
          </section>

          {/* ── Section 2: Spread and Mid Price ── */}
          <section>
            <h3 className={sectionTitle}>
              <ArrowLeftRight size={14} className={d ? 'text-emerald-400' : 'text-emerald-600'} />
              Spread e Mid Price
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className={card}>
                <div className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${d ? 'text-zinc-400' : 'text-zinc-500'}`}>Spread</div>
                <div className={`text-lg font-bold mb-1 ${d ? 'text-white' : 'text-zinc-900'}`}>Ask − Bid</div>
                <p className={body}>
                  La differenza tra il miglior prezzo di vendita e il miglior prezzo di acquisto.
                  Uno spread stretto indica alta liquidità. Paghi lo spread ogni volta che esegui un ordine a mercato.
                </p>
              </div>
              <div className={card}>
                <div className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${d ? 'text-zinc-400' : 'text-zinc-500'}`}>Mid Price</div>
                <div className={`text-lg font-bold mb-1 ${d ? 'text-white' : 'text-zinc-900'}`}>(Ask + Bid) / 2</div>
                <p className={body}>
                  Il punto medio tra best bid e best ask. Usato come riferimento per il &quot;prezzo equo&quot; corrente
                  e come base per generare ordini casuali nella simulazione automatica.
                </p>
              </div>
            </div>
          </section>

          {/* ── Section 3: Depth Bars ── */}
          <section>
            <h3 className={sectionTitle}>
              <BarChart2 size={14} className={d ? 'text-emerald-400' : 'text-emerald-600'} />
              Barre di Profondità (Depth)
            </h3>
            <p className={`${body} mb-3`}>
              Le barre colorate dietro ogni riga mostrano la <strong>profondità cumulativa</strong>:
              quanto volume è disponibile da quel livello di prezzo in su (ask) o in giù (bid).
              Una barra lunga = grande liquidità accumulata.
            </p>
            <div className={`rounded-xl overflow-hidden border ${d ? 'border-zinc-700' : 'border-zinc-200'}`}>
              {[
                { label: '10%', qty: 40,  note: 'Poco volume a questo livello' },
                { label: '45%', qty: 98,  note: 'Volume moderato' },
                { label: '80%', qty: 210, note: 'Alto volume cumulativo' },
              ].map(({ label, qty, note }, i) => (
                <div key={i} className={`flex items-center gap-4 px-4 py-2 text-xs ${i < 2 ? (d ? 'border-b border-zinc-800' : 'border-b border-zinc-100') : ''}`}>
                  <div
                    className="h-5 rounded flex items-center px-2 transition-all"
                    style={{ width: label, background: d ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)' }}
                  >
                    <span className={`text-[10px] font-bold ${d ? 'text-emerald-300' : 'text-emerald-700'}`}>{label}</span>
                  </div>
                  <span className={`font-bold tabular-nums w-8 ${d ? 'text-emerald-400' : 'text-emerald-600'}`}>{qty}</span>
                  <span className={muted}>{note}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── Section 4: Order Types ── */}
          <section>
            <h3 className={sectionTitle}>
              <Zap size={14} className={d ? 'text-emerald-400' : 'text-emerald-600'} />
              Tipi di Ordine
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Limit */}
              <div className={`${card} border-l-2 ${d ? 'border-l-emerald-500' : 'border-l-emerald-600'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className={d ? 'text-emerald-400' : 'text-emerald-600'} />
                  <span className={`text-xs font-bold uppercase tracking-wide ${d ? 'text-emerald-400' : 'text-emerald-700'}`}>Ordine Limit</span>
                </div>
                <p className={body}>
                  Viene inserito nel book ad un prezzo specifico. <strong>Non viene eseguito immediatamente</strong>:
                  rimane in attesa finché un ordine opposto non raggiunge il tuo prezzo. Fornisce liquidità al mercato.
                </p>
                <div className={`mt-2 rounded-lg px-2 py-1.5 text-[10px] font-mono ${d ? 'bg-zinc-900 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>
                  BUY LIMIT 100 @ 99.80 → entra nel book dei bids
                </div>
              </div>

              {/* Market */}
              <div className={`${card} border-l-2 ${d ? 'border-l-amber-500' : 'border-l-amber-600'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className={d ? 'text-amber-400' : 'text-amber-600'} />
                  <span className={`text-xs font-bold uppercase tracking-wide ${d ? 'text-amber-400' : 'text-amber-700'}`}>Ordine Market</span>
                </div>
                <p className={body}>
                  Viene eseguito <strong>immediatamente al miglior prezzo disponibile</strong>, consumando la liquidità
                  esistente nel book. Nessun controllo sul prezzo: paghi lo spread e potenziali slippage.
                </p>
                <div className={`mt-2 rounded-lg px-2 py-1.5 text-[10px] font-mono ${d ? 'bg-zinc-900 text-zinc-400' : 'bg-zinc-100 text-zinc-600'}`}>
                  BUY MARKET 100 → esegue subito sugli asks
                </div>
              </div>
            </div>

            {/* Price/Time Priority */}
            <div className={card}>
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${d ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Price/Time Priority (FIFO)
              </div>
              <p className={body}>
                Il motore di matching ordina gli ordini per <strong>prezzo</strong> (miglior prezzo prima),
                poi a parità di prezzo per <strong>tempo di arrivo</strong> (chi è arrivato prima viene eseguito prima).
                Questo è il meccanismo standard dei mercati regolamentati (CLOB — Central Limit Order Book).
              </p>
              <div className={`mt-3 grid grid-cols-3 gap-2 text-[10px] text-center font-medium ${muted}`}>
                {[
                  { step: '1', label: 'Ordine inserito', color: d ? 'bg-zinc-800' : 'bg-zinc-100' },
                  { step: '2', label: 'Ordinato per prezzo+tempo', color: d ? 'bg-zinc-800' : 'bg-zinc-100' },
                  { step: '3', label: 'Match → Trade eseguito', color: d ? 'bg-emerald-900/40' : 'bg-emerald-50' },
                ].map(({ step, label, color }) => (
                  <div key={step} className={`${color} rounded-lg px-2 py-2`}>
                    <div className={`text-base font-bold mb-0.5 ${d ? 'text-white' : 'text-zinc-800'}`}>{step}</div>
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
