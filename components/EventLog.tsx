'use client';

import { useEffect, useRef } from 'react';
import { ManipulationEvent } from '@/hooks/useManipulationSimulator';

interface Props {
  events: ManipulationEvent[];
  isDark: boolean;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  const s = d.getSeconds().toString().padStart(2, '0');
  const ms = d.getMilliseconds().toString().padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

function EventIcon({ highlight, isDark }: { highlight?: string; isDark: boolean }) {
  const d = isDark;
  if (highlight === 'buy')
    return <span className={`shrink-0 text-[10px] font-bold ${d ? 'text-emerald-400' : 'text-emerald-600'}`}>▲</span>;
  if (highlight === 'sell')
    return <span className={`shrink-0 text-[10px] font-bold ${d ? 'text-red-400' : 'text-red-600'}`}>▼</span>;
  if (highlight === 'cancel')
    return <span className={`shrink-0 text-[10px] font-bold ${d ? 'text-amber-400' : 'text-amber-600'}`}>✕</span>;
  if (highlight === 'warning')
    return <span className={`shrink-0 text-[10px] font-bold ${d ? 'text-amber-300' : 'text-amber-500'}`}>!</span>;
  return <span className={`shrink-0 text-[10px] ${d ? 'text-zinc-600' : 'text-zinc-400'}`}>·</span>;
}

function borderColor(highlight?: string, isDark?: boolean): string {
  const d = isDark;
  if (highlight === 'buy') return d ? 'border-l-2 border-emerald-500/60' : 'border-l-2 border-emerald-400';
  if (highlight === 'sell') return d ? 'border-l-2 border-red-500/60' : 'border-l-2 border-red-400';
  if (highlight === 'cancel') return d ? 'border-l-2 border-amber-500/70' : 'border-l-2 border-amber-400';
  if (highlight === 'warning') return d ? 'border-l-2 border-amber-400/50' : 'border-l-2 border-amber-300';
  return 'border-l-2 border-transparent';
}

export default function EventLog({ events, isDark }: Props) {
  const d = isDark;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [events]);

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 ${d ? 'bg-zinc-950' : 'bg-zinc-50'}`}>

      {/* Header */}
      <div className={`px-4 py-2.5 border-b shrink-0 flex items-center justify-between
        ${d ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold tracking-widest uppercase ${d ? 'text-zinc-300' : 'text-zinc-600'}`}>
            Log eventi
          </span>
          {events.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums
              ${d ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-500'}`}>
              {events.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest">
          <span className={d ? 'text-emerald-500' : 'text-emerald-600'}>▲ Manipolatore buy</span>
          <span className={d ? 'text-red-500' : 'text-red-600'}>▼ Sell</span>
          <span className={d ? 'text-amber-400' : 'text-amber-600'}>✕ Cancella</span>
          <span className={d ? 'text-amber-300' : 'text-amber-500'}>! Reazione mercato</span>
        </div>
      </div>

      {/* Events */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-1 font-mono">
        {events.length === 0 ? (
          <div className={`flex items-center justify-center h-full text-xs ${d ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Seleziona uno scenario e avvia la simulazione per vedere gli eventi
          </div>
        ) : (
          <>
            {events.map((ev) => {
              const isPhaseChange = ev.type === 'phase-change';

              if (isPhaseChange) {
                return (
                  <div key={ev.id} className={`my-2 flex items-center gap-2 ${d ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    <div className={`flex-1 h-px ${d ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2
                      ${d ? 'text-amber-400' : 'text-amber-600'}`}>
                      {ev.description}
                    </span>
                    <div className={`flex-1 h-px ${d ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                  </div>
                );
              }

              return (
                <div
                  key={ev.id}
                  className={`flex items-start gap-2 px-2 py-0.5 rounded-sm mb-0.5 text-[11px] leading-relaxed
                    ${borderColor(ev.highlight, isDark)}
                    ${d ? 'hover:bg-zinc-900' : 'hover:bg-zinc-100'}`}
                >
                  <span className={`shrink-0 text-[9px] tabular-nums mt-0.5 ${d ? 'text-zinc-600' : 'text-zinc-400'}`}>
                    {formatTime(ev.timestamp)}
                  </span>
                  <EventIcon highlight={ev.highlight} isDark={isDark} />
                  <span className={
                    ev.type === 'manipulator'
                      ? (d ? 'text-zinc-200' : 'text-zinc-800')
                      : ev.type === 'market'
                      ? (d ? 'text-amber-300/90' : 'text-amber-700')
                      : (d ? 'text-zinc-400' : 'text-zinc-500')
                  }>
                    {ev.description}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
