"use client";

import { useCallback, useEffect, useState } from "react";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import { emojiForNewsTitle } from "@/lib/news-emoji";
import type { NewsItemJson } from "@/lib/news";

function formatRelative(isoOrRfc: string | null): string {
  if (!isoOrRfc) return "";
  const t = new Date(isoOrRfc).getTime();
  if (Number.isNaN(t)) return isoOrRfc;
  const diff = Date.now() - t;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

type FeedRef = { name: string; url: string };

type Payload = {
  items: NewsItemJson[];
  sources: string;
  feedUrls: FeedRef[];
  error: string | null;
};

const REFRESH_MS = 3 * 60 * 1000;

const BORDER_ROTATE = [
  "var(--gf-accent)",
  "var(--gf-live)",
  "var(--gf-warn)",
] as const;

async function loadNews(): Promise<Payload> {
  const res = await fetch(`/api/news?limit=30&t=${Date.now()}`, {
    cache: "no-store",
  });
  return (await res.json()) as Payload;
}

export function NewsSection() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const pull = useCallback(async (opts?: { soft?: boolean }) => {
    const soft = opts?.soft ?? false;
    if (soft) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await loadNews();
      setPayload(data);
      setUpdatedAt(new Date());
    } catch {
      setPayload({
        items: [],
        sources: "",
        feedUrls: [],
        error: "Could not reach local news API.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    pull();
  }, [pull]);

  useEffect(() => {
    const id = window.setInterval(() => {
      pull({ soft: true });
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [pull]);

  const mlHead =
    "\u0D0F\u0D31\u0D4D\u0D31\u0D35\u0D41\u0D02 \u0D2A\u0D41\u0D24\u0D3F\u0D2F \u0D35\u0D3E\u0D7C\u0D24\u0D4D\u0D24\u0D15\u0D7E";

  if (loading) {
    return (
      <GrafanaPanel
        id="latest-news"
        title="Latest headlines"
        subtitle={mlHead}
        className="scroll-mt-[120px]"
      >
        <div className="py-8 text-center text-[0.85rem] text-[var(--gf-text-muted)]">
          <div className="kt-spinner" />
          {"\u0D35\u0D3E\u0D7C\u0D24\u0D4D\u0D24\u0D15\u0D7E \u0D32\u0D4B\u0D21\u0D4D \u0D1A\u0D46\u0D2F\u0D4D\u0D2F\u0D41\u0D28\u0D4D\u0D28\u0D41\u2026"}
        </div>
      </GrafanaPanel>
    );
  }

  if (!payload) return null;

  return (
    <GrafanaPanel
      id="latest-news"
      title="Latest headlines"
      subtitle={mlHead}
      className="kt-animate-in kt-stagger-3 flex max-h-[min(85vh,900px)] scroll-mt-[120px] flex-col"
      contentClassName="flex min-h-0 flex-1 flex-col !pb-3"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {payload.sources ? (
          <p className="font-mono text-[0.68rem] text-[var(--gf-live)]">{payload.sources}</p>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap items-center gap-2">
          {updatedAt && (
            <span className="font-mono text-[0.68rem] text-[var(--gf-text-muted)]">
              Updated {updatedAt.toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={() => pull({ soft: true })}
            disabled={refreshing}
            className="rounded-sm border border-[var(--gf-accent)] bg-[var(--gf-accent-soft)] px-3 py-1.5 font-mono text-[0.68rem] font-semibold tracking-wide text-[var(--gf-accent)] uppercase transition-opacity disabled:opacity-60"
          >
            {refreshing ? "Refreshing\u2026" : "Refresh"}
          </button>
        </div>
      </div>
      {payload.error && (
        <p className="mb-3 rounded-sm border border-[var(--gf-warn)]/50 bg-[rgba(245,166,35,0.1)] px-3 py-2 text-[0.82rem] text-[var(--gf-warn)]">
          {payload.error}
        </p>
      )}
      {payload.items.length === 0 && !payload.error && (
        <p className="text-[0.85rem] text-[var(--gf-text-muted)]">No stories returned.</p>
      )}
      <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
        {payload.items.map((item, i) => {
          const border = BORDER_ROTATE[i % BORDER_ROTATE.length];
          const em = emojiForNewsTitle(item.title);
          return (
            <li key={item.link}>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="kt-card-hover gf-subpanel flex gap-3 p-3 no-underline"
                style={{
                  borderLeft: `3px solid ${border}`,
                  color: "inherit",
                }}
              >
                <div className="flex h-[60px] w-20 shrink-0 items-center justify-center rounded-sm border border-[var(--gf-panel-border)] bg-[var(--gf-panel-inner)] text-2xl">
                  {em}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[0.6rem] font-semibold tracking-wider text-[var(--gf-accent)] uppercase">
                    {item.source}
                  </div>
                  <div className="mt-1 line-clamp-2 text-[0.86rem] leading-snug text-[var(--gf-text)]">
                    {item.title}
                  </div>
                  <div className="mt-1 font-mono text-[0.62rem] text-[var(--gf-text-muted)]">
                    {item.pubDate ? formatRelative(item.pubDate) : ""}
                  </div>
                </div>
              </a>
            </li>
          );
        })}
      </ul>
      {payload.feedUrls?.length > 0 && (
        <div className="mt-3 space-y-1 border-t border-[var(--gf-panel-border)] pt-3 font-mono text-[0.68rem] text-[var(--gf-text-muted)]">
          <p className="font-semibold tracking-wide text-[var(--gf-text)] uppercase">Sources</p>
          {payload.feedUrls.map((f) => (
            <div key={f.url}>
              <a
                className="break-all font-medium text-[var(--gf-live)] hover:underline"
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {f.name}
              </a>
            </div>
          ))}
        </div>
      )}
    </GrafanaPanel>
  );
}
