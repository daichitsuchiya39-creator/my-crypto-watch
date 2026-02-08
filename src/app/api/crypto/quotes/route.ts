import { NextResponse } from "next/server";

import { CmcError, fetchQuotes } from "@/lib/cmc-client";
import { CryptoAsset } from "@/lib/types";

function trimAsset(asset: CryptoAsset): CryptoAsset {
  return {
    id: asset.id,
    name: asset.name,
    symbol: asset.symbol,
    slug: asset.slug,
    cmc_rank: asset.cmc_rank,
    quote: {
      JPY: {
        price: asset.quote.JPY.price,
        percent_change_1h: asset.quote.JPY.percent_change_1h,
        percent_change_24h: asset.quote.JPY.percent_change_24h,
        percent_change_7d: asset.quote.JPY.percent_change_7d,
        percent_change_30d: asset.quote.JPY.percent_change_30d,
        percent_change_60d: asset.quote.JPY.percent_change_60d,
        percent_change_90d: asset.quote.JPY.percent_change_90d,
        market_cap: asset.quote.JPY.market_cap,
        volume_24h: asset.quote.JPY.volume_24h,
      },
    },
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get("symbols") ?? "";
    const convert = searchParams.get("convert") ?? "JPY";
    const symbols = symbolsParam
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (symbols.length === 0) {
      return NextResponse.json({ error: "symbols parameter is required" }, { status: 400 });
    }

    const result = await fetchQuotes(symbols, convert);
    const data = result.data as Record<string, CryptoAsset>;
    const trimmed = Object.fromEntries(
      Object.entries(data ?? {}).map(([symbol, asset]) => [symbol, trimAsset(asset)])
    );

    return NextResponse.json({ data: trimmed, lastUpdated: result.status?.timestamp });
  } catch (error) {
    if (error instanceof CmcError) {
      return NextResponse.json(
        { error: error.message || "CMC API error" },
        { status: error.status }
      );
    }

    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
