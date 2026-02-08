import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

import { CmcError } from "@/lib/cmc-client";
import { FiatAsset } from "@/lib/types";

const FX_BASE_URL = "https://v6.exchangerate-api.com/v6";
const SNAPSHOT_PATH = path.join("/tmp", "my-crypto-watch-fx-snapshots.json");
const MAX_DAYS = 120;

const CURRENCY_NAMES: Record<string, string> = {
  USD: "米ドル",
  EUR: "ユーロ",
  JPY: "日本円",
  GBP: "英ポンド",
  AUD: "豪ドル",
  CAD: "カナダドル",
  CHF: "スイスフラン",
  CNY: "中国元",
};

const TIMEFRAMES = {
  "1h": 1 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
};

interface FxSnapshot {
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}

function getApiKey(): string {
  const key = process.env.EXCHANGE_RATE_API_KEY;
  if (!key) {
    throw new CmcError("EXCHANGE_RATE_API_KEY is not configured", 500);
  }
  return key;
}

async function readSnapshots(): Promise<FxSnapshot[]> {
  try {
    const raw = await fs.readFile(SNAPSHOT_PATH, "utf8");
    const parsed = JSON.parse(raw) as FxSnapshot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeSnapshots(snapshots: FxSnapshot[]) {
  await fs.writeFile(SNAPSHOT_PATH, JSON.stringify(snapshots, null, 2), "utf8");
}

function pruneSnapshots(snapshots: FxSnapshot[]) {
  const cutoff = Date.now() - MAX_DAYS * 24 * 60 * 60 * 1000;
  return snapshots.filter((snap) => snap.timestamp >= cutoff);
}

function findSnapshotAtOrBefore(snapshots: FxSnapshot[], target: number): FxSnapshot | null {
  const sorted = [...snapshots].sort((a, b) => a.timestamp - b.timestamp);
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    if (sorted[i].timestamp <= target) return sorted[i];
  }
  return null;
}

function rateJPYPerCurrency(rates: Record<string, number>, symbol: string): number | null {
  const jpy = rates.JPY;
  if (!jpy) return null;
  if (symbol === "JPY") return 1;
  if (symbol === "USD") return jpy;
  const rate = rates[symbol];
  if (!rate) return null;
  return jpy / rate;
}

function percentChange(nowRate: number, pastRate: number | null): number {
  if (!pastRate || pastRate === 0) return 0;
  return ((nowRate - pastRate) / pastRate) * 100;
}

async function fetchLatestFx() {
  const url = `${FX_BASE_URL}/${getApiKey()}/latest/USD`;
  const response = await fetch(url, { next: { revalidate: 3600 } });
  if (!response.ok) {
    const text = await response.text();
    throw new CmcError(text || "FX API error", response.status);
  }
  return (await response.json()) as {
    result: string;
    base_code: string;
    time_last_update_unix: number;
    conversion_rates: Record<string, number>;
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get("symbols") ?? "USD,EUR,JPY,GBP,AUD,CAD,CHF,CNY";
    const symbols = symbolsParam
      .split(",")
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean);

    const latest = await fetchLatestFx();
    const nowSnapshot: FxSnapshot = {
      timestamp: latest.time_last_update_unix * 1000,
      base: latest.base_code,
      rates: latest.conversion_rates,
    };

    const snapshots = pruneSnapshots(await readSnapshots());
    const hasSameTimestamp = snapshots.some((snap) => snap.timestamp === nowSnapshot.timestamp);
    const updatedSnapshots = hasSameTimestamp ? snapshots : [...snapshots, nowSnapshot];

    await writeSnapshots(updatedSnapshots);

    const assets: FiatAsset[] = symbols
      .map((symbol, index) => {
        const nowRate = rateJPYPerCurrency(nowSnapshot.rates, symbol);
        if (nowRate === null) return null;

        const changes = Object.fromEntries(
          Object.entries(TIMEFRAMES).map(([tf, ms]) => {
            const snap = findSnapshotAtOrBefore(updatedSnapshots, Date.now() - ms);
            const pastRate = snap ? rateJPYPerCurrency(snap.rates, symbol) : null;
            return [tf, percentChange(nowRate, pastRate)];
          })
        ) as Record<string, number>;

        return {
          kind: "fiat",
          id: 900000 + index,
          name: CURRENCY_NAMES[symbol] ?? symbol,
          symbol,
          slug: symbol.toLowerCase(),
          cmc_rank: 0,
          quote: {
            JPY: {
              price: nowRate,
              percent_change_1h: changes["1h"],
              percent_change_24h: changes["24h"],
              percent_change_7d: changes["7d"],
              percent_change_30d: changes["30d"],
              percent_change_60d: 0,
              percent_change_90d: changes["90d"],
              market_cap: 0,
              volume_24h: 0,
            },
          },
        } satisfies FiatAsset;
      })
      .filter((asset): asset is FiatAsset => Boolean(asset));

    return NextResponse.json({ data: assets, lastUpdated: new Date(nowSnapshot.timestamp).toISOString() });
  } catch (error) {
    if (error instanceof CmcError) {
      return NextResponse.json(
        { error: error.message || "FX API error" },
        { status: error.status }
      );
    }

    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
