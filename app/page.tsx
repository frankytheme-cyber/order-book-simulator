'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSimulator } from '@/hooks/useSimulator';
import OrderBookView from '@/components/OrderBookView';
import SimulatorControls from '@/components/SimulatorControls';
import InfoPanel from '@/components/InfoPanel';
import PriceChart from '@/components/PriceChart';
import DepthChart from '@/components/DepthChart';
import TradeHistory from '@/components/TradeHistory';
import { Activity, Sun, Moon, HelpCircle, CheckCircle, X, AlertTriangle } from 'lucide-react';

export default function Page() {
  const simulator = useSimulator();
  const [isDark, setIsDark]     = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [toast, setToast]       = useState<string | null>(null);
  const [toastExiting, setToastExiting] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const d = isDark;

  const dismissToast = useCallback(() => {
    setToastExiting(true);
    setTimeout(() => {
      setToast(null);
      setToastExiting(false);
    }, 300);
  }, []);

  // Auto-dismiss toast after 3.5s
  useEffect(() => {
    if (!toast || toastExiting) return;
    const t = setTimeout(dismissToast, 3500);
    return () => clearTimeout(t);
  }, [toast, toastExiting, dismissToast]);

  const handleToast = useCallback((msg: string) => {
    setToastExiting(false);
    setToast(msg);
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${d ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-900'}`}>

      {/* ── Header (originale) ── */}
      <header className={`border-b px-6 py-3 flex items-center justify-between ${d ? 'border-zinc-800' : 'border-zinc-300'}`}>
        <div className="flex items-center gap-3">
          <Activity size={16} className={d ? 'text-emerald-400' : 'text-emerald-600'} />
          <h1 className={`text-sm font-bold tracking-[0.2em] uppercase ${d ? 'text-emerald-400' : 'text-emerald-700'}`}>
            Order Book Simulator
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Indicatore live */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${simulator.isAuto ? 'bg-emerald-400 animate-pulse' : d ? 'bg-zinc-700' : 'bg-zinc-400'}`} />
            <span className={`text-[10px] uppercase tracking-widest ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>
              {simulator.isAuto ? 'Live' : 'In pausa'}
            </span>
          </div>

          {/* Guida */}
          <button
            onClick={() => setShowInfo(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
              ${d ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
                  : 'bg-white border-zinc-300 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400'}`}
          >
            <HelpCircle size={13} /> Guida
          </button>

          {/* Toggle tema */}
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

      {/* ── Hero con animazione ── */}
      <section className={`relative overflow-hidden px-6 py-20 text-center ${d ? '' : ''}`}>
        {/* Glow sfondo decorativo */}
        <div className={`absolute inset-0 pointer-events-none ${d
          ? 'bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(16,185,129,0.08),transparent)]'
          : 'bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(16,185,129,0.06),transparent)]'
        }`} />

        {/* Badge */}
        <div className={`animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-medium border mb-8
          ${d ? 'border-zinc-700/60 text-zinc-400 bg-zinc-900/80 backdrop-blur-sm' : 'border-zinc-300 text-zinc-500 bg-white/80 backdrop-blur-sm'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${simulator.isAuto ? 'bg-emerald-400 animate-pulse' : d ? 'bg-zinc-600' : 'bg-zinc-400'}`} />
          Gratuito &middot; Senza registrazione &middot; Direttamente nel browser
        </div>

        {/* Titolo */}
        <h2 className={`animate-fade-up-delay-1 text-4xl sm:text-5xl font-bold tracking-tight mb-5`}>
          <span className={d ? 'text-white' : 'text-zinc-900'}>Simula un </span>
          <span className="hero-shimmer">Order Book</span>
          <br />
          <span className={d ? 'text-white' : 'text-zinc-900'}>in tempo reale</span>
        </h2>

        {/* Descrizione */}
        <p className={`animate-fade-up-delay-2 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-6
          ${d ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Questo simulatore riproduce il funzionamento di un order book reale — il cuore di qualsiasi
          exchange finanziario. Osserva il matching automatico tra ordini bid e ask,
          inserisci i tuoi ordini limit o market e analizza come cambia la liquidità in tempo reale.
        </p>

        {/* Sotto-descrizione */}
        <p className={`animate-fade-up-delay-3 text-sm max-w-xl mx-auto
          ${d ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Ideale per studenti di finanza, trader algoritmici e sviluppatori
          che vogliono capire il Price/Time Priority matching.
        </p>

        {/* Freccia verso il basso */}
        <div className={`animate-fade-in mt-10 ${d ? 'text-zinc-600' : 'text-zinc-400'}`}>
          <svg className="mx-auto w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Trading Terminal ── */}
      <section className={`border-t ${d ? 'border-zinc-800' : 'border-zinc-300'}`}>

        {/* Desktop: 3 colonne */}
        <div className="hidden md:flex h-150">
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <div className="flex-1 min-h-0">
              <PriceChart trades={simulator.trades} lastPrice={simulator.lastPrice} isDark={isDark} />
            </div>
            <div className={`h-48 shrink-0 border-t ${d ? 'border-zinc-800' : 'border-zinc-300'}`}>
              <DepthChart bids={simulator.bids} asks={simulator.asks} isDark={isDark} />
            </div>
          </div>
          <div className={`w-86 shrink-0 border-l border-r ${d ? 'border-zinc-800' : 'border-zinc-300'}`}>
            <OrderBookView bids={simulator.bids} asks={simulator.asks} isDark={isDark} onCancel={simulator.cancelOrder} />
          </div>
          <div className="w-72 shrink-0">
            <SimulatorControls
              isAuto={simulator.isAuto}
              setIsAuto={simulator.setIsAuto}
              speed={simulator.speed}
              setSpeed={simulator.setSpeed}
              lastPrice={simulator.lastPrice}
              vwap={simulator.vwap}
              imbalance={simulator.imbalance}
              addManualOrder={simulator.addManualOrder}
              addMarketOrder={simulator.addMarketOrder}
              cancelOrder={simulator.cancelOrder}
              seedBook={simulator.seedBook}
              reset={simulator.reset}
              trades={simulator.trades}
              bids={simulator.bids}
              asks={simulator.asks}
              isDark={isDark}
              onToast={handleToast}
            />
          </div>
          <div className={`w-56 shrink-0 border-l overflow-hidden ${d ? 'border-zinc-800' : 'border-zinc-300'}`}>
            <TradeHistory trades={simulator.trades} isDark={isDark} />
          </div>
        </div>

        {/* Mobile: stack verticale */}
        <div className="flex flex-col md:hidden">
          <div className={`h-64 border-b ${d ? 'border-zinc-800' : 'border-zinc-300'}`}>
            <PriceChart trades={simulator.trades} lastPrice={simulator.lastPrice} isDark={isDark} />
          </div>
          <div className={`h-96 border-b ${d ? 'border-zinc-800' : 'border-zinc-300'}`}>
            <OrderBookView bids={simulator.bids} asks={simulator.asks} isDark={isDark} onCancel={simulator.cancelOrder} />
          </div>
          <div>
            <SimulatorControls
              isAuto={simulator.isAuto}
              setIsAuto={simulator.setIsAuto}
              speed={simulator.speed}
              setSpeed={simulator.setSpeed}
              lastPrice={simulator.lastPrice}
              vwap={simulator.vwap}
              imbalance={simulator.imbalance}
              addManualOrder={simulator.addManualOrder}
              addMarketOrder={simulator.addMarketOrder}
              cancelOrder={simulator.cancelOrder}
              seedBook={simulator.seedBook}
              reset={simulator.reset}
              trades={simulator.trades}
              bids={simulator.bids}
              asks={simulator.asks}
              isDark={isDark}
              onToast={handleToast}
            />
          </div>
          <div className={`border-t ${d ? 'border-zinc-800' : 'border-zinc-300'}`}>
            <TradeHistory trades={simulator.trades} isDark={isDark} />
          </div>
        </div>

      </section>

      {/* ── Sezione informativa (SEO) ── */}
      <section
        aria-label="Informazioni sul tool"
        className={`border-t px-6 py-10 text-sm leading-relaxed ${d ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-600'}`}
      >
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className={`text-base font-semibold mb-2 ${d ? 'text-zinc-200' : 'text-zinc-800'}`}>
              Cos&apos;è un Order Book Simulator?
            </h2>
            <p>
              Un <strong>order book</strong> è il meccanismo centrale di qualsiasi exchange finanziario — azioni, crypto o futures.
              Aggrega tutti gli <strong>ordini limit</strong> aperti su un asset, ordinati per prezzo, mostrando domanda e offerta
              in ogni istante. Questo simulatore riproduce quel meccanismo in tempo reale, direttamente nel browser,
              senza account né installazioni.
            </p>
          </div>

          <div>
            <h2 className={`text-base font-semibold mb-2 ${d ? 'text-zinc-200' : 'text-zinc-800'}`}>
              Come funziona il matching Price/Time Priority?
            </h2>
            <p>
              Gli ordini vengono abbinati usando la priorità <strong>Prezzo/Tempo</strong> (detta anche FIFO matching):
              l&apos;ordine con il miglior prezzo viene sempre eseguito per primo. Quando due ordini hanno lo stesso prezzo,
              quello inserito prima ha la precedenza. Questo è l&apos;algoritmo standard usato dalla maggior parte degli exchange
              regolamentati nel mondo, inclusi NASDAQ, NYSE e le principali piattaforme crypto come Binance e Coinbase.
            </p>
          </div>

          <div>
            <h2 className={`text-base font-semibold mb-2 ${d ? 'text-zinc-200' : 'text-zinc-800'}`}>
              Funzionalità
            </h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Order book in tempo reale con aggiornamenti bid/ask live</li>
              <li>Velocità di simulazione configurabile</li>
              <li>Inserimento manuale di ordini limit e market</li>
              <li>Storico trade con prezzo e quantità di esecuzione</li>
              <li>Monitoraggio di spread e ultimo prezzo</li>
              <li>Tema chiaro e scuro</li>
              <li>Nessuna registrazione, nessuna installazione — gira interamente nel browser</li>
            </ul>
          </div>

          <div>
            <h2 className={`text-base font-semibold mb-2 ${d ? 'text-zinc-200' : 'text-zinc-800'}`}>
              A chi è rivolto?
            </h2>
            <p>
              Ideale per <strong>studenti di finanza</strong>, <strong>trader algoritmici</strong>, sviluppatori
              che costruiscono sistemi di trading e chiunque sia curioso di capire la <strong>microstruttura dei mercati</strong>.
              Usalo per comprendere come si formano gli spread, come funziona la profondità di liquidità
              e come vengono eseguiti gli ordini in un exchange reale.
            </p>
          </div>
        </div>
      </section>

      {/* ── Disclaimer strumento finanziario (fixed bottom) ── */}
      {showDisclaimer && (
        <div className={`fixed bottom-0 left-0 right-0 z-40 border-t px-6 py-4 shadow-lg backdrop-blur-md
          ${d ? 'border-zinc-700 bg-amber-950/80' : 'border-zinc-300 bg-amber-50/95'}`}>
          <div className={`max-w-4xl mx-auto flex items-start gap-3 text-xs leading-relaxed ${d ? 'text-amber-200/80' : 'text-amber-800'}`}>
            <AlertTriangle size={18} className={`shrink-0 mt-0.5 ${d ? 'text-amber-400' : 'text-amber-600'}`} />
            <p className="flex-1">
              <strong className={d ? 'text-amber-300' : 'text-amber-900'}>Avvertenza:</strong> Questo simulatore ha finalità esclusivamente
              didattiche e informative. Non costituisce consulenza finanziaria, raccomandazione di investimento né sollecitazione
              all&apos;acquisto o alla vendita di strumenti finanziari. I dati visualizzati sono generati in modo casuale e non
              rappresentano condizioni di mercato reali. Per decisioni di investimento, rivolgiti a un consulente finanziario autorizzato.
            </p>
            <button
              onClick={() => setShowDisclaimer(false)}
              className={`shrink-0 rounded-full p-1 transition-colors ${d ? 'hover:bg-amber-800/50 text-amber-400' : 'hover:bg-amber-200 text-amber-600'}`}
              aria-label="Chiudi avvertenza"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className={`border-t px-6 py-5 text-center ${d ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <p className={`text-xs ${d ? 'text-zinc-600' : 'text-zinc-400'}`}>
          &copy; {new Date().getFullYear()}{' '}
          <a
            href="https://simonepuliti.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className={`underline underline-offset-2 transition-colors ${d ? 'hover:text-zinc-300' : 'hover:text-zinc-700'}`}
          >
            Simone Puliti
          </a>
          {' '}&middot; Order Book Simulator &middot; Tutti i diritti riservati
        </p>
      </footer>

      {/* ── Info modal ── */}
      {showInfo && <InfoPanel isDark={isDark} onClose={() => setShowInfo(false)} />}

      {/* ── Toast globale (fisso in alto) ── */}
      {toast && (
        <div className={`fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none`}>
          <div
            className={`pointer-events-auto mt-4 flex items-center gap-3 px-6 py-4 rounded-xl text-sm font-semibold shadow-2xl border backdrop-blur-md
              ${toastExiting ? 'toast-exit' : 'toast-enter'}
              ${d
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200 shadow-emerald-500/10'
                : 'bg-emerald-50/90 border-emerald-400 text-emerald-800 shadow-emerald-500/15'
              }`}
          >
            <CheckCircle size={20} className={d ? 'text-emerald-400' : 'text-emerald-600'} />
            <span>{toast}</span>
            <button onClick={dismissToast} className={`ml-2 rounded-full p-0.5 transition-colors ${d ? 'hover:bg-emerald-800/50' : 'hover:bg-emerald-200'}`}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
