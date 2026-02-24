"use client";

import { StrengthDescriptor } from "@/lib/types";

interface StrengthGaugeProps {
  score: number;
  descriptor: StrengthDescriptor;
}

export default function StrengthGauge({ score, descriptor }: StrengthGaugeProps) {
  const clamped = Math.max(-50, Math.min(50, score));
  const percent = ((clamped + 50) / 100) * 100;

  return (
    <div className="panel-border rounded-2xl bg-slate-950/70 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Composite Relative Strength
          </p>
          <p className="text-lg font-semibold text-white">{descriptor.label}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Composite Score</p>
          <p className="text-2xl font-semibold" style={{ color: descriptor.color }}>
            {score.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-3 w-full rounded-full bg-gradient-to-r from-blue-500 via-slate-500 to-red-500" />
        <div className="relative -mt-3 h-3">
          <div
            className="absolute -top-1 h-5 w-1.5 -translate-x-1/2 rounded-full bg-white shadow"
            style={{ left: `${percent}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>-50%</span>
          <span>0%</span>
          <span>+50%</span>
        </div>
      </div>
    </div>
  );
}
