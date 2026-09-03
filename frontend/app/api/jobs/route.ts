import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { jobsRssFeeds } from "@/config/sources";

export const dynamic = "force-dynamic";

export type JobItem = {
  title: string;
  link: string;
  pubDate: string | null;
  source: string;
};

export type JobsPayload = {
  items: JobItem[];
  sources: string;
  error: string | null;
};

const parser = new Parser({
  timeout: 20000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/rss+xml, application/xml, application/atom+xml, text/xml, */*",
  },
});

function parseFeed(feed: (typeof jobsRssFeeds)[number]): Promise<JobItem[]> {
  return parser.parseURL(feed.url).then((f) =>
    (f.items ?? [])
      .map((item) => ({
        title: (item.title ?? "Untitled").trim() || "Untitled",
        link: (item.link ?? item.guid ?? "").toString().trim(),
        pubDate: item.isoDate ?? (item.pubDate ? item.pubDate.trim() : null) ?? null,
        source: feed.name,
      }))
      .filter((i) => i.link.length > 0),
  );
}

function epoch(iso: string | null): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(40, Math.max(1, Number(searchParams.get("limit")) || 20));

  const results = await Promise.allSettled(jobsRssFeeds.map(parseFeed));

  const feedErrors: string[] = [];
  const all: JobItem[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") all.push(...r.value);
    else {
      const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
      feedErrors.push(`${jobsRssFeeds[i].name}: ${msg}`);
    }
  });

  const seen = new Set<string>();
  const merged = all.filter((i) => (seen.has(i.link) ? false : (seen.add(i.link), true)));
  merged.sort((a, b) => epoch(b.pubDate) - epoch(a.pubDate));

  const items = merged.slice(0, limit);
  const error =
    items.length === 0
      ? feedErrors.length > 0
        ? `All feeds failed: ${feedErrors.join(" · ")}`
        : "No notifications returned."
      : feedErrors.length > 0
        ? `Some feeds skipped: ${feedErrors.join(" · ")}`
        : null;

  return NextResponse.json(
    { items, sources: jobsRssFeeds.map((f) => f.name).join(" · "), error } satisfies JobsPayload,
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
