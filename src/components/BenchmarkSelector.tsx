"use client";

import { useMemo, useState } from "react";

import { MarketAsset, PresetType } from "@/lib/types";

const PRESET_LABELS: Record<PresetType, string> = {
  top10: "Top 10",
  layer1: "Layer 1",
  defi: "DeFi",
  meme: "Meme Coins",
  fxmajors: "Major FX",
  custom: "Custom",
};

interface BenchmarkSelectorProps {
  coins: MarketAsset[];
  preset: PresetType;
  onPresetChange: (preset: PresetType) => void;
  customSelection: string[];
  onCustomChange: (symbols: string[]) => void;
}

export default function BenchmarkSelector({
  coins,
  preset,
  onPresetChange,
  customSelection,
  onCustomChange,
}: BenchmarkSelectorProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return coins.slice(0, 100);
    return coins
      .filter(
        (coin) =>
          coin.name.toLowerCase().includes(normalized) ||
          coin.symbol.toLowerCase().includes(normalized)
      )
      .slice(0, 100);
  }, [coins, query]);

  const toggleSymbol = (symbol: string) => {
    if (customSelection.includes(symbol)) {
      onCustomChange(customSelection.filter((value) => value !== symbol));
      return;
    }
    if (customSelection.length >= 15) return;
    onCustomChange([...customSelection, symbol]);
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        Benchmark Group
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(PRESET_LABELS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
              preset === key
                ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
                : "border-slate-700/60 bg-slate-950/50 text-slate-300 hover:border-slate-500"
            }`}
            onClick={() => onPresetChange(key as PresetType)}
          >
            {label}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="panel-border rounded-2xl bg-slate-950/70 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Custom Assets</p>
              <p className="text-xs text-slate-400">Select up to 15 assets</p>
            </div>
            <span className="text-xs text-slate-400">{customSelection.length} / 15</span>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or symbol"
            className="mt-3 w-full rounded-lg border border-slate-700/60 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400"
          />
          <div className="mt-3 max-h-56 space-y-2 overflow-auto pr-2">
            {filtered.map((coin) => {
              const active = customSelection.includes(coin.symbol);
              return (
                <button
                  key={coin.id}
                  type="button"
                  onClick={() => toggleSymbol(coin.symbol)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                    active
                      ? "border-emerald-400 bg-emerald-500/10 text-emerald-200"
                      : "border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  <span>
                    {coin.name} <span className="text-amber-400">{coin.symbol}</span>
                  </span>
                  <span className="text-xs text-slate-500">
                    {"kind" in coin && coin.kind === "fiat" ? "FX" : `#${coin.cmc_rank}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
