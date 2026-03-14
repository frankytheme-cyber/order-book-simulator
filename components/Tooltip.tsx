'use client';

import { useState } from 'react';
import { Info } from 'lucide-react';

interface Props {
  content: string;
  isDark: boolean;
  side?: 'top' | 'bottom';
}

export default function Tooltip({ content, isDark, side = 'top' }: Props) {
  const [show, setShow] = useState(false);
  const d = isDark;

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Info
        size={10}
        className={`cursor-help ml-1 ${d ? 'text-zinc-600 hover:text-zinc-400' : 'text-zinc-400 hover:text-zinc-600'}`}
      />
      {show && (
        <span
          className={`absolute z-50 ${side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-1/2 -translate-x-1/2
            w-52 px-3 py-2 text-[11px] leading-relaxed rounded-lg shadow-xl pointer-events-none
            ${d ? 'bg-zinc-700 text-zinc-100 border border-zinc-600' : 'bg-zinc-900 text-white border border-zinc-700'}`}
        >
          {content}
          <span
            className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent
              ${side === 'top'
                ? `top-full ${d ? 'border-t-zinc-700' : 'border-t-zinc-900'}`
                : `bottom-full ${d ? 'border-b-zinc-700' : 'border-b-zinc-900'}`
              }`}
          />
        </span>
      )}
    </span>
  );
}
