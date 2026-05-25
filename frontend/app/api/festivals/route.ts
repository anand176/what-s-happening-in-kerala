import {
  type FestivalsPayload,
  getFestivalsPayload,
} from "@/lib/server/festivals-data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type { FestivalItem, FestivalsPayload } from "@/lib/server/festivals-data";

export async function GET() {
  const body = await getFestivalsPayload();
  return NextResponse.json(body satisfies FestivalsPayload, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
  });
}
