'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useManipulationSimulator, ManipulationType } from '@/hooks/useManipulationSimulator';

const SCENARIO_LABELS: Record<ManipulationType, string> = {
  spoofing: 'Spoofing',
  'pump-and-dump': 'Pump & Dump',
  'bear-raid': 'Bear Raid',
  'wash-trading': 'Wash Trading',
  layering: 'Layering',
};
import OrderBookView from '@/components/OrderBookView';
import PriceChart from '@/components/PriceChart';
import DepthChart from '@/components/DepthChart';
import TradeHistory from '@/components/TradeHistory';
import ManipulationControls from '@/components/ManipulationControls';
import EventLog from '@/components/EventLog';
import {
  Activity, Sun, Moon, ArrowLeft, AlertTriangle, X, ShieldAlert,
} from 'lucide-react';

export default function ManipulationPage() {
  const sim = useManipulationSimulator();
  const [isDark, setIsDark] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [toastExiting, setToastExiting] = useState(false);

  const d = isDark;

  const dismissToast = useCallback(() => {
    setToastExiting(true);
    setTimeout(() => { setToast(null); setToastExiting(false); }, 300);
  }, []);

  useEffect(() => {
    if (!toast || toastExiting) return;
    const t = setTimeout(dismissToast, 3500);
    return () => clearTimeout(t);
  }, [toast, toastExiting, dismissToast]);

  const { selectScenario } = sim;
  const handleSelectScenario = useCallback((type: ManipulationType) => {
    selectScenario(type);
    setToastExiting(false);
    setToast(`Scenario «${SCENARIO_LABELS[type]}» pronto — premi Avvia o Spazio`);
  }, [selectScenario]);

  // Scorciatoie da tastiera: Spazio = avvia/pausa, → = passo, R = ricomincia
  const { togglePlay, stepForward, reset, currentScenario } = sim;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const isTextField = el && ((el.tagName === 'INPUT' && (el as HTMLInputElement).type !== 'range')
        || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (isTextField) return;
      if (e.metaKey || e.ctrlKey || e.altKey || !currentScenario) return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); stepForward(); }
      else if (e.key === 'r' || e.key === 'R') { reset(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, stepForward, reset, currentScenario]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${d ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-900'}`}>

      {/* ── Header ── */}
      <header className={`border-b px-4 sm:px-6 py-3 flex items-center justify-between gap-3 ${d ? 'border-zinc-800' : 'border-zinc-300'}`}>
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link
            href="/"
            aria-label="Torna al simulatore"
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors
              ${d ? 'text-zinc-500 hover:text-zinc-200' : 'text-zinc-400 hover:text-zinc-900'}`}
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">Simulatore</span>
          </Link>
          <div className={`w-px h-4 ${d ? 'bg-zinc-700' : 'bg-zinc-300'}`} />
          <div className="flex items-center gap-2">
            <Activity size={14} className={d ? 'text-amber-400' : 'text-amber-600'} />
            <h1 className={`text-xs sm:text-sm font-bold tracking-[0.1em] sm:tracking-[0.15em] uppercase leading-tight ${d ? 'text-amber-400' : 'text-amber-700'}`}>
              Manipolazione di Mercato
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${sim.isPlaying ? 'bg-amber-400 animate-pulse' : d ? 'bg-zinc-700' : 'bg-zinc-400'}`} />
            <span className={`hidden sm:inline text-[10px] uppercase tracking-widest ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>
              {sim.isPlaying ? 'In esecuzione' : sim.currentScenario ? 'In pausa' : 'In attesa'}
            </span>
          </div>

          <button
            onClick={() => setIsDark(!isDark)}
            aria-label={d ? 'Tema chiaro' : 'Tema scuro'}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
              ${d ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
                  : 'bg-white border-zinc-300 text-zinc-600 hover:border-zinc-500 hover:text-zinc-900'}`}
          >
            {d ? <Sun size={13} /> : <Moon size={13} />}
            <span className="hidden sm:inline">{d ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className={`relative overflow-hidden px-6 py-16 text-center`}>
        <div className={`absolute inset-0 pointer-events-none ${d
          ? 'bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(245,158,11,0.07),transparent)]'
          : 'bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(245,158,11,0.05),transparent)]'
        }`} />

        <div className={`animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-medium border mb-7
          ${d ? 'border-amber-700/40 text-amber-400/80 bg-amber-950/40 backdrop-blur-sm' : 'border-amber-300 text-amber-600 bg-amber-50/80 backdrop-blur-sm'}`}>
          <ShieldAlert size={11} />
          Strumento didattico &middot; Non costituisce consulenza finanziaria
        </div>

        <h2 className={`animate-fade-up-delay-1 text-4xl sm:text-5xl font-bold tracking-tight mb-5`}>
          <span className={d ? 'text-white' : 'text-zinc-900'}>Manipolazione</span>
          <br />
          <span className="hero-shimmer-amber">di Mercato</span>
        </h2>

        <p className={`animate-fade-up-delay-2 text-base leading-relaxed max-w-2xl mx-auto mb-4
          ${d ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Scopri le principali tecniche usate per manipolare i prezzi degli asset finanziari.
          Osserva in tempo reale come cambiano l&apos;order book, la profondità e il prezzo
          quando il mercato viene artificialmente distorto.
        </p>

        <p className={`animate-fade-up-delay-3 text-sm max-w-xl mx-auto
          ${d ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Seleziona uno scenario nel pannello a destra, poi premi <strong>Avvia</strong> o
          avanza passo dopo passo per seguire la simulazione. Scorciatoie:{' '}
          <kbd className={`px-1 rounded border text-[11px] ${d ? 'border-zinc-700' : 'border-zinc-300'}`}>Spazio</kbd> avvia/pausa,{' '}
          <kbd className={`px-1 rounded border text-[11px] ${d ? 'border-zinc-700' : 'border-zinc-300'}`}>→</kbd> un passo,{' '}
          <kbd className={`px-1 rounded border text-[11px] ${d ? 'border-zinc-700' : 'border-zinc-300'}`}>R</kbd> ricomincia.
        </p>
      </section>

      {/* ── Trading Terminal ── */}
      <section className={`border-t ${d ? 'border-zinc-800' : 'border-zinc-300'}`}>

        {/* Desktop */}
        <div className="hidden md:flex flex-col">
          <div className="flex h-150">
            {/* Left: charts */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
              <div className="flex-1 min-h-0">
                <PriceChart trades={sim.trades} lastPrice={sim.lastPrice} isDark={isDark} defaultInterval="1s" />
              </div>
              <div className={`h-48 shrink-0 border-t ${d ? 'border-zinc-800' : 'border-zinc-300'}`}>
                <DepthChart bids={sim.bids} asks={sim.asks} isDark={isDark} />
              </div>
            </div>

            {/* Center: order book */}
            <div className={`w-86 shrink-0 border-l border-r ${d ? 'border-zinc-800' : 'border-zinc-300'}`}>
              <OrderBookView
                bids={sim.bids}
                asks={sim.asks}
                isDark={isDark}
                highlightedIds={sim.manipulatorOrderIds}
              />
            </div>

            {/* Right: controls */}
            <div className="w-72 shrink-0">
              <ManipulationControls
                currentScenario={sim.currentScenario}
                phases={sim.phases}
                currentPhaseIndex={sim.currentPhaseIndex}
                isPlaying={sim.isPlaying}
                speed={sim.speed}
                lastPrice={sim.lastPrice}
                vwap={sim.vwap}
                imbalance={sim.imbalance}
                trades={sim.trades}
                bids={sim.bids}
                asks={sim.asks}
                scenarioComplete={sim.scenarioComplete}
                markPrice={sim.markPrice}
                manipulatorAccount={sim.manipulatorAccount}
                startPrice={sim.startPrice}
                totalVolume={sim.totalVolume}
                selfTradeVolume={sim.selfTradeVolume}
                stepIndex={sim.stepIndex}
                totalSteps={sim.totalSteps}
                selectScenario={handleSelectScenario}
                play={sim.play}
                pause={sim.pause}
                stepForward={sim.stepForward}
                reset={sim.reset}
                setSpeed={sim.setSpeed}
                isDark={isDark}
              />
            </div>

            {/* Far right: trade history */}
            <div className={`w-56 shrink-0 border-l overflow-hidden ${d ? 'border-zinc-800' : 'border-zinc-300'}`}>
              <TradeHistory trades={sim.trades} isDark={isDark} markOwner="manipulator" markTone="amber" markLabel="Trade del manipolatore · W = wash trade" />
            </div>
          </div>

          {/* Event log full width */}
          <div className={`h-48 border-t ${d ? 'border-zinc-800' : 'border-zinc-300'}`}>
            <EventLog events={sim.events} isDark={isDark} />
          </div>
        </div>

        {/* Mobile */}
        <div className="flex flex-col md:hidden">
          <div className={`h-64 border-b ${d ? 'border-zinc-800' : 'border-zinc-300'}`}>
            <PriceChart trades={sim.trades} lastPrice={sim.lastPrice} isDark={isDark} defaultInterval="1s" />
          </div>
          <div className={`h-96 border-b ${d ? 'border-zinc-800' : 'border-zinc-300'}`}>
            <OrderBookView
              bids={sim.bids}
              asks={sim.asks}
              isDark={isDark}
              highlightedIds={sim.manipulatorOrderIds}
            />
          </div>
          <div className={`border-b ${d ? 'border-zinc-800' : 'border-zinc-300'}`}>
            <ManipulationControls
              currentScenario={sim.currentScenario}
              phases={sim.phases}
              currentPhaseIndex={sim.currentPhaseIndex}
              isPlaying={sim.isPlaying}
              speed={sim.speed}
              lastPrice={sim.lastPrice}
              vwap={sim.vwap}
              imbalance={sim.imbalance}
              trades={sim.trades}
              bids={sim.bids}
              asks={sim.asks}
              scenarioComplete={sim.scenarioComplete}
              markPrice={sim.markPrice}
              manipulatorAccount={sim.manipulatorAccount}
              startPrice={sim.startPrice}
              totalVolume={sim.totalVolume}
              selfTradeVolume={sim.selfTradeVolume}
              stepIndex={sim.stepIndex}
              totalSteps={sim.totalSteps}
              selectScenario={handleSelectScenario}
              play={sim.play}
              pause={sim.pause}
              stepForward={sim.stepForward}
              reset={sim.reset}
              setSpeed={sim.setSpeed}
              isDark={isDark}
            />
          </div>
          <div className={`h-48 border-b ${d ? 'border-zinc-800' : 'border-zinc-300'}`}>
            <EventLog events={sim.events} isDark={isDark} />
          </div>
          <div className={`border-t ${d ? 'border-zinc-800' : 'border-zinc-300'}`}>
            <TradeHistory trades={sim.trades} isDark={isDark} markOwner="manipulator" markTone="amber" markLabel="Trade del manipolatore · W = wash trade" />
          </div>
        </div>
      </section>

      {/* ── Sezione educativa ── */}
      <section
        aria-label="Informazioni sulla manipolazione di mercato"
        className={`border-t px-6 py-10 text-sm leading-relaxed ${d ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-600'}`}
      >
        <div className="max-w-4xl mx-auto space-y-8">

          <div>
            <h2 className={`text-base font-semibold mb-2 ${d ? 'text-zinc-200' : 'text-zinc-800'}`}>
              Cos&apos;è la manipolazione di mercato?
            </h2>
            <p>
              La <strong>manipolazione di mercato</strong> è qualsiasi azione volta ad alterare artificialmente
              il prezzo, il volume o la percezione di un asset finanziario, creando condizioni di mercato false
              o fuorvianti per trarne profitto. È illegale nella maggior parte delle giurisdizioni (MiFID II in Europa,
              Securities Exchange Act negli USA) e punita con pesanti sanzioni civili e penali.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">

            <div className={`rounded-xl border p-5 ${d ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${d ? 'text-amber-400' : 'text-amber-700'}`}>
                <span className="text-base">👻</span> Spoofing
              </h3>
              <p className={`text-xs leading-relaxed ${d ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Consiste nel piazzare grandi ordini limit <em>senza intenzione di eseguirli</em>, per creare
                una falsa impressione di domanda o offerta. Quando il prezzo si muove nella direzione desiderata,
                gli ordini vengono cancellati istantaneamente. Il manipolatore incassa la differenza di prezzo.
              </p>
            </div>

            <div className={`rounded-xl border p-5 ${d ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${d ? 'text-emerald-400' : 'text-emerald-700'}`}>
                <span className="text-base">📈</span> Pump &amp; Dump
              </h3>
              <p className={`text-xs leading-relaxed ${d ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Il manipolatore acquista silenziosamente a prezzi bassi, poi gonfia artificialmente il prezzo
                con acquisti aggressivi e spesso con campagne di comunicazione fuorvianti. Quando altri trader
                entrano attratti dal rialzo (FOMO), il manipolatore vende tutta la posizione al picco.
              </p>
            </div>

            <div className={`rounded-xl border p-5 ${d ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${d ? 'text-red-400' : 'text-red-700'}`}>
                <span className="text-base">🐻</span> Bear Raid
              </h3>
              <p className={`text-xs leading-relaxed ${d ? 'text-zinc-400' : 'text-zinc-600'}`}>
                L&apos;opposto del Pump &amp; Dump: il manipolatore vende aggressivamente per far crollare il prezzo,
                innescando panico e vendite a cascata da parte di altri trader. Poi riacquista a prezzi scontati
                prima che il mercato si riprenda.
              </p>
            </div>

            <div className={`rounded-xl border p-5 ${d ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${d ? 'text-blue-400' : 'text-blue-700'}`}>
                <span className="text-base">🔄</span> Wash Trading
              </h3>
              <p className={`text-xs leading-relaxed ${d ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Il manipolatore compra e vende lo stesso asset a sé stesso (o tra entità collegate), generando
                volume fittizio. Questo crea l&apos;illusione di un mercato attivo e liquido, attirando altri trader
                ingenui. Particolarmente diffuso nel mercato delle criptovalute non regolamentate.
              </p>
            </div>

            <div className={`rounded-xl border p-5 md:col-span-2 ${d ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${d ? 'text-purple-400' : 'text-purple-700'}`}>
                <span className="text-base">📊</span> Layering
              </h3>
              <p className={`text-xs leading-relaxed ${d ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Simile allo spoofing ma più sofisticato: il manipolatore piazza <em>multipli strati</em> di ordini
                a prezzi progressivi su un lato del book, creando l&apos;illusione di un muro di resistenza o supporto.
                Questo spinge altri trader a operare nella direzione voluta, consentendo al manipolatore di entrare
                sul lato opposto prima di cancellare i layer.
              </p>
            </div>
          </div>

          <div className={`rounded-xl border p-5 ${d ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
            <h3 className={`text-sm font-bold mb-2 ${d ? 'text-zinc-200' : 'text-zinc-800'}`}>
              Come riconoscere la manipolazione
            </h3>
            <ul className={`text-xs space-y-1.5 leading-relaxed ${d ? 'text-zinc-400' : 'text-zinc-600'}`}>
              <li><strong className={d ? 'text-zinc-300' : 'text-zinc-700'}>Ordini grandi che scompaiono:</strong> grandi order limit che appaiono e spariscono rapidamente senza eseguirsi sono un segnale di spoofing.</li>
              <li><strong className={d ? 'text-zinc-300' : 'text-zinc-700'}>Volume anomalo:</strong> picchi di volume improvvisi non giustificati da notizie reali possono indicare wash trading o pump.</li>
              <li><strong className={d ? 'text-zinc-300' : 'text-zinc-700'}>Imbalance estremo:</strong> un order book fortemente sbilanciato su un lato senza fondamentale può segnalare layering.</li>
              <li><strong className={d ? 'text-zinc-300' : 'text-zinc-700'}>Movimenti di prezzo a V:</strong> rialzi o ribassi rapidi seguiti da un immediato ritorno ai livelli precedenti sono tipici di spoofing e bear raid.</li>
            </ul>
          </div>

          <div className={`text-xs ${d ? 'text-zinc-600' : 'text-zinc-400'}`}>
            <strong className={d ? 'text-zinc-500' : 'text-zinc-500'}>Riferimenti normativi:</strong>{' '}
            Regolamento UE 596/2014 (MAR), MiFID II (Direttiva 2014/65/UE), Securities Exchange Act (USA, 1934),
            CONSOB Regolamento n. 20307/2018.
          </div>
        </div>
      </section>

      {/* ── Disclaimer ── */}
      {showDisclaimer && (
        <div className={`fixed bottom-0 left-0 right-0 z-40 border-t px-6 py-4 shadow-lg backdrop-blur-md
          ${d ? 'border-zinc-700 bg-amber-950/80' : 'border-zinc-300 bg-amber-50/95'}`}>
          <div className={`max-w-4xl mx-auto flex items-start gap-3 text-xs leading-relaxed ${d ? 'text-amber-200/80' : 'text-amber-800'}`}>
            <AlertTriangle size={18} className={`shrink-0 mt-0.5 ${d ? 'text-amber-400' : 'text-amber-600'}`} />
            <p className="flex-1">
              <strong className={d ? 'text-amber-300' : 'text-amber-900'}>Avvertenza:</strong>{' '}
              Questo simulatore ha finalità esclusivamente didattiche. Le tecniche mostrate costituiscono
              manipolazione di mercato e sono <strong>illegali</strong> nei mercati regolamentati.
              Non costituisce consulenza finanziaria né sollecitazione all&apos;investimento.
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

      {/* Toast */}
      {toast && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className={`pointer-events-auto mt-4 flex items-center gap-3 px-6 py-4 rounded-xl text-sm font-semibold shadow-2xl border backdrop-blur-md
            ${toastExiting ? 'toast-exit' : 'toast-enter'}
            ${d ? 'bg-amber-950/80 border-amber-500/50 text-amber-200' : 'bg-amber-50/90 border-amber-400 text-amber-800'}`}>
            <span>{toast}</span>
            <button onClick={dismissToast} className={`ml-2 rounded-full p-0.5 transition-colors ${d ? 'hover:bg-amber-800/50' : 'hover:bg-amber-200'}`}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
