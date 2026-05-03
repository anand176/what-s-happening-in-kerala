import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Currencies to show against INR
const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AED", "SGD", "SAR"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export type ForexRate = {
  code: CurrencyCode;
  /** How many units of this currency 1 INR buys */
  rate: number;
  /** How many INR 1 unit of this currency costs */
  inrPer: number;
};

export type ForexPayload = {
  base: "INR";
  rates: ForexRate[];
  updatedAt: string;
  error: string | null;
};

export async function GET() {
  // open.er-api.com free tier — no key needed, 1500 req/month
  const url = "https://open.er-api.com/v6/latest/INR";

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`ExchangeRate API ${res.status}`);
    const json = (await res.json()) as ErApiResponse;

    if (json.result !== "success") {
      throw new Error(json["error-type"] ?? "Unknown error from exchange rate API");
    }

    const rates: ForexRate[] = CURRENCIES.map((code) => {
      const rate = json.rates[code] ?? 0; // INR → currency
      return {
        code,
        rate,
        inrPer: rate > 0 ? 1 / rate : 0,
      };
    });

    return NextResponse.json(
      { base: "INR", rates, updatedAt: new Date().toISOString(), error: null } satisfies ForexPayload,
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { base: "INR", rates: [], updatedAt: new Date().toISOString(), error: msg } satisfies ForexPayload,
      { status: 500 },
    );
  }
}

type ErApiResponse = {
  result: string;
  "error-type"?: string;
  rates: Record<string, number>;
};
