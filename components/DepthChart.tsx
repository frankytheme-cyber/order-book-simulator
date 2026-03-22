'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { Order } from '@/lib/engine';

interface Props {
  bids: Order[];
  asks: Order[];
  isDark: boolean;
}

export default function DepthChart({ bids, asks, isDark }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 400, h: 200 });

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
  const PAD = { top: 20, right: 10, bottom: 28, left: 10 };
  const chartW = w - PAD.left - PAD.right;
  const chartH = h - PAD.top - PAD.bottom;

  const chart = useMemo(() => {
    if (bids.length === 0 && asks.length === 0) return null;

    const bestBid = bids[0]?.price ?? 0;
    const bestAsk = asks[0]?.price ?? 0;
    const mid = (bestBid + bestAsk) / 2 || bestBid || bestAsk;

    // Limit depth to ±2% from mid
    const range = mid * 0.02;
    const minP = mid - range;
    const maxP = mid + range;

    // Build cumulative bid curve (sorted desc by price, so we walk from best bid downward)
    const bidPoints: { price: number; cumVol: number }[] = [];
    let cumBid = 0;
    for (const o of bids) {
      if (o.price < minP) break;
      cumBid += o.quantity;
      bidPoints.push({ price: o.price, cumVol: cumBid });
    }

    // Build cumulative ask curve (sorted asc by price, walk from best ask upward)
    const askPoints: { price: number; cumVol: number }[] = [];
    let cumAsk = 0;
    for (const o of asks) {
      if (o.price > maxP) break;
      cumAsk += o.quantity;
      askPoints.push({ price: o.price, cumVol: cumAsk });
    }

    const maxVol = Math.max(
      bidPoints.length > 0 ? bidPoints[bidPoints.length - 1].cumVol : 0,
      askPoints.length > 0 ? askPoints[askPoints.length - 1].cumVol : 0,
      1,
    );

    const toX = (price: number) => PAD.left + ((price - minP) / (maxP - minP)) * chartW;
    const toY = (vol: number) => PAD.top + chartH - (vol / maxVol) * chartH;

    // Stepline path for bids (right to left: best bid is rightmost)
    let bidPath = '';
    if (bidPoints.length > 0) {
      // Start at bottom-right of best bid
      bidPath = `M ${toX(bestBid)} ${PAD.top + chartH}`;
      for (const pt of bidPoints) {
        bidPath += ` L ${toX(pt.price)} ${toY(pt.cumVol)}`;
        bidPath += ` L ${toX(pt.price)} ${toY(pt.cumVol)}`;
      }
      const last = bidPoints[bidPoints.length - 1];
      bidPath += ` L ${toX(minP)} ${toY(last.cumVol)} L ${toX(minP)} ${PAD.top + chartH} Z`;
    }

    // Stepline path for asks (left to right: best ask is leftmost)
    let askPath = '';
    if (askPoints.length > 0) {
      askPath = `M ${toX(bestAsk)} ${PAD.top + chartH}`;
      for (const pt of askPoints) {
        askPath += ` L ${toX(pt.price)} ${toY(pt.cumVol)}`;
        askPath += ` L ${toX(pt.price)} ${toY(pt.cumVol)}`;
      }
      const last = askPoints[askPoints.length - 1];
      askPath += ` L ${toX(maxP)} ${toY(last.cumVol)} L ${toX(maxP)} ${PAD.top + chartH} Z`;
    }

    // Price ticks: min, mid, max
    const xTicks = [
      { x: toX(minP), label: minP.toFixed(2) },
      { x: toX(mid),  label: mid.toFixed(2) },
      { x: toX(maxP), label: maxP.toFixed(2) },
    ];

    const midX = toX(mid);

    return { bidPath, askPath, xTicks, midX, maxVol, toX, toY };
  }, [bids, asks, chartW, chartH, PAD.left, PAD.top, PAD.right]);

  const bg        = d ? '#18181b' : '#ffffff';
  const gridColor = d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const tickColor = d ? '#52525b' : '#a1a1aa';

  return (
    <div className={`flex flex-col h-full overflow-hidden ${d ? 'bg-zinc-900' : 'bg-white'}`}>
      {/* Header */}
      <div className={`px-3 py-2 border-b shrink-0 flex items-center justify-between ${d ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${d ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Market Depth
        </span>
        <span className={`text-[10px] ${d ? 'text-zinc-600' : 'text-zinc-400'}`}>±2%</span>
      </div>

      <div ref={containerRef} className="relative flex-1 overflow-hidden" style={{ background: bg }}>
        {!chart ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xs ${d ? 'text-zinc-600' : 'text-zinc-400'}`}>In attesa di dati…</span>
          </div>
        ) : (
          <svg width={w} height={h} className="absolute inset-0">
            <defs>
              <linearGradient id="bid-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={d ? '#10b981' : '#059669'} stopOpacity="0.35" />
                <stop offset="100%" stopColor={d ? '#10b981' : '#059669'} stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="ask-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={d ? '#ef4444' : '#dc2626'} stopOpacity="0.35" />
                <stop offset="100%" stopColor={d ? '#ef4444' : '#dc2626'} stopOpacity="0.05" />
              </linearGradient>
              <clipPath id="depth-clip">
                <rect x={PAD.left} y={PAD.top} width={chartW} height={chartH} />
              </clipPath>
            </defs>

            {/* Grid */}
            <line x1={PAD.left} y1={PAD.top + chartH / 2} x2={w - PAD.right} y2={PAD.top + chartH / 2} stroke={gridColor} strokeWidth={1} />

            <g clipPath="url(#depth-clip)">
              {/* Mid line */}
              <line x1={chart.midX} y1={PAD.top} x2={chart.midX} y2={PAD.top + chartH} stroke={d ? '#3f3f46' : '#e4e4e7'} strokeWidth={1} strokeDasharray="3 3" />

              {/* Bid area */}
              {chart.bidPath && (
                <>
                  <path d={chart.bidPath} fill="url(#bid-fill)" />
                  <path d={chart.bidPath} fill="none" stroke={d ? '#10b981' : '#059669'} strokeWidth={1.5} />
                </>
              )}

              {/* Ask area */}
              {chart.askPath && (
                <>
                  <path d={chart.askPath} fill="url(#ask-fill)" />
                  <path d={chart.askPath} fill="none" stroke={d ? '#ef4444' : '#dc2626'} strokeWidth={1.5} />
                </>
              )}
            </g>

            {/* X ticks */}
            {chart.xTicks.map((t, i) => (
              <text key={i} x={t.x} y={h - 8} fontSize={9} fill={tickColor} textAnchor="middle" fontFamily="monospace">
                {t.label}
              </text>
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}
