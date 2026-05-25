import { NextResponse } from "next/server";
import type { RetailRatesPayload } from "@/lib/retail-rates";

export const dynamic = "force-dynamic";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
};

type V8Response = {
  chart?: {
    result?: Array<{
      meta?: { regularMarketPrice?: number };
    }>;
  };
};

async function fetchYahooPrice(symbol: string): Promise<number | null> {
  try {
    const apiBase = process.env.YAHOO_FINANCE_BASE || "https://query1.finance.yahoo.com";
    const url = `${apiBase}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": HEADERS["User-Agent"],
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as V8Response;
    return json?.chart?.result?.[0]?.meta?.regularMarketPrice ?? null;
  } catch {
    return null;
  }
}

function parseFuelPrice(html: string, keyword: string): number | null {
  const index = html.indexOf(keyword);
  if (index === -1) return null;
  const sub = html.slice(index, index + 300);
  const match = sub.match(/(?:&#x20b9;|₹)\s*([0-9,.]+)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ""));
  }
  return null;
}

async function fetchFuelPrices(): Promise<{ petrol: number; diesel: number; lpg: number }> {
  const defaultPrices = { petrol: 106.45, diesel: 96.47, lpg: 922.00 };
  const goodReturnsBase = process.env.GOODRETURNS_BASE || "https://www.goodreturns.in";
  try {
    const [petrolRes, dieselRes, lpgRes] = await Promise.all([
      fetch(`${goodReturnsBase}/petrol-price.html`, { headers: HEADERS, next: { revalidate: 3600 } }),
      fetch(`${goodReturnsBase}/diesel-price.html`, { headers: HEADERS, next: { revalidate: 3600 } }),
      fetch(`${goodReturnsBase}/lpg-price.html`, { headers: HEADERS, next: { revalidate: 3600 } }),
    ]);

    const [petrolHtml, dieselHtml, lpgHtml] = await Promise.all([
      petrolRes.ok ? petrolRes.text() : "",
      dieselRes.ok ? dieselRes.text() : "",
      lpgRes.ok ? lpgRes.text() : "",
    ]);

    const petrol = parseFuelPrice(petrolHtml, 'href="/petrol-price-in-kerala-s18.html"') ?? defaultPrices.petrol;
    const diesel = parseFuelPrice(dieselHtml, 'href="/diesel-price-in-kerala-s18.html"') ?? defaultPrices.diesel;
    const lpg = parseFuelPrice(lpgHtml, 'href="/lpg-price-in-kerala-s18.html"') ?? defaultPrices.lpg;

    return { petrol, diesel, lpg };
  } catch (e) {
    console.error("Failed to fetch live fuel prices:", e);
    return defaultPrices;
  }
}

export async function GET() {
  try {
    const [fuelPrices, goldUsdOz, usdInr] = await Promise.all([
      fetchFuelPrices(),
      fetchYahooPrice("GC=F"),
      fetchYahooPrice("USDINR=X"),
    ]);

    const fuel: RetailRatesPayload = {
      asOf: new Date().toISOString().slice(0, 10),
      regionLabel: "Kerala (GoodReturns live, indicative)",
      petrolInrPerLitre: fuelPrices.petrol,
      dieselInrPerLitre: fuelPrices.diesel,
      lpgInrPerCylinder: fuelPrices.lpg,
      gold22Carat: {
        inrPerGram: 0,
        pavanGrams: 8,
        inrPerPavan: 0,
      },
      disclaimer: "1 pavan = 8 g · 22 carat. Fuel prices updated daily.",
    };

    if (goldUsdOz && usdInr) {
      const goldInrPerGram24K = (goldUsdOz * usdInr) / 31.1035;
      const gold22KPerGram = Math.round(goldInrPerGram24K * 0.9167);
      const pavanGrams = 8;
      fuel.gold22Carat = {
        inrPerGram: gold22KPerGram,
        pavanGrams,
        inrPerPavan: gold22KPerGram * pavanGrams,
      };
    }

    return NextResponse.json(fuel, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
    });
  } catch (e) {
    console.error("Could not load retail rates:", e);
    return NextResponse.json({ error: "Could not load retail rates." }, { status: 500 });
  }
}
