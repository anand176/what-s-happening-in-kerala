import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type MarketIndex = {
  symbol: string;
  label: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  prevClose: number | null;
};

export type MarketsPayload = {
  indices: MarketIndex[];
  updatedAt: string;
  marketOpen: boolean;
  error: string | null;
};

const INDICES = [
  { symbol: "^NSEI",     label: "NIFTY 50" },
  { symbol: "^BSESN",    label: "SENSEX" },
  { symbol: "^NSEBANK",  label: "NIFTY Bank" },
  { symbol: "^CNXIT",    label: "NIFTY IT" },
] as const;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

async function fetchQuote(symbol: string): Promise<YahooQuote | null> {
  // v7/finance/quote returns explicit regularMarketChange + regularMarketChangePercent
  const encoded = encodeURIComponent(symbol);
  const url =
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encoded}` +
    `&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,marketState`;

  try {
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`${res.status}`);
    const json = (await res.json()) as V7Response;
    const q = json?.quoteResponse?.result?.[0];
    if (!q) return null;
    return {
      price: q.regularMarketPrice ?? null,
      change: q.regularMarketChange ?? null,
      changePct: q.regularMarketChangePercent ?? null,
      prevClose: q.regularMarketPreviousClose ?? null,
      marketState: q.marketState ?? "CLOSED",
    };
  } catch {
    // fallback to v8 chart which at least gives us price
    return fetchQuoteChart(symbol);
  }
}

async function fetchQuoteChart(symbol: string): Promise<YahooQuote | null> {
  const encoded = encodeURIComponent(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=5d`;
  try {
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 0 } });
    if (!res.ok) return null;
    const json = (await res.json()) as V8Response;
    const result = json?.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta) return null;

    const closes: number[] = result?.indicators?.quote?.[0]?.close ?? [];
    // Last two valid closes give us the day change
    const validCloses = closes.filter((v) => v != null && !isNaN(v));
    const lastClose = validCloses.at(-1) ?? null;
    const prevClose = validCloses.at(-2) ?? meta.chartPreviousClose ?? null;
    const change =
      lastClose !== null && prevClose !== null ? lastClose - prevClose : null;
    const changePct =
      change !== null && prevClose !== null && prevClose !== 0
        ? (change / prevClose) * 100
        : null;

    return {
      price: meta.regularMarketPrice ?? lastClose,
      change,
      changePct,
      prevClose,
      marketState: meta.marketState ?? "CLOSED",
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const results = await Promise.allSettled(
    INDICES.map((idx) => fetchQuote(idx.symbol)),
  );

  let marketOpen = false;
  const indices: MarketIndex[] = INDICES.map((idx, i) => {
    const r = results[i];
    const q = r.status === "fulfilled" ? r.value : null;
    if (q?.marketState === "REGULAR") marketOpen = true;

    return {
      symbol: idx.symbol,
      label: idx.label,
      price: q?.price ?? null,
      change: q?.change ?? null,
      changePct: q?.changePct ?? null,
      prevClose: q?.prevClose ?? null,
    };
  });

  const anyData = indices.some((i) => i.price !== null);
  const error = anyData
    ? null
    : "Could not fetch market data.";

  return NextResponse.json(
    { indices, updatedAt: new Date().toISOString(), marketOpen, error } satisfies MarketsPayload,
    { headers: { "Cache-Control": "no-store" } },
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

type YahooQuote = {
  price: number | null;
  change: number | null;
  changePct: number | null;
  prevClose: number | null;
  marketState: string;
};

type V7Response = {
  quoteResponse?: {
    result?: Array<{
      regularMarketPrice?: number;
      regularMarketChange?: number;
      regularMarketChangePercent?: number;
      regularMarketPreviousClose?: number;
      marketState?: string;
    }>;
  };
};

type V8Response = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        marketState?: string;
      };
      indicators?: {
        quote?: Array<{ close?: number[] }>;
      };
    }>;
  };
};
