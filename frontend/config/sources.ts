import { youtubeVideoIdFromUrl } from "@/lib/youtube";

/** Kerala news YouTube live streams — shown in order. */
export const youtubeChannels = [
  { name: "Asianet News",      url: "https://www.youtube.com/watch?v=s0LLVQeMmtU" },
  { name: "Manorama News",     url: "https://www.youtube.com/watch?v=fzD4BZkFln8" },
  { name: "Mathrubhumi News",  url: "https://www.youtube.com/watch?v=YGEgelAiUf0" },
  { name: "24 News Malayalam", url: "https://www.youtube.com/watch?v=1wECsnGZcfc" },
  { name: "Reporter TV",       url: "https://www.youtube.com/watch?v=70GC2srmwQw" },
  { name: "Big TV",            url: "https://www.youtube.com/watch?v=AT0fo8Ty4jo" },
  { name: "MediaOne TV",       url: "https://www.youtube.com/watch?v=-8d8-c0yvyU" },
  { name: "News18 Kerala",     url: "https://www.youtube.com/watch?v=aPu0o6Lm0cg" },
  { name: "Kairali News",      url: "https://www.youtube.com/watch?v=yiiqRHY1Bl8" },
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
