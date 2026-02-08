"use client";

import { useMemo, useState } from "react";

import { MarketAsset } from "@/lib/types";

interface CoinSelectorProps {
  coins: MarketAsset[];
  selected: MarketAsset | null;
  onSelect: (coin: MarketAsset) => void;
}

export default function CoinSelector({ coins, selected, onSelect }: CoinSelectorProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return coins.slice(0, 50);
    return coins
      .filter(
        (coin) =>
          coin.name.toLowerCase().includes(normalized) ||
          coin.symbol.toLowerCase().includes(normalized)
      )
      .slice(0, 50);
  }, [coins, query]);

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      {!selected && (
        <p className="mb-3 text-center text-lg font-semibold text-slate-300">
          まずは推しコインを選んでください
        </p>
      )}
      <div className="glow rounded-2xl bg-slate-900/80 p-1">
        <div className="relative">
          <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-2xl">
            🔍
          </span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={
              selected
                ? `${selected.name} (${selected.symbol})`
                : "コイン名 or シンボルを入力…"
            }
            className="w-full rounded-2xl border-2 border-emerald-400/40 bg-slate-950/90 py-5 pl-14 pr-5 text-lg font-medium text-white placeholder-slate-500 outline-none transition-all focus:border-emerald-400 focus:shadow-[0_0_30px_rgba(16,185,129,0.3)]"
          />
        </div>
      </div>

      {selected && (
        <p className="mt-2 text-center text-sm text-slate-500">
          変更するにはもう一度検索してください
        </p>
      )}

      {open && (
        <div className="panel-border absolute left-0 right-0 z-20 mt-2 max-h-80 overflow-auto rounded-2xl bg-slate-950/95 backdrop-blur">
          {filtered.length === 0 ? (
            <p className="px-5 py-4 text-sm text-slate-400">該当するコインがありません</p>
          ) : (
            filtered.map((coin) => (
              <button
                key={coin.id}
                type="button"
                className="flex w-full items-center justify-between gap-2 px-5 py-3.5 text-left text-base text-slate-200 transition hover:bg-emerald-500/10"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(coin);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <span className="font-medium">
                  {coin.name}{" "}
                  <span className="text-amber-400">{coin.symbol}</span>
                </span>
                <span className="text-xs text-slate-500">
                  {"kind" in coin && coin.kind === "fiat" ? "FX" : `#${coin.cmc_rank}`}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
