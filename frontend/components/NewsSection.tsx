"use client";

import { useCallback, useEffect, useState } from "react";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
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
  return `${Math.floor(h / 24)}d ago`;
}

type FeedRef = { name: string; url: string };
type Payload = { items: NewsItemJson[]; sources: string; feedUrls: FeedRef[]; error: string | null };

const REFRESH_MS = 3 * 60 * 1000;

async function loadNews(): Promise<Payload> {
  const res = await fetch(`/api/news?limit=30&t=${Date.now()}`, { cache: "no-store" });
  return (await res.json()) as Payload;
}

export function NewsSection() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const pull = useCallback(async (opts?: { soft?: boolean }) => {
    if (opts?.soft) setRefreshing(true);
    else setLoading(true);
    try {
      setPayload(await loadNews());
    } catch {
      setPayload({ items: [], sources: "", feedUrls: [], error: "Could not reach news API." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { pull(); }, [pull]);
  useEffect(() => {
    const id = window.setInterval(() => pull({ soft: true }), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [pull]);

  if (loading) {
    return (
      <GrafanaPanel
        id="latest-news"
        title="Latest headlines."
        subtitle={"\u0D0F\u0D31\u0D4D\u0D31\u0D35\u0D41\u0D02 \u0D2A\u0D41\u0D24\u0D3F\u0D2F \u0D35\u0D3E\u0D7C\u0D24\u0D4D\u0D24\u0D15\u0D7E"}
        className="scroll-mt-[140px]"
      >
        <div className="flex items-center justify-center py-10">
          <div className="spinner" />
        </div>
      </GrafanaPanel>
    );
  }

  if (!payload) return null;

  return (
    <GrafanaPanel
      id="latest-news"
      title="Latest headlines."
      subtitle={"\u0D0F\u0D31\u0D4D\u0D31\u0D35\u0D41\u0D02 \u0D2A\u0D41\u0D24\u0D3F\u0D2F \u0D35\u0D3E\u0D7C\u0D24\u0D4D\u0D24\u0D15\u0D7E"}
      className="stagger-3 flex max-h-[min(85vh,900px)] scroll-mt-[140px] flex-col"
      contentClassName="flex min-h-0 flex-1 flex-col !pb-3"
      rightSlot={
        <button
          type="button"
          onClick={() => pull({ soft: true })}
          disabled={refreshing}
          className="btn-secondary h-8 px-3 font-mono text-[11px] disabled:opacity-50 cursor-pointer"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      }
    >
      {payload.error && (
        <p className="mb-3 rounded-md border border-[var(--hairline-soft)] bg-[var(--surface-card)] px-3 py-2 text-[13px] text-[var(--mute)]">
          {payload.error}
        </p>
      )}
      {payload.items.length === 0 && !payload.error && (
        <p className="text-sm text-[var(--mute)]">No stories returned.</p>
      )}
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {payload.items.map((item) => (
          <li key={item.link}>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="sub-pin flex gap-3 p-4 no-underline"
              style={{ color: "inherit" }}
            >
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] font-bold tracking-wider text-[var(--primary)] uppercase">
                  {item.source}
                </div>
                <div className="mt-1.5 line-clamp-2 text-[14px] font-semibold leading-snug tracking-[-0.2px] text-[var(--ink)]">
                  {item.title}
                </div>
                <div className="mt-2 font-mono text-[11px] text-[var(--mute)]">
                  {item.pubDate ? formatRelative(item.pubDate) : ""}
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </GrafanaPanel>
  );
}
