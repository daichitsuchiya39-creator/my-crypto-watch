import { MarketAsset } from "@/lib/types";

interface CoinCardProps {
  coin: MarketAsset;
}

export default function CoinCard({ coin }: CoinCardProps) {
  const price = coin.quote.JPY.price;

  return (
    <div className="panel-border flex items-center justify-between gap-4 rounded-2xl bg-slate-900/60 px-4 py-3">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Selected</p>
        <p className="text-lg font-semibold text-white">
          {coin.name} <span className="text-amber-400">{coin.symbol}</span>
        </p>
        {"kind" in coin && coin.kind === "fiat" && (
          <p className="text-xs text-slate-500">Fiat Currency</p>
        )}
      </div>
      <div className="text-right">
        <p className="text-xs text-slate-400">Current Price</p>
        <p className="text-lg font-semibold text-white">¥{price.toLocaleString()}</p>
      </div>
    </div>
  );
}
