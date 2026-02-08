"use client";

import { Timeframe } from "@/lib/types";

const TIMEFRAMES: Timeframe[] = ["1h", "24h", "7d", "30d", "90d"];

interface TimeframeToggleProps {
  selected: Timeframe;
  onChange: (timeframe: Timeframe) => void;
}

export default function TimeframeToggle({ selected, onChange }: TimeframeToggleProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf}
          type="button"
          onClick={() => onChange(tf)}
          className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
            selected === tf
              ? "border-amber-400 bg-amber-500/10 text-amber-200"
              : "border-slate-700/60 bg-slate-950/60 text-slate-400 hover:border-slate-500"
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}
