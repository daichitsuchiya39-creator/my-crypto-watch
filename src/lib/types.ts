export type Timeframe = "1h" | "24h" | "7d" | "30d" | "90d";

export type PresetType =
  | "top10"
  | "layer1"
  | "defi"
  | "meme"
  | "fxmajors"
  | "custom";

export interface CryptoQuote {
  price: number;
  percent_change_1h: number;
  percent_change_24h: number;
  percent_change_7d: number;
  percent_change_30d: number;
  percent_change_60d: number;
  percent_change_90d: number;
  market_cap: number;
  volume_24h: number;
}

export interface CryptoAsset {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  quote: {
    JPY: CryptoQuote;
  };
}

export interface FiatAsset {
  kind: "fiat";
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  quote: {
    JPY: CryptoQuote;
  };
}

export type MarketAsset = CryptoAsset | FiatAsset;

export interface ListingResponse {
  data: CryptoAsset[];
  lastUpdated: string;
}

export interface RelativeStrength {
  symbol: string;
  name: string;
  rpd: number;
  percentChange: number;
  price: number;
}

export interface MultiTimeframeStrength {
  "1h": number;
  "24h": number;
  "7d": number;
  "30d": number;
  "90d": number;
  composite: number;
}

export type StrengthRank =
  | "extremely-strong"
  | "strong"
  | "moderately-strong"
  | "neutral"
  | "moderately-weak"
  | "weak"
  | "extremely-weak";

export interface StrengthDescriptor {
  rank: StrengthRank;
  label: string;
  color: string;
}
