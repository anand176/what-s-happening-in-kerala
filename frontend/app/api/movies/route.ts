import {
  type MoviesPayload,
  getMoviesPayload,
} from "@/lib/server/movies-data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type { MovieItem, MoviesPayload } from "@/lib/server/movies-data";

export async function GET() {
  const body = await getMoviesPayload();
  return NextResponse.json(body satisfies MoviesPayload, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
  });
}
