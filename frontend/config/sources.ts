import { youtubeVideoIdFromUrl } from "@/lib/youtube";

/** YouTube watch URLs from your list — embedded as players (live when the uploader is live). */
export const youtubeWatchUrls = [
  "https://www.youtube.com/watch?v=4wExBtPQ-JA",
  "https://www.youtube.com/watch?v=tgBTspqA5nY",
  "https://www.youtube.com/watch?v=TYGxcesWJH0",
  "https://www.youtube.com/watch?v=1wECsnGZcfc",
  "https://www.youtube.com/watch?v=nObUcHKZEGY",
  "https://www.youtube.com/watch?v=EMuPb-vXu_U",
] as const;

export const youtubeStreamEntries = youtubeWatchUrls.map((url) => {
  const videoId = youtubeVideoIdFromUrl(url);
  if (!videoId) {
    throw new Error(`Invalid YouTube URL: ${url}`);
  }
  return { url, videoId };
});

/** Kerala English RSS feeds — merged server-side; broken feeds are skipped when others succeed. */
export const newsRssFeeds = [
  {
    name: "The Hindu — Kerala",
    url: "https://www.thehindu.com/news/national/kerala/feeder/default.rss",
  },
  {
    name: "The New Indian Express — Kerala",
    /** Lowercase `/states/` path; `/State/Kerala/` returns 404. */
    url: "https://www.newindianexpress.com/states/kerala/rssfeed/?id=711&getXmlFeed=true",
  },
] as const;
