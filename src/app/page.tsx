"use client";

import BenchmarkSelector from "@/components/BenchmarkSelector";
import CoinCard from "@/components/CoinCard";
import CoinSelector from "@/components/CoinSelector";
import Header from "@/components/Header";
import RelativeStrengthChart from "@/components/RelativeStrengthChart";
import RelativeStrengthTable from "@/components/RelativeStrengthTable";
import StrengthGauge from "@/components/StrengthGauge";
import TimeframeToggle from "@/components/TimeframeToggle";
import { getStrengthDescriptor } from "@/lib/calculations";
import { useCryptoData } from "@/hooks/useCryptoData";

export default function Home() {
  const {
    listings,
    isLoading,
    error,
    lastUpdated,
    oshiCoin,
    setOshiCoin,
    preset,
    setPreset,
    customBenchmarks,
    setCustomBenchmarks,
    selectedTimeframe,
    setSelectedTimeframe,
    benchmarkCoins,
    relativeStrengths,
    compositeScore,
    refresh,
  } = useCryptoData();

  const descriptor = getStrengthDescriptor(compositeScore);
  const tableAssets = oshiCoin
    ? [oshiCoin, ...benchmarkCoins.filter((coin) => coin.symbol !== oshiCoin.symbol)]
    : benchmarkCoins;

  const formattedUpdate = lastUpdated
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }).format(lastUpdated)
    : "-";

  return (
    <div className="bg-aurora min-h-screen">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <Header />

        {error && (
          <div className="panel-border rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {/* Hero: coin selection */}
        <section className="flex flex-col items-center gap-6">
          <CoinSelector coins={listings} selected={oshiCoin} onSelect={setOshiCoin} />
          {oshiCoin && <CoinCard coin={oshiCoin} />}
        </section>

        {/* Benchmark settings */}
        <section>
          <BenchmarkSelector
            coins={listings}
            preset={preset}
            onPresetChange={setPreset}
            customSelection={customBenchmarks}
            onCustomChange={setCustomBenchmarks}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <StrengthGauge score={compositeScore} descriptor={descriptor} />
          <div className="panel-border flex flex-col justify-between rounded-2xl bg-slate-950/70 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Current Timeframe
              </p>
              <p className="text-lg font-semibold text-white">{selectedTimeframe.toUpperCase()}</p>
              <p className="text-sm text-slate-400">Applied to charts and table</p>
            </div>
            <div className="mt-4">
              <TimeframeToggle selected={selectedTimeframe} onChange={setSelectedTimeframe} />
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="panel-border rounded-2xl bg-slate-950/70 p-6 text-sm text-slate-300">
            Loading data...
          </div>
        ) : (
          <section className="grid gap-6">
            <RelativeStrengthChart data={relativeStrengths} highlightSymbol={oshiCoin?.symbol} />
            <RelativeStrengthTable
              assets={tableAssets}
              oshiSymbol={oshiCoin?.symbol ?? null}
              timeframe={selectedTimeframe}
            />
          </section>
        )}

        <section className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-400">
          <div>
            Last updated: {formattedUpdate} UTC
            <span className="ml-3 inline-flex items-center gap-2 rounded-full bg-slate-800/70 px-3 py-1 text-xs text-slate-300">
              Cache: 5 min
            </span>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="rounded-full border border-emerald-400/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200 transition hover:bg-emerald-500/10"
          >
            Refresh
          </button>
        </section>

        <section className="rounded-2xl border border-slate-800/80 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
          This app is for informational purposes only and does not constitute investment advice.
          <span className="mt-2 block text-slate-500">
            Data source:{" "}
            <a
              href="https://pro-api.coinmarketcap.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-200 underline-offset-4 hover:underline"
            >
              CoinMarketCap API
            </a>
            {" / "}
            <a
              href="https://www.exchangerate-api.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-200 underline-offset-4 hover:underline"
            >
              ExchangeRate-API
            </a>
          </span>
        </section>
      </main>
    </div>
  );
}
