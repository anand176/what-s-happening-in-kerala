import { unstable_cache } from "next/cache";

export type MovieItem = {
  title: string;
  date: string;
  note: string;
  poster: string | null;
  releaseType: "theatrical" | "ott";
};

export type MoviesPayload = {
  items: MovieItem[];
  /** Future release dates (up to 5), earliest first — not duplicated in `items`. */
  upcoming: MovieItem[];
  source: string;
  error: string | null;
};

const WATCHMODE_BASE = process.env.WATCHMODE_API_BASE || "https://api.watchmode.com/v1";

/** Pool size from Watchmode before splitting into now / upcoming lists. */
const MOVIES_FETCH_LIMIT = 30;
const MOVIES_NOW_LIMIT = 15;
const MOVIES_UPCOMING_LIMIT = 5;

/** Refresh Watchmode at most once per day to stay within free-tier rate limits. */
const MOVIES_CACHE_SECONDS = 86_400;

async function fetchMoviesFromWatchmode(): Promise<MoviesPayload> {
  const key = process.env.WATCHMODE_API_KEY;
  if (!key) {
    return {
      items: [],
      upcoming: [],
      source: "none",
      error: "WATCHMODE_API_KEY is not configured.",
    };
  }

  try {
    const listUrl = `${WATCHMODE_BASE}/list-titles/?apiKey=${key}&languages=ml&types=movie&sort_by=release_date_desc&limit=${MOVIES_FETCH_LIMIT}`;
    const listRes = await fetch(listUrl, { cache: "no-store" });

    if (!listRes.ok) {
      throw new Error(`Watchmode API returned status: ${listRes.status}`);
    }

    const listJson = await listRes.json();
    const titles = (listJson.titles || []) as { id: unknown }[];

    const todayStr = new Date().toISOString().slice(0, 10);

    // Sequential detail fetches — avoids bursting Watchmode on the daily cache refresh.
    const details: Record<string, unknown>[] = [];
    for (const title of titles) {
      try {
        const detailsUrl = `${WATCHMODE_BASE}/title/${title.id}/details/?apiKey=${key}&append_to_response=sources`;
        const dRes = await fetch(detailsUrl, { cache: "no-store" });
        if (dRes.ok) {
          details.push((await dRes.json()) as Record<string, unknown>);
        }
      } catch (e) {
        console.error(`Failed to fetch details for title ${String(title.id)}:`, e);
      }
    }

    const allItems: MovieItem[] = details.map((d) => {
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
        date: releaseDate.slice(0, 10),
        note,
        poster: typeof d.poster === "string" ? d.poster : null,
        releaseType,
      };
    });

    const upcoming = allItems
      .filter((i) => i.date > todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, MOVIES_UPCOMING_LIMIT);

    const upcomingKeys = new Set(upcoming.map((i) => `${i.title}|${i.date}`));

    const items = allItems
      .filter((i) => !upcomingKeys.has(`${i.title}|${i.date}`))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, MOVIES_NOW_LIMIT);

    return {
      items,
      upcoming,
      source: "watchmode",
      error: null,
    };
  } catch (e) {
    console.error("Watchmode fetch failed:", e);
    throw e;
  }
}

const getCachedMovies = unstable_cache(
  fetchMoviesFromWatchmode,
  ["watchmode-malayalam-movies", String(MOVIES_FETCH_LIMIT), "split-upcoming"],
  { revalidate: MOVIES_CACHE_SECONDS, tags: ["movies"] },
);

/** Shared loader for `/api/movies` and the homepage. Cached 24h when key is set. */
export async function getMoviesPayload(): Promise<MoviesPayload> {
  if (!process.env.WATCHMODE_API_KEY) {
    return {
      items: [],
      upcoming: [],
      source: "none",
      error: "WATCHMODE_API_KEY is not configured.",
    };
  }
  try {
    return await getCachedMovies();
  } catch (e) {
    return {
      items: [],
      upcoming: [],
      source: "none",
      error: `Failed to fetch live updates from Watchmode. (Error: ${String(e)})`,
    };
  }
}
