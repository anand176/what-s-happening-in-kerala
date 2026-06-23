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

const MOVIES_NOW_LIMIT = 15;
const MOVIES_UPCOMING_LIMIT = 5;

/** Refresh Watchmode at most once per day to stay within free-tier rate limits. */
const MOVIES_CACHE_SECONDS = 86_400;

/** Today in Kerala (IST) as YYYY-MM-DD. */
function keralaToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

/** Watchmode date filters use YYYYMMDD (no dashes). */
function toWatchmodeDate(isoDate: string): string {
  return isoDate.replace(/-/g, "");
}

function nextDayIso(iso: string): string {
  const [y, mo, da] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, da + 1)).toISOString().slice(0, 10);
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
      const dRes = await fetch(detailsUrl, { cache: "no-store" });
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
  section: "now" | "upcoming",
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

  let note =
    section === "upcoming" || date > todayStr ? "Upcoming" : "Now showing";
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
  const listRes = await fetch(url, { cache: "no-store" });
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
      upcoming: [],
      source: "none",
      error: "WATCHMODE_API_KEY is not configured.",
    };
  }

  try {
    const todayStr = keralaToday();
    const tomorrowStr = nextDayIso(todayStr);
    const futureStart = toWatchmodeDate(tomorrowStr);

    // Recent releases (desc) miss future dates — fetch upcoming separately (asc from tomorrow).
    const nowListUrl = listTitlesUrl(key, {
      sort_by: "release_date_desc",
      limit: MOVIES_NOW_LIMIT,
    });
    const upcomingListUrl = listTitlesUrl(key, {
      sort_by: "release_date_asc",
      release_date_start: futureStart,
      limit: MOVIES_UPCOMING_LIMIT,
    });

    const nowIds = await fetchListIds(key, nowListUrl);

    let upcomingIdsRaw: string[] = [];
    try {
      upcomingIdsRaw = await fetchListIds(key, upcomingListUrl);
    } catch (e) {
      console.warn("Watchmode upcoming list failed (now showing still returned):", e);
    }

    const upcomingIds = upcomingIdsRaw.slice(0, MOVIES_UPCOMING_LIMIT);
    const allIds = [...new Set([...nowIds, ...upcomingIds])];
    const detailsMap = await fetchTitleDetails(allIds, key);

    const upcoming: MovieItem[] = [];
    for (const id of upcomingIds) {
      const d = detailsMap.get(id);
      if (!d) continue;
      const item = detailToMovieItem(d, todayStr, "upcoming");
      if (item.date > todayStr) {
        upcoming.push(item);
      }
    }
    upcoming.sort((a, b) => a.date.localeCompare(b.date));
    const upcomingKeys = new Set(upcoming.map((i) => `${i.title}|${i.date}`));

    const items: MovieItem[] = [];
    for (const id of nowIds) {
      const d = detailsMap.get(id);
      if (!d) continue;
      const item = detailToMovieItem(d, todayStr, "now");
      if (upcomingKeys.has(`${item.title}|${item.date}`)) continue;
      items.push(item);
      if (items.length >= MOVIES_NOW_LIMIT) break;
    }

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
  [
    "watchmode-malayalam-movies",
    String(MOVIES_NOW_LIMIT),
    String(MOVIES_UPCOMING_LIMIT),
    "dual-fetch-upcoming",
  ],
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
