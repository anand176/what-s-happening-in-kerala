import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { isRetailRatesPayload } from "@/lib/retail-rates";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const path = join(process.cwd(), "data", "retail-rates.json");
    const raw = await readFile(path, "utf8");
    const data: unknown = JSON.parse(raw);
    if (!isRetailRatesPayload(data)) {
      return NextResponse.json(
        { error: "Invalid retail-rates.json shape." },
        { status: 500 },
      );
    }
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load retail rates." },
      { status: 500 },
    );
  }
}
