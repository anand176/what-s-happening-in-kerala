import { unstable_cache } from "next/cache";
import type { RetailRatesPayload } from "@/lib/retail-rates";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
};

/** Goodreturns scrape at most once every 8 hours (fuel + gold). */
export const RETAIL_RATES_CACHE_SECONDS = 8 * 60 * 60;

const PAVAN_GRAMS = 8;

const FALLBACK_FUEL = { petrol: 115.49, diesel: 104.4, lpg: 951.0 };
const FALLBACK_GOLD_22K_PER_GRAM = 13_255;

type V8Response = {
  chart?: {
    result?: Array<{
      meta?: { regularMarketPrice?: number };
    }>;
  };
};

type ScrapeResult = {
  payload: RetailRatesPayload;
  /** True when every fuel + gold value came from Goodreturns (no fallback). */
  fullyLive: boolean;
};

function parseInrAmount(raw: string): number | null {
  const n = parseFloat(raw.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseFuelPerLitre(html: string): number | null {
  const fp = html.match(/id="fp-price"[^>]*>\s*(?:&#x20b9;|&#8377;|₹)?\s*([0-9,.]+)/i);
  if (fp) return parseInrAmount(fp[1]);

  const intro = html.match(
    /stands at\s*(?:&#x20b9;|&#8377;|₹)\s*<b>([0-9,.]+)<\/b>\s*per litre/i,
  );
  if (intro) return parseInrAmount(intro[1]);

  const unit = html.match(
    /(?:&#x20b9;|&#8377;|₹)\s*([0-9,.]+)\s*<\/[^>]+>\s*\/\s*Ltr/i,
  );
  if (unit) return parseInrAmount(unit[1]);

  return null;
}

function parseLpgDomestic(html: string): number | null {
  const intro = html.match(
    /Domestic LPG \(14\.2 kg\)[\s\S]{0,220}?(?:&#x20b9;|&#8377;|₹)\s*<b>([0-9,.]+)<\/b>/i,
  );
  if (intro) return parseInrAmount(intro[1]);

  const widget = html.match(
    /Domestic \(14\.2 Kg\)[\s\S]{0,180}?(?:&#x20b9;|&#8377;|₹)\s*([0-9,.]+)/i,
  );
  if (widget) return parseInrAmount(widget[1]);

  return null;
}

/** 22K ₹/gram from Kerala gold page intro. */
function parseGold22KPerGram(html: string): number | null {
  const intro = html.match(
    /(?:&#x20b9;|&#8377;|₹)\s*([0-9,.]+)<\/strong>\s*per gram for 22 karat gold/i,
  );
  if (intro) return parseInrAmount(intro[1]);

  const ticker = html.match(/22k Gold[\s\S]{0,80}?([0-9,.]+)\s*\/\s*gm/i);
  if (ticker) return parseInrAmount(ticker[1]);

  const row1 = html.match(
    /<td>\s*1\s*<\/td>\s*<td>[\s\S]*?(?:&#x20b9;|&#8377;|₹)\s*[0-9,.]+[\s\S]*?<\/td>\s*<td>[\s\S]*?(?:&#x20b9;|&#8377;|₹)\s*([0-9,.]+)/i,
  );
  if (row1) return parseInrAmount(row1[1]);

  return null;
}

/** 22K price for 8 g (1 pavan) from gram table. */
function parseGold22KPavan(html: string): number | null {
  const row8 = html.match(
    /<td>\s*8\s*<\/td>\s*<td>[\s\S]*?(?:&#x20b9;|&#8377;|₹)\s*[0-9,.]+[\s\S]*?<\/td>\s*<td>[\s\S]*?(?:&#x20b9;|&#8377;|₹)\s*([0-9,.]+)/i,
  );
  if (row8) return parseInrAmount(row8[1]);
  return null;
}

async function fetchGoodreturnsHtml(path: string): Promise<string> {
  const base = process.env.GOODRETURNS_BASE || "https://www.goodreturns.in";
  const res = await fetch(`${base}${path}`, {
    headers: HEADERS,
    cache: "no-store",
  });
  if (!res.ok) return "";
  return res.text();
}

async function fetchYahooGold22K(): Promise<{ inrPerGram: number; inrPerPavan: number } | null> {
  try {
    const apiBase =
      process.env.YAHOO_FINANCE_BASE || "https://query1.finance.yahoo.com";
    const ua = HEADERS["User-Agent"];
    const [goldRes, inrRes] = await Promise.all([
      fetch(`${apiBase}/v8/finance/chart/GC=F?interval=1d&range=1d`, {
        headers: { "User-Agent": ua, Accept: "application/json" },
        cache: "no-store",
      }),
      fetch(`${apiBase}/v8/finance/chart/USDINR=X?interval=1d&range=1d`, {
        headers: { "User-Agent": ua, Accept: "application/json" },
        cache: "no-store",
      }),
    ]);
    if (!goldRes.ok || !inrRes.ok) return null;
    const goldJson = (await goldRes.json()) as V8Response;
    const inrJson = (await inrRes.json()) as V8Response;
    const goldUsdOz = goldJson?.chart?.result?.[0]?.meta?.regularMarketPrice;
    const usdInr = inrJson?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (!goldUsdOz || !usdInr) return null;
    const inrPerGram24K = (goldUsdOz * usdInr) / 31.1035;
    const inrPerGram = Math.round(inrPerGram24K * 0.9167);
    return {
      inrPerGram,
      inrPerPavan: inrPerGram * PAVAN_GRAMS,
    };
  } catch {
    return null;
  }
}

async function scrapeRetailRates(): Promise<ScrapeResult> {
  const [
    petrolHtml,
    dieselHtml,
    lpgHtml,
    goldHtml,
  ] = await Promise.all([
    fetchGoodreturnsHtml("/petrol-price-in-kerala-s18.html"),
    fetchGoodreturnsHtml("/diesel-price-in-kerala-s18.html"),
    fetchGoodreturnsHtml("/lpg-price-in-kerala-s18.html"),
    fetchGoodreturnsHtml("/gold-rates/kerala.html"),
  ]);

  const petrolParsed = parseFuelPerLitre(petrolHtml);
  const dieselParsed = parseFuelPerLitre(dieselHtml);
  const lpgParsed = parseLpgDomestic(lpgHtml);
  const goldGramParsed = parseGold22KPerGram(goldHtml);
  const goldPavanParsed = parseGold22KPavan(goldHtml);

  const fuelLive =
    petrolParsed !== null && dieselParsed !== null && lpgParsed !== null;
  const goldLive = goldGramParsed !== null;

  const petrol = petrolParsed ?? FALLBACK_FUEL.petrol;
  const diesel = dieselParsed ?? FALLBACK_FUEL.diesel;
  const lpg = lpgParsed ?? FALLBACK_FUEL.lpg;

  let goldGram = goldGramParsed ?? FALLBACK_GOLD_22K_PER_GRAM;
  let goldPavan =
    goldPavanParsed ?? (goldGramParsed !== null ? goldGramParsed * PAVAN_GRAMS : null);
  let goldSource: "goodreturns" | "yahoo" | "fallback" = goldLive ? "goodreturns" : "fallback";

  if (!goldLive) {
    const yahoo = await fetchYahooGold22K();
    if (yahoo) {
      goldGram = yahoo.inrPerGram;
      goldPavan = yahoo.inrPerPavan;
      goldSource = "yahoo";
    } else if (goldPavan === null) {
      goldPavan = goldGram * PAVAN_GRAMS;
    }
  } else if (goldPavan === null) {
    goldPavan = goldGram * PAVAN_GRAMS;
  }

  const fullyLive = fuelLive && goldLive;

  const regionParts: string[] = ["Kerala"];
  if (fuelLive) regionParts.push("fuel GoodReturns");
  else regionParts.push("fuel fallback");
  if (goldSource === "goodreturns") regionParts.push("gold GoodReturns");
  else if (goldSource === "yahoo") regionParts.push("gold Yahoo est.");
  else regionParts.push("gold fallback");

  const payload: RetailRatesPayload = {
    asOf: new Date().toISOString().slice(0, 10),
    regionLabel: `${regionParts.join(" · ")} (indicative)`,
    petrolInrPerLitre: petrol,
    dieselInrPerLitre: diesel,
    lpgInrPerCylinder: lpg,
    gold22Carat: {
      inrPerGram: Math.round(goldGram),
      pavanGrams: PAVAN_GRAMS,
      inrPerPavan: Math.round(goldPavan),
    },
    disclaimer:
      "1 pavan = 8 g · 22K (916). Fuel & gold from GoodReturns Kerala when live; cached 8h.",
  };

  if (
    petrolParsed === null &&
    dieselParsed === null &&
    lpgParsed === null &&
    goldGramParsed === null
  ) {
    throw new Error("Goodreturns returned no parseable retail rates");
  }

  return { payload, fullyLive };
}

const getCachedRetailRates = unstable_cache(
  async (): Promise<RetailRatesPayload> => {
    const { payload } = await scrapeRetailRates();
    return payload;
  },
  ["retail-rates-kerala-goodreturns"],
  { revalidate: RETAIL_RATES_CACHE_SECONDS, tags: ["retail-rates"] },
);

/** Shared loader for `/api/retail-rates` and any server callers. Cached 8h. */
export async function getRetailRatesPayload(): Promise<RetailRatesPayload> {
  try {
    return await getCachedRetailRates();
  } catch (e) {
    console.error("Retail rates scrape failed:", e);
    const { payload } = await scrapeRetailRates();
    return payload;
  }
}
