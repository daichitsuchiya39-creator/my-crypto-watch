import { NextResponse } from "next/server";

import { CmcError, fetchListings } from "@/lib/cmc-client";
import { CryptoAsset, ListingResponse } from "@/lib/types";

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
    const limit = Number(searchParams.get("limit") ?? 100);
    const convert = searchParams.get("convert") ?? "JPY";

    const result = await fetchListings(limit, convert);
    const data = Array.isArray(result.data) ? (result.data as CryptoAsset[]) : [];
    const response: ListingResponse = {
      data: data.map(trimAsset),
      lastUpdated: result.status?.timestamp ?? new Date().toISOString(),
    };

    return NextResponse.json(response);
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
