import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { newsRssFeeds } from "@/config/sources";
import type { NewsItemJson } from "@/lib/news";

export const dynamic = "force-dynamic";

const parser = new Parser({
  timeout: 20000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/rss+xml, application/xml, application/atom+xml, text/xml, */*",
  },
});

function parseFeedItems(
  feed: (typeof newsRssFeeds)[number],
): Promise<NewsItemJson[]> {
  return parser.parseURL(feed.url).then((f) =>
    (f.items ?? [])
      .map((item) => ({
        title: (item.title ?? "Untitled").trim() || "Untitled",
        link: (item.link ?? item.guid ?? "").toString().trim(),
        /** Prefer ISO from rss-parser so merge sort matches true publication time. */
        pubDate: item.isoDate ?? (item.pubDate ? item.pubDate.trim() : null) ?? null,
        source: feed.name,
      }))
      .filter((i) => i.link.length > 0),
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(
    50,
    Math.max(1, Number(searchParams.get("limit")) || 30),
  );

  const results = await Promise.allSettled(
    newsRssFeeds.map((feed) => parseFeedItems(feed)),
  );

  const feedErrors: string[] = [];
  const all: NewsItemJson[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      all.push(...r.value);
    } else {
      const msg =
        r.reason instanceof Error ? r.reason.message : String(r.reason);
      feedErrors.push(`${newsRssFeeds[i].name}: ${msg}`);
    }
  });

  const seen = new Set<string>();
  const merged = all.filter((item) => {
    if (seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });

  function itemEpoch(iso: string | null): number {
    if (!iso) return 0;
    const t = new Date(iso).getTime();
    return Number.isFinite(t) ? t : 0;
  }

  merged.sort((a, b) => itemEpoch(b.pubDate) - itemEpoch(a.pubDate));

  const items = merged.slice(0, limit);

  const error =
    items.length === 0
      ? feedErrors.length > 0
        ? `All feeds failed: ${feedErrors.join(" · ")}`
        : "No headlines returned."
      : feedErrors.length > 0
        ? `Some feeds skipped: ${feedErrors.join(" · ")}`
        : null;

  return NextResponse.json(
    {
      items,
      sources: newsRssFeeds.map((f) => f.name).join(" · "),
      feedUrls: newsRssFeeds.map((f) => ({ name: f.name, url: f.url })),
      error,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
