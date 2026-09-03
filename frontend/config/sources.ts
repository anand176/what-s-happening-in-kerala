/** External source list for Kerala news: live YouTube channels and RSS feeds. */
import { youtubeVideoIdFromUrl } from "@/lib/youtube";

/** Kerala news YouTube live streams — shown in order. */
export const youtubeChannels = [
  { name: "Asianet News",      url: "https://www.youtube.com/watch?v=s0LLVQeMmtU" },
  { name: "Manorama News",     url: "https://www.youtube.com/watch?v=tgBTspqA5nY" },
  { name: "Mathrubhumi News",  url: "https://www.youtube.com/watch?v=RbxEftGN584" },
  { name: "24 News Malayalam", url: "https://www.youtube.com/watch?v=1wECsnGZcfc" },
  { name: "Reporter TV",       url: "https://www.youtube.com/watch?v=nObUcHKZEGY" },
  { name: "Big TV",            url: "https://www.youtube.com/watch?v=HRvY9DoJ_qI" },
] as const;

export const youtubeStreamEntries = youtubeChannels.map((ch) => {
  const videoId = youtubeVideoIdFromUrl(ch.url);
  if (!videoId) throw new Error(`Invalid YouTube URL: ${ch.url}`);
  return { name: ch.name, url: ch.url, videoId };
});

// Keep legacy export name for any other consumers
export const youtubeWatchUrls = youtubeChannels.map((c) => c.url);

/** Kerala English RSS feeds — merged server-side; broken feeds are skipped when others succeed. */
export const newsRssFeeds = [
  {
    name: "The Hindu — Kerala",
    url: "https://www.thehindu.com/news/national/kerala/feeder/default.rss",
  },
  {
    name: "The New Indian Express — Kerala",
    url: "https://www.newindianexpress.com/states/kerala/rssfeed/?id=711&getXmlFeed=true",
  },
] as const;

/**
 * Government job / exam notification feeds.
 *
 * Kerala PSC does not publish an RSS feed of its own, so these are aggregator
 * and official-notification feeds. Any feed that fails is skipped as long as
 * another succeeds (same behaviour as `newsRssFeeds`) — edit freely.
 */
export const jobsRssFeeds = [
  {
    name: "FreeJobAlert",
    url: "https://www.freejobalert.com/feed/",
  },
  {
    name: "Sarkari Result",
    url: "https://www.sarkariresult.com/feed/",
  },
  {
    name: "The Hindu — Careers",
    url: "https://www.thehindu.com/education/careers/feeder/default.rss",
  },
] as const;

/** Kerala airports — used for the live flight-tracking bounding box and labels. */
export const keralaAirports = [
  { iata: "COK", name: "Cochin Intl.",           lat: 10.152, lon: 76.401 },
  { iata: "TRV", name: "Thiruvananthapuram Intl.", lat: 8.482, lon: 76.920 },
  { iata: "CCJ", name: "Calicut Intl.",          lat: 11.137, lon: 75.955 },
  { iata: "CNN", name: "Kannur Intl.",           lat: 11.918, lon: 75.547 },
] as const;

/** Bounding box covering Kerala airspace (lat/lon min/max) for OpenSky queries. */
export const KERALA_BBOX = { lamin: 8.0, lomin: 74.5, lamax: 12.9, lomax: 77.6 } as const;

/**
 * Teams shown in the sports panel — resolved by name against TheSportsDB.
 *
 * Note: TheSportsDB's free tier has no Indian domestic cricket (Kerala's Ranji
 * side is absent; only the defunct Kochi Tuskers is listed), so cricket would
 * need a different provider such as CricAPI with a key. Teams that fail to
 * resolve render a "not found" note rather than breaking the panel.
 */
export const keralaSportsTeams = [
  { query: "Kerala Blasters", label: "Kerala Blasters FC", sport: "Soccer" },
  { query: "India", label: "India (national)", sport: "Soccer" },
] as const;
