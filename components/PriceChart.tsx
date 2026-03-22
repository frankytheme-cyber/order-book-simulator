'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { Trade } from '@/lib/engine';

interface Props {
  trades: Trade[];
  lastPrice: number | null;
  isDark: boolean;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

// Interval options in ms
const INTERVALS: { label: string; ms: number }[] = [
  { label: '5s',  ms: 5_000 },
  { label: '15s', ms: 15_000 },
  { label: '30s', ms: 30_000 },
  { label: '1m',  ms: 60_000 },
  { label: '5m',  ms: 300_000 },
];

interface Candle {
  ts: number; // open time of candle
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function buildCandles(trades: Trade[], intervalMs: number): Candle[] {
  if (trades.length === 0) return [];

  const now = trades[trades.length - 1].timestamp;
  const cutoff = now - ONE_HOUR_MS;
  const filtered = trades.filter((t) => t.timestamp >= cutoff);
  if (filtered.length === 0) return [];

  const map = new Map<number, Candle>();

  for (const t of filtered) {
    const key = Math.floor(t.timestamp / intervalMs) * intervalMs;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ts: key, open: t.price, high: t.price, low: t.price, close: t.price, volume: t.quantity });
    } else {
      existing.high   = Math.max(existing.high, t.price);
      existing.low    = Math.min(existing.low, t.price);
      existing.close  = t.price;
      existing.volume += t.quantity;
    }
  }

  return Array.from(map.values()).sort((a, b) => a.ts - b.ts);
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export default function PriceChart({ trades, lastPrice, isDark }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize]         = useState({ w: 800, h: 400 });
  const [intervalIdx, setIntervalIdx] = useState(0); // default 5s

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: Math.max(width, 1), h: Math.max(height, 1) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const d = isDark;
  const { w, h } = size;
  const PAD = { top: 40, right: 68, bottom: 36, left: 12 };
  const chartW = w - PAD.left - PAD.right;
  const chartH = h - PAD.top - PAD.bottom;

  const intervalMs = INTERVALS[intervalIdx].ms;

  const candles = useMemo(
    () => buildCandles(trades, intervalMs),
    [trades, intervalMs]
  );

  const chart = useMemo(() => {
    if (candles.length < 1) return null;

    const allPrices = candles.flatMap((c) => [c.high, c.low]);
    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const range = maxP - minP || minP * 0.001 || 1;
    const pad = range * 0.15;
    const lo = minP - pad;
    const hi = maxP + pad;

    const toY = (p: number) => PAD.top + chartH - ((p - lo) / (hi - lo)) * chartH;

    // Fixed slot width, candles packed from the right
    const slotW = Math.min(chartW / candles.length, 16);
    const candleWidth = Math.max(2, slotW * 0.6);
    const offsetX = PAD.left + chartW - candles.length * slotW;
    const toX = (i: number) => offsetX + i * slotW + slotW / 2;

    // Y ticks
    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const val = lo + (i / 4) * (hi - lo);
      return { y: toY(val), label: val.toFixed(2) };
    });

    // X ticks: up to 5 evenly spaced candle indices
    const nXTicks = Math.min(5, candles.length);
    const xTicks = Array.from({ length: nXTicks }, (_, i) => {
      const idx = Math.round((i / (nXTicks - 1 || 1)) * (candles.length - 1));
      return { x: toX(idx), label: formatTime(candles[idx].ts) };
    });

    // Last price line
    const lastY = lastPrice !== null ? toY(lastPrice) : null;

    return { candles, toX, toY, candleWidth, yTicks, xTicks, lastY, intervalMs };
  }, [candles, chartW, chartH, lastPrice, intervalMs, PAD.left, PAD.top]);

  const bullColor  = d ? '#34d399' : '#059669';
  const bearColor  = d ? '#f87171' : '#dc2626';
  const gridColor  = d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const tickColor  = d ? '#52525b' : '#a1a1aa';
  const lastColor  = d ? '#facc15' : '#d97706';
  const bg         = d ? '#09090b' : '#f9fafb';

  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;
  const firstClose = candles.length > 0 ? candles[0].open : null;
  const priceChange = lastCandle && firstClose ? lastCandle.close - firstClose : null;
  const changeSign  = priceChange !== null && priceChange >= 0 ? '+' : '';
  const changeColor = priceChange === null ? (d ? 'text-zinc-400' : 'text-zinc-500')
    : priceChange >= 0 ? (d ? 'text-emerald-400' : 'text-emerald-600')
    : (d ? 'text-red-400' : 'text-red-500');

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ background: bg }}>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 pt-2.5 pointer-events-none">
        {lastPrice !== null && (
          <>
            <span className={`text-lg font-bold tabular-nums ${d ? 'text-white' : 'text-zinc-900'}`}>
              {lastPrice.toFixed(2)}
            </span>
            {priceChange !== null && firstClose && (
              <span className={`text-xs font-bold tabular-nums ${changeColor}`}>
                {changeSign}{priceChange.toFixed(2)}
                {' '}({changeSign}{((priceChange / firstClose) * 100).toFixed(2)}%)
              </span>
            )}
            <span className={`text-[10px] font-bold uppercase tracking-widest ${d ? 'text-zinc-600' : 'text-zinc-400'}`}>
              1h
            </span>
          </>
        )}
      </div>

      {/* Interval selector */}
      <div className="absolute top-2 right-20 z-10 flex items-center gap-0.5">
        {INTERVALS.map((iv, i) => (
          <button
            key={iv.label}
            onClick={() => setIntervalIdx(i)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors
              ${i === intervalIdx
                ? (d ? 'bg-zinc-700 text-white' : 'bg-zinc-200 text-zinc-900')
                : (d ? 'text-zinc-600 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700')
              }`}
          >
            {iv.label}
          </button>
        ))}
      </div>

      {candles.length < 1 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xs font-medium ${d ? 'text-zinc-600' : 'text-zinc-400'}`}>
            In attesa di dati…
          </span>
        </div>
      ) : (
        <svg width={w} height={h} className="absolute inset-0">
          <defs>
            <clipPath id="candle-clip">
              <rect x={PAD.left} y={PAD.top} width={chartW} height={chartH} />
            </clipPath>
          </defs>

          {/* Horizontal grid */}
          {chart?.yTicks.map((t, i) => (
            <line key={i}
              x1={PAD.left} y1={t.y} x2={w - PAD.right} y2={t.y}
              stroke={gridColor} strokeWidth={1}
            />
          ))}

          {/* Vertical grid */}
          {chart?.xTicks.map((t, i) => (
            <line key={i}
              x1={t.x} y1={PAD.top} x2={t.x} y2={PAD.top + chartH}
              stroke={gridColor} strokeWidth={1}
            />
          ))}

          {/* Candles */}
          <g clipPath="url(#candle-clip)">
            {chart && chart.candles.map((c, i) => {
              const isBull  = c.close >= c.open;
              const color   = isBull ? bullColor : bearColor;
              const cx      = chart.toX(i);
              const bodyTop = chart.toY(Math.max(c.open, c.close));
              const bodyBot = chart.toY(Math.min(c.open, c.close));
              const bodyH   = Math.max(1, bodyBot - bodyTop);
              const wickTop = chart.toY(c.high);
              const wickBot = chart.toY(c.low);
              const hw      = chart.candleWidth / 2;

              return (
                <g key={i}>
                  {/* Wick */}
                  <line x1={cx} y1={wickTop} x2={cx} y2={wickBot} stroke={color} strokeWidth={1} />
                  {/* Body */}
                  <rect
                    x={cx - hw} y={bodyTop}
                    width={chart.candleWidth} height={bodyH}
                    fill={isBull ? color : color}
                    opacity={isBull ? 1 : 0.85}
                    rx={0.5}
                  />
                </g>
              );
            })}
          </g>

          {/* Last price dashed line */}
          {chart?.lastY !== null && chart?.lastY !== undefined && (
            <>
              <line
                x1={PAD.left} y1={chart.lastY}
                x2={w - PAD.right} y2={chart.lastY}
                stroke={lastColor} strokeWidth={1} strokeDasharray="4 3"
              />
              <rect
                x={w - PAD.right + 2} y={chart.lastY - 9}
                width={PAD.right - 4} height={18} rx={3}
                fill={lastColor}
              />
              <text
                x={w - PAD.right / 2 + 2} y={chart.lastY + 4}
                textAnchor="middle" fontSize={10} fontWeight="700"
                fill="#09090b"
              >
                {lastPrice?.toFixed(2)}
              </text>
            </>
          )}

          {/* Y labels */}
          {chart?.yTicks.map((t, i) => (
            <text key={i}
              x={w - PAD.right + 5} y={t.y + 3.5}
              fontSize={9} fill={tickColor} fontFamily="monospace"
            >
              {t.label}
            </text>
          ))}

          {/* X labels */}
          {chart?.xTicks.map((t, i) => (
            <text key={i}
              x={t.x} y={h - 8}
              fontSize={9} fill={tickColor} textAnchor="middle" fontFamily="monospace"
            >
              {t.label}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}
