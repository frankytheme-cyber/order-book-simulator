'use client';

import {
  Play, Pause, SkipForward, RotateCcw, EyeOff, TrendingUp,
  TrendingDown, Repeat, Layers, ChevronRight, BookOpen, Skull,
} from 'lucide-react';
import { accountPnl } from '@/lib/engine';
import {
  ManipulationSimulatorState,
  ManipulationType,
} from '@/hooks/useManipulationSimulator';
import Tooltip from './Tooltip';

type Props = Pick<
  ManipulationSimulatorState,
  | 'currentScenario' | 'phases' | 'currentPhaseIndex' | 'isPlaying'
  | 'speed' | 'lastPrice' | 'vwap' | 'imbalance' | 'trades' | 'bids' | 'asks'
  | 'scenarioComplete'
  | 'markPrice' | 'manipulatorAccount' | 'startPrice' | 'totalVolume' | 'selfTradeVolume'
  | 'stepIndex' | 'totalSteps'
  | 'selectScenario' | 'play' | 'pause' | 'stepForward' | 'reset' | 'setSpeed'
> & { isDark: boolean };

const SCENARIOS: {
  type: ManipulationType;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  tagline: string;
  color: string;
}[] = [
  {
    type: 'spoofing',
    label: 'Spoofing',
    shortLabel: 'Spoofing',
    icon: <EyeOff size={14} />,
    tagline: 'Ordini fake per muovere il prezzo',
    color: 'amber',
  },
  {
    type: 'pump-and-dump',
    label: 'Pump & Dump',
    shortLabel: 'Pump',
    icon: <TrendingUp size={14} />,
    tagline: 'Gonfia il prezzo, poi scarica',
    color: 'emerald',
  },
  {
    type: 'bear-raid',
    label: 'Bear Raid',
    shortLabel: 'Bear Raid',
    icon: <TrendingDown size={14} />,
    tagline: 'Crolla il prezzo, ricompra basso',
    color: 'red',
  },
  {
    type: 'wash-trading',
    label: 'Wash Trading',
    shortLabel: 'Wash',
    icon: <Repeat size={14} />,
    tagline: 'Volume artificiale per attirare trader',
    color: 'blue',
  },
  {
    type: 'layering',
    label: 'Layering',
    shortLabel: 'Layering',
    icon: <Layers size={14} />,
    tagline: 'Muri di ordini per pressione direzionale',
    color: 'purple',
  },
];

const COLOR_MAP: Record<string, { active: string; inactive: string; border: string }> = {
  amber: {
    active: 'bg-amber-600 text-white border-amber-500',
    inactive: 'text-amber-400 border-amber-500/30 hover:border-amber-500/60 hover:text-amber-300',
    border: 'border-amber-500/40',
  },
  emerald: {
    active: 'bg-emerald-600 text-white border-emerald-500',
    inactive: 'text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 hover:text-emerald-300',
    border: 'border-emerald-500/40',
  },
  red: {
    active: 'bg-red-600 text-white border-red-500',
    inactive: 'text-red-400 border-red-500/30 hover:border-red-500/60 hover:text-red-300',
    border: 'border-red-500/40',
  },
  blue: {
    active: 'bg-blue-600 text-white border-blue-500',
    inactive: 'text-blue-400 border-blue-500/30 hover:border-blue-500/60 hover:text-blue-300',
    border: 'border-blue-500/40',
  },
  purple: {
    active: 'bg-purple-600 text-white border-purple-500',
    inactive: 'text-purple-400 border-purple-500/30 hover:border-purple-500/60 hover:text-purple-300',
    border: 'border-purple-500/40',
  },
};

function lightActiveBtn(color: string): string {
  const map: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-800 border-amber-400',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-400',
    red: 'bg-red-100 text-red-800 border-red-400',
    blue: 'bg-blue-100 text-blue-800 border-blue-400',
    purple: 'bg-purple-100 text-purple-800 border-purple-400',
  };
  return map[color] ?? map.amber;
}

function lightInactiveBtn(color: string): string {
  const map: Record<string, string> = {
    amber: 'text-amber-600 border-amber-300 hover:border-amber-500',
    emerald: 'text-emerald-600 border-emerald-300 hover:border-emerald-500',
    red: 'text-red-600 border-red-300 hover:border-red-500',
    blue: 'text-blue-600 border-blue-300 hover:border-blue-500',
    purple: 'text-purple-600 border-purple-300 hover:border-purple-500',
  };
  return map[color] ?? map.amber;
}

export default function ManipulationControls({
  currentScenario, phases, currentPhaseIndex, isPlaying,
  speed, lastPrice, vwap, imbalance, trades, bids, asks,
  scenarioComplete,
  markPrice, manipulatorAccount, startPrice, totalVolume, selfTradeVolume,
  stepIndex, totalSteps,
  selectScenario, play, pause, stepForward, reset, setSpeed,
  isDark,
}: Props) {
  const d = isDark;
  const currentPhase = phases[currentPhaseIndex] ?? null;

  const spread = bids[0] && asks[0]
    ? (asks[0].price - bids[0].price).toFixed(2)
    : '—';

  const totalPhases = phases.length;
  const pnl = accountPnl(manipulatorAccount, markPrice);
  const washPct = totalVolume > 0 ? (selfTradeVolume / totalVolume) * 100 : 0;
  const priceChange = startPrice !== null && markPrice !== null ? markPrice - startPrice : null;
  const isWash = currentScenario === 'wash-trading';
  const signed = (v: number, digits = 2) => `${v >= 0 ? '+' : ''}${v.toFixed(digits)}`;
  const tone = (v: number) => v > 0.005 ? (d ? 'text-emerald-400' : 'text-emerald-600')
    : v < -0.005 ? (d ? 'text-red-400' : 'text-red-600') : (d ? 'text-zinc-300' : 'text-zinc-700');

  return (
    <div className={`flex flex-col h-full overflow-y-auto transition-colors duration-300
      ${d ? 'bg-zinc-900' : 'bg-white'}`}>

      {/* Header */}
      <div className={`px-4 py-2.5 border-b shrink-0 ${d ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <span className={`text-xs font-bold tracking-widest uppercase ${d ? 'text-zinc-300' : 'text-zinc-600'}`}>
          Scenario
        </span>
      </div>

      <div className="flex flex-col gap-4 p-4">

        {/* Scenario selector */}
        <div className="flex flex-col gap-1.5">
          {SCENARIOS.map((sc) => {
            const isActive = currentScenario === sc.type;
            const colors = COLOR_MAP[sc.color];
            return (
              <button
                key={sc.type}
                onClick={() => selectScenario(sc.type)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-colors text-xs font-medium
                  ${isActive
                    ? (d ? colors.active : lightActiveBtn(sc.color))
                    : (d
                      ? `bg-zinc-800/60 ${colors.inactive}`
                      : `bg-zinc-50 ${lightInactiveBtn(sc.color)}`)
                  }`}
              >
                <span className="shrink-0">{sc.icon}</span>
                <span className="font-bold">{sc.label}</span>
                {!isActive && (
                  <span className={`text-[10px] ${d ? 'text-zinc-500' : 'text-zinc-400'} ml-auto truncate`}>
                    {sc.tagline}
                  </span>
                )}
                {isActive && (
                  <ChevronRight size={12} className="ml-auto shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Playback controls */}
        {currentScenario && (
          <>
            <div className={`h-px ${d ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

            {/* Phase progress */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  Progressione
                </span>
                <span className={`text-[10px] tabular-nums font-bold ${d ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Fase {currentPhaseIndex + 1}/{totalPhases} · passo {stepIndex}/{totalSteps}
                </span>
              </div>
              <div className={`flex gap-1`}>
                {phases.map((ph, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1 rounded-full transition-colors duration-300
                      ${i < currentPhaseIndex
                        ? (d ? 'bg-amber-500' : 'bg-amber-500')
                        : i === currentPhaseIndex
                        ? (d ? 'bg-amber-400' : 'bg-amber-400')
                        : (d ? 'bg-zinc-700' : 'bg-zinc-300')
                      }`}
                  />
                ))}
              </div>
            </div>

            {/* Play/Pause/Step/Reset */}
            <div className="flex gap-2">
              <button
                onClick={isPlaying ? pause : play}
                disabled={scenarioComplete}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition-colors
                  ${scenarioComplete
                    ? (d ? 'bg-zinc-800 border-zinc-700 text-zinc-600 cursor-not-allowed' : 'bg-zinc-100 border-zinc-300 text-zinc-400 cursor-not-allowed')
                    : isPlaying
                    ? (d ? 'bg-amber-600 border-amber-500 text-white hover:bg-amber-500' : 'bg-amber-500 border-amber-400 text-white hover:bg-amber-600')
                    : (d ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30' : 'bg-amber-50 border-amber-400 text-amber-700 hover:bg-amber-100')
                  }`}
              >
                {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                {isPlaying ? 'Pausa' : scenarioComplete ? 'Fine' : 'Avvia'}
              </button>

              <button
                onClick={stepForward}
                disabled={scenarioComplete || isPlaying}
                title="Avanza di un passo"
                className={`px-3 py-2 rounded-lg border text-xs font-bold transition-colors
                  ${scenarioComplete || isPlaying
                    ? (d ? 'bg-zinc-800 border-zinc-700 text-zinc-600 cursor-not-allowed' : 'bg-zinc-100 border-zinc-300 text-zinc-400 cursor-not-allowed')
                    : (d ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900')
                  }`}
              >
                <SkipForward size={13} />
              </button>

              <button
                onClick={reset}
                title="Ricomincia scenario"
                className={`px-3 py-2 rounded-lg border text-xs font-bold transition-colors
                  ${d ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500' : 'bg-zinc-50 border-zinc-300 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400'}`}
              >
                <RotateCcw size={13} />
              </button>
            </div>

            {/* Speed slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  Velocità
                </span>
                <span className={`text-[10px] tabular-nums ${d ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {speed}ms / step
                </span>
              </div>
              <input
                type="range"
                min={200}
                max={2000}
                step={100}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className={`w-full h-1 rounded-full appearance-none cursor-pointer
                  ${d ? 'accent-amber-400' : 'accent-amber-500'}`}
              />
              <div className={`flex justify-between text-[9px] mt-0.5 ${d ? 'text-zinc-600' : 'text-zinc-400'}`}>
                <span>Veloce</span>
                <span>Lento</span>
              </div>
            </div>

            {/* Current phase explanation */}
            {currentPhase && (
              <div className={`rounded-xl border p-3 space-y-2
                ${d ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
                <div className="flex items-start gap-2">
                  <BookOpen size={12} className={`shrink-0 mt-0.5 ${d ? 'text-amber-400' : 'text-amber-600'}`} />
                  <div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest mb-1
                      ${d ? 'text-amber-400' : 'text-amber-600'}`}>
                      {currentPhase.name}
                    </div>
                    <p className={`text-[11px] leading-relaxed ${d ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      {currentPhase.description}
                    </p>
                  </div>
                </div>
                <div className={`rounded-lg px-2.5 py-2 text-[10px] leading-relaxed
                  ${d ? 'bg-zinc-900/60 border border-zinc-700/50 text-zinc-400' : 'bg-white border border-zinc-200 text-zinc-500'}`}>
                  <span className={`font-bold ${d ? 'text-zinc-300' : 'text-zinc-600'}`}>Osserva: </span>
                  {currentPhase.watchFor}
                </div>
              </div>
            )}

            {/* Bilancio del manipolatore */}
            <div className={`rounded-xl border p-3 space-y-1.5
              ${d ? 'bg-zinc-950 border-amber-500/30' : 'bg-amber-50/50 border-amber-200'}`}>
              <div className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${d ? 'text-amber-400' : 'text-amber-700'}`}>
                <Skull size={11} /> Bilancio manipolatore
                <Tooltip
                  isDark={isDark}
                  content="Posizione e profitto del manipolatore, calcolati sui suoi trade reali con il metodo del costo medio. Il P&L aperto è valutato al mid price. Il suo guadagno è la perdita degli altri partecipanti."
                  side="top"
                />
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
                <span className={d ? 'text-zinc-500' : 'text-zinc-500'}>Posizione</span>
                <span className={`text-right font-bold tabular-nums ${d ? 'text-zinc-200' : 'text-zinc-800'}`}>
                  {manipulatorAccount.position > 0 ? `Long ${manipulatorAccount.position}` : manipulatorAccount.position < 0 ? `Short ${-manipulatorAccount.position}` : 'Flat'}
                  {manipulatorAccount.position !== 0 && <span className={d ? 'text-zinc-500' : 'text-zinc-400'}> @ {manipulatorAccount.avgPrice.toFixed(2)}</span>}
                </span>
                <span className={d ? 'text-zinc-500' : 'text-zinc-500'}>P&amp;L realizzato</span>
                <span className={`text-right font-bold tabular-nums ${tone(pnl.realized)}`}>{signed(pnl.realized)}</span>
                <span className={d ? 'text-zinc-500' : 'text-zinc-500'}>P&amp;L aperto</span>
                <span className={`text-right font-bold tabular-nums ${tone(pnl.unrealized)}`}>{signed(pnl.unrealized)}</span>
                <span className={`font-semibold ${d ? 'text-zinc-300' : 'text-zinc-700'}`}>Totale</span>
                <span className={`text-right font-bold tabular-nums ${tone(pnl.total)}`}>{signed(pnl.total)}</span>
                {priceChange !== null && startPrice && (
                  <>
                    <span className={d ? 'text-zinc-500' : 'text-zinc-500'}>Prezzo da inizio</span>
                    <span className={`text-right font-bold tabular-nums ${tone(priceChange)}`}>
                      {signed(priceChange)} ({signed((priceChange / startPrice) * 100)}%)
                    </span>
                  </>
                )}
                <span className={d ? 'text-zinc-500' : 'text-zinc-500'}>Volume fittizio</span>
                <span className={`text-right font-bold tabular-nums ${washPct > 0 ? (d ? 'text-amber-400' : 'text-amber-600') : (d ? 'text-zinc-300' : 'text-zinc-700')}`}>
                  {washPct.toFixed(0)}%
                </span>
              </div>
              {washPct > 0 && (
                <div className={`h-1.5 rounded-full overflow-hidden ${d ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                  <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${washPct.toFixed(1)}%` }} />
                </div>
              )}
            </div>

            {/* Scenario complete banner */}
            {scenarioComplete && (
              <div className={`rounded-xl border p-3 text-center
                ${d ? 'bg-emerald-950/40 border-emerald-700/50' : 'bg-emerald-50 border-emerald-300'}`}>
                <div className={`text-xs font-bold mb-1 ${d ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  Scenario completato ✓
                </div>
                <p className={`text-[11px] mb-1.5 ${d ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {isWash
                    ? <>Il <strong>{washPct.toFixed(0)}%</strong> del volume scambiato era fittizio: il manipolatore ha comprato e venduto a sé stesso.</>
                    : pnl.total > 0
                    ? <>Il manipolatore ha chiuso con <strong className={tone(pnl.total)}>{signed(pnl.total)}</strong>: è il denaro perso dagli altri partecipanti.</>
                    : <>Questa volta il manipolatore ha chiuso con <strong className={tone(pnl.total)}>{signed(pnl.total)}</strong>: la manipolazione è anche rischiosa. Riprova con ↺.</>}
                </p>
                <p className={`text-[10px] ${d ? 'text-emerald-300/70' : 'text-emerald-600'}`}>
                  Seleziona un altro scenario o premi <span className="font-bold">↺</span> per ripetere.
                </p>
              </div>
            )}
          </>
        )}

        {/* Stats */}
        <div className={`h-px ${d ? 'bg-zinc-800' : 'bg-zinc-200'}`} />

        <div className="space-y-2">
          {[
            {
              label: 'Ultimo prezzo',
              value: lastPrice != null ? `$${lastPrice.toFixed(2)}` : '—',
              tooltip: 'Prezzo dell\'ultimo trade eseguito.',
            },
            {
              label: 'VWAP',
              value: vwap != null ? `$${vwap.toFixed(2)}` : '—',
              tooltip: 'Volume Weighted Average Price — prezzo medio ponderato per volume.',
            },
            {
              label: 'Spread',
              value: spread,
              tooltip: 'Best Ask − Best Bid. Costo implicito di un market order.',
            },
            {
              label: 'Trade totali',
              value: trades.length.toLocaleString(),
              tooltip: 'Numero di trade eseguiti dall\'inizio dello scenario.',
            },
          ].map(({ label, value, tooltip }) => (
            <div key={label} className="flex items-center justify-between">
              <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest
                ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>
                {label}
                <Tooltip isDark={isDark} content={tooltip} side="top" />
              </span>
              <span className={`text-sm font-bold tabular-nums ${d ? 'text-zinc-100' : 'text-zinc-900'}`}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Imbalance bar */}
        {imbalance != null && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${d ? 'text-zinc-500' : 'text-zinc-500'}`}>
                Imbalance
                <span className="ml-1 inline-block">
                  <Tooltip isDark={isDark} content="Rapporto bid/ask in volume. >50% = pressione buy, <50% = pressione sell." side="top" />
                </span>
              </span>
            </div>
            <div className={`flex h-2 rounded-full overflow-hidden ${d ? 'bg-zinc-700' : 'bg-zinc-200'}`}>
              <div
                className="bg-emerald-500 transition-all duration-300"
                style={{ width: `${(imbalance * 100).toFixed(1)}%` }}
              />
              <div
                className="bg-red-500 transition-all duration-300"
                style={{ width: `${((1 - imbalance) * 100).toFixed(1)}%` }}
              />
            </div>
            <div className={`flex justify-between text-[9px] font-bold mt-0.5 ${d ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <span className={d ? 'text-emerald-500' : 'text-emerald-600'}>
                BID {(imbalance * 100).toFixed(0)}%
              </span>
              <span className={d ? 'text-red-500' : 'text-red-600'}>
                ASK {((1 - imbalance) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
