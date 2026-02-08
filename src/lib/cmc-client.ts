const CMC_BASE_URL = "https://pro-api.coinmarketcap.com";

class CmcError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getApiKey(): string {
  const key = process.env.CMC_API_KEY;
  if (!key) {
    throw new CmcError("CMC_API_KEY is not configured", 500);
  }
  return key;
}

function getRevalidateSeconds(): number {
  const raw = process.env.CACHE_REVALIDATE_SECONDS;
  const value = raw ? Number(raw) : 300;
  return Number.isFinite(value) && value > 0 ? value : 300;
}

async function cmcFetch<T>(path: string, params: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${CMC_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    headers: {
      "X-CMC_PRO_API_KEY": getApiKey(),
      Accept: "application/json",
    },
    next: { revalidate: getRevalidateSeconds() },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new CmcError(text || "CMC API error", response.status);
  }

  return (await response.json()) as T;
}

export async function fetchListings(limit = 100, convert = "JPY") {
  return cmcFetch<{
    data: unknown;
    status: { timestamp: string };
  }>("/v1/cryptocurrency/listings/latest", {
    limit,
    convert,
  });
}

export async function fetchQuotes(symbols: string[], convert = "JPY") {
  return cmcFetch<{
    data: unknown;
    status: { timestamp: string };
  }>("/v1/cryptocurrency/quotes/latest", {
    symbol: symbols.join(","),
    convert,
  });
}

export async function fetchInfo(symbols: string[]) {
  return cmcFetch<{
    data: unknown;
    status: { timestamp: string };
  }>("/v1/cryptocurrency/info", {
    symbol: symbols.join(","),
  });
}

export { CMC_BASE_URL, CmcError };
