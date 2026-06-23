import {
  getRetailRatesPayload,
  RETAIL_RATES_CACHE_SECONDS,
} from "@/lib/server/retail-rates-data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const body = await getRetailRatesPayload();
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": `public, s-maxage=${RETAIL_RATES_CACHE_SECONDS}, stale-while-revalidate=${RETAIL_RATES_CACHE_SECONDS}`,
      },
    });
  } catch (e) {
    console.error("Could not load retail rates:", e);
    return NextResponse.json({ error: "Could not load retail rates." }, { status: 500 });
  }
}
