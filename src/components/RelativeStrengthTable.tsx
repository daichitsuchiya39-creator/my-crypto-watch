"use client";

import { useMemo, useState } from "react";

import { MarketAsset, Timeframe } from "@/lib/types";

const TIMEFRAMES: Timeframe[] = ["1h", "24h", "7d", "30d", "90d"];

interface RelativeStrengthTableProps {
  assets: MarketAsset[];
  oshiSymbol: string | null;
  timeframe: Timeframe;
}

function getPercentChange(asset: MarketAsset, timeframe: Timeframe) {
  const quote = asset.quote.JPY;
  switch (timeframe) {
    case "1h":
      return quote.percent_change_1h;
    case "24h":
      return quote.percent_change_24h;
    case "7d":
      return quote.percent_change_7d;
    case "30d":
      return quote.percent_change_30d;
    case "90d":
      return quote.percent_change_90d;
    default:
      return quote.percent_change_24h;
  }
}

export default function RelativeStrengthTable({ assets, oshiSymbol, timeframe }: RelativeStrengthTableProps) {
  const [sortKey, setSortKey] = useState<"rank" | "rpd" | Timeframe>("rpd");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    const oshi = assets.find((asset) => asset.symbol === oshiSymbol);
    const oshiChange = oshi ? getPercentChange(oshi, timeframe) : 0;
    const mapped = assets.map((asset) => {
      const rpd = oshiSymbol ? oshiChange - getPercentChange(asset, timeframe) : 0;
      return {
        asset,
        rpd,
      };
    });

    const sorted = [...mapped].sort((a, b) => {
      const dir = direction === "asc" ? 1 : -1;
      if (sortKey === "rank") {
        return (a.asset.cmc_rank - b.asset.cmc_rank) * dir;
      }
      if (sortKey === "rpd") {
        return (a.rpd - b.rpd) * dir;
      }
      return (getPercentChange(a.asset, sortKey) - getPercentChange(b.asset, sortKey)) * dir;
    });

    return sorted;
  }, [assets, direction, sortKey, timeframe, oshiSymbol]);

  const onSort = (key: "rank" | "rpd" | Timeframe) => {
    if (key === sortKey) {
      setDirection(direction === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setDirection("desc");
    }
  };

  return (
    <div className="panel-border overflow-hidden rounded-2xl bg-slate-950/70">
      <div className="border-b border-slate-800 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          詳細比較テーブル
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900/60 text-xs uppercase tracking-[0.2em] text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">銘柄</th>
              <th className="px-4 py-3 text-right">価格</th>
              {TIMEFRAMES.map((tf) => (
                <th key={tf} className="px-4 py-3 text-right">
                  <button type="button" onClick={() => onSort(tf)} className="hover:text-white">
                    {tf}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 text-right">
                <button type="button" onClick={() => onSort("rpd")} className="hover:text-white">
                  相対強度
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ asset, rpd }) => {
              const isOshi = asset.symbol === oshiSymbol;
              return (
                <tr key={asset.id} className="border-t border-slate-800/70 text-slate-200">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs ${isOshi ? "bg-amber-500/20 text-amber-200" : "bg-slate-800 text-slate-300"}`}>
                        {asset.symbol}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{asset.name}</p>
                        <p className="text-xs text-slate-500">
                          {"kind" in asset && asset.kind === "fiat" ? "FX" : `Rank #${asset.cmc_rank}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-200">¥{asset.quote.JPY.price.toLocaleString()}</td>
                  {TIMEFRAMES.map((tf) => {
                    const change = getPercentChange(asset, tf);
                    return (
                      <td key={tf} className={`px-4 py-3 text-right ${change >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                        {change.toFixed(2)}%
                      </td>
                    );
                  })}
                  <td className={`px-4 py-3 text-right font-semibold ${isOshi ? "text-slate-400" : rpd >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {isOshi ? "基準" : `${rpd.toFixed(2)}%`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
