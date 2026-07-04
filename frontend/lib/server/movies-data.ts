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
  source: string;
  error: string | null;
};

const WATCHMODE_BASE = process.env.WATCHMODE_API_BASE || "https://api.watchmode.com/v1";

const MOVIES_NOW_LIMIT = 15;

/** Refresh Watchmode at most once every 24 hours to stay within free-tier rate limits. */
const MOVIES_CACHE_SECONDS = 86_400;

/** Today in Kerala (IST) as YYYY-MM-DD. */
function keralaToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

function listTitlesUrl(
  key: string,
  params: Record<string, string | number>,
): string {
  const q = new URLSearchParams({
    apiKey: key,
    languages: "ml",
    types: "movie",
    ...Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ),
  });
  return `${WATCHMODE_BASE}/list-titles/?${q}`;
}

async function fetchTitleDetails(
  ids: string[],
  key: string,
): Promise<Map<string, Record<string, unknown>>> {
  const map = new Map<string, Record<string, unknown>>();
  for (const id of ids) {
    try {
      const detailsUrl = `${WATCHMODE_BASE}/title/${id}/details/?apiKey=${key}&append_to_response=sources`;
      const dRes = await fetch(detailsUrl, {
        next: { revalidate: MOVIES_CACHE_SECONDS, tags: ["movies"] },
      });
      if (dRes.ok) {
        map.set(id, (await dRes.json()) as Record<string, unknown>);
      }
    } catch (e) {
      console.error(`Failed to fetch details for title ${id}:`, e);
    }
  }
  return map;
}

function detailToMovieItem(
  d: Record<string, unknown>,
  todayStr: string,
): MovieItem {
  const releaseDate =
    typeof d.release_date === "string" && d.release_date
      ? d.release_date
      : `${d.year ?? "1970"}-01-01`;
  const date = releaseDate.slice(0, 10);
  const sources = Array.isArray(d.sources) ? d.sources : [];
  const inSources = sources.filter(
    (s: { region?: string }) => s.region === "IN",
  );
  const hasSources = inSources.length > 0;
  const releaseType = hasSources ? "ott" : "theatrical";

  let note = date > todayStr ? "Upcoming" : "Now showing";
  if (hasSources && date <= todayStr) {
    const uniqueNames = Array.from(
      new Set(
        inSources.map((s: { name?: string }) => s.name).filter(Boolean),
      ),
    ) as string[];
    note = `Streaming on ${uniqueNames.slice(0, 2).join(", ")}`;
  }

  return {
    title: String(d.title ?? ""),
    date,
    note,
    poster: typeof d.poster === "string" ? d.poster : null,
    releaseType,
  };
}

async function fetchListIds(key: string, url: string): Promise<string[]> {
  const listRes = await fetch(url, {
    next: { revalidate: MOVIES_CACHE_SECONDS, tags: ["movies"] },
  });
  if (!listRes.ok) {
    throw new Error(`Watchmode API returned status: ${listRes.status}`);
  }
  const listJson = await listRes.json();
  const titles = (listJson.titles || []) as { id: unknown }[];
  return titles.map((t) => String(t.id));
}

async function fetchMoviesFromWatchmode(): Promise<MoviesPayload> {
  const key = process.env.WATCHMODE_API_KEY;
  if (!key) {
    return {
      items: [],
      source: "none",
      error: "WATCHMODE_API_KEY is not configured.",
    };
  }

  try {
    const todayStr = keralaToday();

    const nowListUrl = listTitlesUrl(key, {
      sort_by: "release_date_desc",
      limit: MOVIES_NOW_LIMIT,
    });

    const nowIds = await fetchListIds(key, nowListUrl);
    const detailsMap = await fetchTitleDetails(nowIds, key);

    const items: MovieItem[] = [];
    for (const id of nowIds) {
      const d = detailsMap.get(id);
      if (!d) continue;
      items.push(detailToMovieItem(d, todayStr));
      if (items.length >= MOVIES_NOW_LIMIT) break;
    }

    return {
      items,
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
  ["watchmode-malayalam-movies", String(MOVIES_NOW_LIMIT)],
  { revalidate: MOVIES_CACHE_SECONDS, tags: ["movies"] },
);

/** Shared loader for `/api/movies` and the homepage. Cached 24h when key is set. */
export async function getMoviesPayload(): Promise<MoviesPayload> {
  if (!process.env.WATCHMODE_API_KEY) {
    return {
      items: [],
      source: "none",
      error: "WATCHMODE_API_KEY is not configured.",
    };
  }
  try {
    return await getCachedMovies();
  } catch (e) {
    return {
      items: [],
      source: "none",
      error: `Failed to fetch live updates from Watchmode. (Error: ${String(e)})`,
    };
  }
}
