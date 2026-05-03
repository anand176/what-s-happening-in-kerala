"use client";

import { useEffect, useState } from "react";

type NewsItem = { title: string; source: string };
type NewsPayload = { items: NewsItem[]; error: string | null };

const FALLBACK = "Kerala Monitor — live news, weather, markets and more";

const REFRESH_MS = 5 * 60 * 1000; // refresh every 5 min

function buildTickerText(items: NewsItem[]): string {
  if (!items.length) return FALLBACK;
  return items
    .slice(0, 12)
    .map((i) => i.title)
    .join("  \u00A0•\u00A0  ");
}

export function AlertBanner() {
  const [tickerText, setTickerText] = useState(FALLBACK);
  const [hasAlert, setHasAlert] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/news?limit=12", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as NewsPayload;
        if (cancelled) return;
        if (json.items?.length) {
          setTickerText(buildTickerText(json.items));
          // flag as alert if any headline contains alert keywords
          const alertWords = /alert|warning|flood|cyclone|landslide|earthquake|red|orange|yellow/i;
          setHasAlert(json.items.some((i) => alertWords.test(i.title)));
        }
      } catch {
        /* keep fallback */
      }
    }

    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const doubled = `${tickerText} \u00A0\u00A0\u2022\u00A0\u00A0 ${tickerText}`;

  return (
    <div
      className="flex items-center gap-2 overflow-hidden border-b border-[var(--gf-panel-border)] px-3 py-2 font-mono text-[0.72rem] text-[var(--gf-text)] md:px-5"
      style={{ background: "var(--gf-ticker-bg)" }}
    >
      <span
        className="shrink-0 rounded-sm px-1.5 py-0.5 text-[0.58rem] font-bold tracking-wider text-[#0b0f14]"
        style={{ background: hasAlert ? "var(--gf-danger)" : "var(--gf-accent)" }}
      >
        {hasAlert ? "🚨 BREAKING" : "📰 LATEST"}
      </span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="kt-ticker-track whitespace-nowrap">
          <span className="inline-block pr-16">{doubled}</span>
          <span className="inline-block pr-16">{doubled}</span>
        </div>
      </div>
    </div>
  );
}
