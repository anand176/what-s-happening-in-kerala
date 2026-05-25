import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type MovieItem = {
  title: string;
  date: string;
  note: string;
  poster: string | null;
  releaseType: "theatrical" | "ott";
};

export type MoviesPayload = {
  items: MovieItem[];
  source: string;
  error: string | null;
};

const WATCHMODE_BASE = process.env.WATCHMODE_API_BASE || "https://api.watchmode.com/v1";

export async function GET() {
  const key = process.env.WATCHMODE_API_KEY;

  if (!key) {
    return NextResponse.json(
      {
        items: [],
        source: "none",
        error: "WATCHMODE_API_KEY is not configured.",
      } satisfies MoviesPayload,
      {
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
      }
    );
  }

  try {
    const listUrl = `${WATCHMODE_BASE}/list-titles/?apiKey=${key}&languages=ml&sort_by=release_date_desc&limit=10`;
    const listRes = await fetch(listUrl, { next: { revalidate: 3600 } });

    if (!listRes.ok) {
      throw new Error(`Watchmode API returned status: ${listRes.status}`);
    }

    const listJson = await listRes.json();
    const titles = listJson.titles || [];

    const todayStr = new Date().toISOString().slice(0, 10);

    const details = await Promise.all(
      titles.map(async (title: any) => {
        try {
          const detailsUrl = `${WATCHMODE_BASE}/title/${title.id}/details/?apiKey=${key}&append_to_response=sources`;
          const dRes = await fetch(detailsUrl, { next: { revalidate: 3600 } });
          if (!dRes.ok) return null;
          return await dRes.json();
        } catch (e) {
          console.error(`Failed to fetch details for title ${title.id}:`, e);
          return null;
        }
      })
    );

    const items: MovieItem[] = details
      .filter((d) => d !== null)
      .map((d: any) => {
        const releaseDate = d.release_date || `${d.year}-01-01`;
        const inSources = d.sources ? d.sources.filter((s: any) => s.region === "IN") : [];
        const hasSources = inSources.length > 0;
        const releaseType = hasSources ? "ott" : "theatrical";
        
        let note = releaseDate <= todayStr ? "Now showing" : "Upcoming";
        if (hasSources) {
          const uniqueNames = Array.from(new Set(inSources.map((s: any) => s.name))) as string[];
          note = `Streaming on ${uniqueNames.slice(0, 2).join(", ")}`;
        }

        return {
          title: d.title,
          date: releaseDate,
          note,
          poster: d.poster || null,
          releaseType,
        };
      });

    return NextResponse.json(
      {
        items,
        source: "watchmode",
        error: null,
      } satisfies MoviesPayload,
      {
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
      }
    );
  } catch (e) {
    console.error("Watchmode fetch failed:", e);
    return NextResponse.json(
      {
        items: [],
        source: "none",
        error: `Failed to fetch live updates from Watchmode. (Error: ${String(e)})`,
      } satisfies MoviesPayload,
      {
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
      }
    );
  }
}
