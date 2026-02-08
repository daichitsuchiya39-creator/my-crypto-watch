"use client";

import { useEffect, useMemo, useState } from "react";

import { calcCompositeScore, calcWeightedComposite } from "@/lib/calculations";
import {
  CryptoAsset,
  MarketAsset,
  MultiTimeframeStrength,
  PresetType,
  RelativeStrength,
  Timeframe,
} from "@/lib/types";

const PRESET_SYMBOLS: Record<PresetType, string[]> = {
  top10: ["BTC", "ETH", "XRP", "SOL", "BNB", "DOGE", "ADA", "TRX", "AVAX", "LINK"],
  layer1: ["BTC", "ETH", "SOL", "ADA", "AVAX", "DOT", "NEAR", "ATOM"],
  defi: ["UNI", "AAVE", "MKR", "CRV", "COMP", "SNX", "SUSHI"],
  meme: ["DOGE", "SHIB", "PEPE", "FLOKI", "BONK", "WIF"],
  fxmajors: ["USD", "EUR", "JPY", "GBP", "AUD", "CAD", "CHF", "CNY"],
  custom: [],
};

const STORAGE_KEYS = {
  oshi: "mrs:oshiSymbol",
  preset: "mrs:preset",
  custom: "mrs:customBenchmarks",
  timeframe: "mrs:timeframe",
};

const TIMEFRAMES: Timeframe[] = ["1h", "24h", "7d", "30d", "90d"];

function getPercentChange(asset: MarketAsset, timeframe: Timeframe): number {
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

export function useCryptoData() {
  const [listings, setListings] = useState<MarketAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [oshiSymbol, setOshiSymbol] = useState<string | null>(null);
  const [preset, setPreset] = useState<PresetType>("top10");
  const [customBenchmarks, setCustomBenchmarks] = useState<string[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("24h");

  const refresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [cryptoResponse, fxResponse] = await Promise.all([
        fetch("/api/crypto/listings?limit=200&convert=JPY"),
        fetch("/api/fx/latest?symbols=USD,EUR,JPY,GBP,AUD,CAD,CHF,CNY"),
      ]);

      if (!cryptoResponse.ok) {
        const payload = await cryptoResponse.json().catch(() => ({}));
        throw new Error(payload?.error ?? `API error: ${cryptoResponse.status}`);
      }

      if (!fxResponse.ok) {
        const payload = await fxResponse.json().catch(() => ({}));
        throw new Error(payload?.error ?? `FX API error: ${fxResponse.status}`);
      }

      const cryptoPayload = (await cryptoResponse.json()) as { data: CryptoAsset[]; lastUpdated: string };
      const fxPayload = (await fxResponse.json()) as { data: MarketAsset[]; lastUpdated: string };

      const cryptoAssets = (cryptoPayload.data ?? []).map((asset) => ({ ...asset, kind: "crypto" as const }));
      const fxAssets = fxPayload.data ?? [];

      setListings([...cryptoAssets, ...fxAssets]);
      const last = cryptoPayload.lastUpdated ?? fxPayload.lastUpdated;
      setLastUpdated(last ? new Date(last) : new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load data";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const storedOshi = localStorage.getItem(STORAGE_KEYS.oshi);
    const storedPreset = localStorage.getItem(STORAGE_KEYS.preset) as PresetType | null;
    const storedCustom = localStorage.getItem(STORAGE_KEYS.custom);
    const storedTimeframe = localStorage.getItem(STORAGE_KEYS.timeframe) as Timeframe | null;

    if (storedOshi) setOshiSymbol(storedOshi);
    if (storedPreset && PRESET_SYMBOLS[storedPreset]) setPreset(storedPreset);
    if (storedCustom) {
      try {
        const parsed = JSON.parse(storedCustom) as string[];
        if (Array.isArray(parsed)) setCustomBenchmarks(parsed);
      } catch {
        setCustomBenchmarks([]);
      }
    }
    if (storedTimeframe && TIMEFRAMES.includes(storedTimeframe)) setSelectedTimeframe(storedTimeframe);
  }, []);

  useEffect(() => {
    if (listings.length > 0 && !oshiSymbol) {
      const btc = listings.find((coin) => coin.symbol === "BTC");
      setOshiSymbol(btc ? btc.symbol : listings[0].symbol);
    }
  }, [listings, oshiSymbol]);

  useEffect(() => {
    if (oshiSymbol) localStorage.setItem(STORAGE_KEYS.oshi, oshiSymbol);
    localStorage.setItem(STORAGE_KEYS.preset, preset);
    localStorage.setItem(STORAGE_KEYS.custom, JSON.stringify(customBenchmarks));
    localStorage.setItem(STORAGE_KEYS.timeframe, selectedTimeframe);
  }, [oshiSymbol, preset, customBenchmarks, selectedTimeframe]);

  const oshiCoin = useMemo(
    () => listings.find((coin) => coin.symbol === oshiSymbol) ?? null,
    [listings, oshiSymbol]
  );

  const benchmarkSymbols = useMemo(() => {
    if (preset === "custom") return customBenchmarks;
    return PRESET_SYMBOLS[preset] ?? [];
  }, [preset, customBenchmarks]);

  const benchmarkCoins = useMemo(() => {
    const map = new Map(listings.map((coin) => [coin.symbol, coin]));
    return benchmarkSymbols
      .map((symbol) => map.get(symbol))
      .filter((coin): coin is MarketAsset => Boolean(coin))
      .filter((coin) => coin.symbol !== oshiSymbol);
  }, [benchmarkSymbols, listings, oshiSymbol]);

  const relativeStrengths = useMemo<RelativeStrength[]>(() => {
    if (!oshiCoin) return [];
    const oshiChange = getPercentChange(oshiCoin, selectedTimeframe);
    const benchmarkItems = benchmarkCoins.map((coin) => ({
      symbol: coin.symbol,
      name: coin.name,
      rpd: oshiChange - getPercentChange(coin, selectedTimeframe),
      percentChange: getPercentChange(coin, selectedTimeframe),
      price: coin.quote.JPY.price,
    }));

    return [
      {
        symbol: oshiCoin.symbol,
        name: oshiCoin.name,
        rpd: 0,
        percentChange: oshiChange,
        price: oshiCoin.quote.JPY.price,
      },
      ...benchmarkItems,
    ];
  }, [benchmarkCoins, oshiCoin, selectedTimeframe]);

  const multiTimeframeStrength = useMemo<MultiTimeframeStrength | null>(() => {
    if (!oshiCoin) return null;
    const targetChangesByTf = (tf: Timeframe) =>
      benchmarkCoins.map((coin) => getPercentChange(coin, tf));

    const strength: Omit<MultiTimeframeStrength, "composite"> = {
      "1h": calcCompositeScore(getPercentChange(oshiCoin, "1h"), targetChangesByTf("1h")),
      "24h": calcCompositeScore(getPercentChange(oshiCoin, "24h"), targetChangesByTf("24h")),
      "7d": calcCompositeScore(getPercentChange(oshiCoin, "7d"), targetChangesByTf("7d")),
      "30d": calcCompositeScore(getPercentChange(oshiCoin, "30d"), targetChangesByTf("30d")),
      "90d": calcCompositeScore(getPercentChange(oshiCoin, "90d"), targetChangesByTf("90d")),
    };

    return {
      ...strength,
      composite: calcWeightedComposite(strength),
    };
  }, [benchmarkCoins, oshiCoin]);

  const compositeScore = multiTimeframeStrength?.composite ?? 0;

  return {
    listings,
    isLoading,
    error,
    lastUpdated,
    oshiCoin,
    setOshiCoin: (coin: CryptoAsset) => setOshiSymbol(coin.symbol),
    preset,
    setPreset,
    customBenchmarks,
    setCustomBenchmarks,
    selectedTimeframe,
    setSelectedTimeframe,
    benchmarkCoins,
    relativeStrengths,
    compositeScore,
    multiTimeframeStrength,
    refresh,
  };
}
