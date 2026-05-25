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

/** Shared loader for `/api/movies` and the homepage (avoids flaky HTTP self-fetch during SSR). */
export async function getMoviesPayload(): Promise<MoviesPayload> {
  const key = process.env.WATCHMODE_API_KEY;

  if (!key) {
    return {
      items: [],
      source: "none",
      error: "WATCHMODE_API_KEY is not configured.",
    };
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
      titles.map(async (title: { id: unknown }) => {
        try {
          const detailsUrl = `${WATCHMODE_BASE}/title/${title.id}/details/?apiKey=${key}&append_to_response=sources`;
          const dRes = await fetch(detailsUrl, { next: { revalidate: 3600 } });
          if (!dRes.ok) return null;
          return await dRes.json();
        } catch (e) {
          console.error(`Failed to fetch details for title ${String(title.id)}:`, e);
          return null;
        }
      }),
    );

    const items: MovieItem[] = details
      .filter((d) => d !== null)
      .map((d: Record<string, unknown>) => {
        const releaseDate =
          typeof d.release_date === "string" && d.release_date
            ? d.release_date
            : `${d.year ?? "1970"}-01-01`;
        const sources = Array.isArray(d.sources) ? d.sources : [];
        const inSources = sources.filter(
          (s: { region?: string }) => s.region === "IN",
        );
        const hasSources = inSources.length > 0;
        const releaseType = hasSources ? "ott" : "theatrical";

        let note = releaseDate <= todayStr ? "Now showing" : "Upcoming";
        if (hasSources) {
          const uniqueNames = Array.from(
            new Set(
              inSources.map((s: { name?: string }) => s.name).filter(Boolean),
            ),
          ) as string[];
          note = `Streaming on ${uniqueNames.slice(0, 2).join(", ")}`;
        }

        return {
          title: String(d.title ?? ""),
          date: releaseDate,
          note,
          poster: typeof d.poster === "string" ? d.poster : null,
          releaseType,
        };
      });

    return {
      items,
      source: "watchmode",
      error: null,
    };
  } catch (e) {
    console.error("Watchmode fetch failed:", e);
    return {
      items: [],
      source: "none",
      error: `Failed to fetch live updates from Watchmode. (Error: ${String(e)})`,
    };
  }
}
