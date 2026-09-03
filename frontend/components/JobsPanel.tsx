"use client";

import { useCallback, useEffect, useState } from "react";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import { PanelRefreshButton } from "@/components/grafana/PanelRefreshButton";
import type { JobsPayload } from "@/app/api/jobs/route";

const REFRESH_MS = 30 * 60 * 1000;

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function JobsPanel() {
  const [data, setData] = useState<JobsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs?t=${Date.now()}`, { cache: "no-store" });
      setData((await res.json()) as JobsPayload);
    } catch {
      /* keep previous */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <GrafanaPanel
      id="jobs"
      title="Govt jobs & exams"
      subtitle="സർക്കാർ ജോലി അറിയിപ്പുകൾ"
      className="kt-animate-in gf-anchor"
      rightSlot={
        <div className="flex shrink-0 items-center gap-2">
          <PanelRefreshButton onClick={load} ariaLabel="Refresh job notifications" />
          <span className="font-mono text-[10px] font-semibold tracking-wider text-[var(--gf-text-muted)]">
            NOTIFICATIONS
          </span>
        </div>
      }
    >
      {loading && (
        <div className="py-8 text-center text-[0.85rem] text-[var(--gf-text-muted)]">
          <div className="kt-spinner" />
          Loading notifications…
        </div>
      )}

      {!loading && data && (
        <>
          {data.error && (
            <p className="mb-3 rounded-sm border border-[var(--gf-warn)]/40 bg-[rgba(245,166,35,0.1)] px-3 py-2 text-[0.78rem] text-[var(--gf-warn)]">
              {data.error}
            </p>
          )}

          {data.items.length === 0 ? (
            <p className="py-4 text-center text-[0.85rem] text-[var(--gf-text-muted)]">
              No notifications loaded. Feeds are configurable in{" "}
              <code className="font-mono text-[var(--gf-accent)]">config/sources.ts</code> →{" "}
              <code className="font-mono text-[var(--gf-accent)]">jobsRssFeeds</code>.
            </p>
          ) : (
            <ul className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto pr-1">
              {data.items.map((j) => (
                <li key={j.link}>
                  <a
                    href={j.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="kt-card-hover gf-subpanel block p-3 no-underline"
                    style={{ color: "inherit" }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-sm border border-[var(--gf-panel-border)] bg-[var(--gf-panel-inner)] px-1.5 py-0.5 font-mono text-[0.55rem] font-bold text-[var(--gf-accent)] uppercase">
                        {j.source}
                      </span>
                      <span className="font-mono text-[0.6rem] text-[var(--gf-text-muted)]">
                        {timeAgo(j.pubDate)}
                      </span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-[0.84rem] leading-snug text-[var(--gf-text)]">
                      {j.title}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 font-mono text-[0.62rem] text-[var(--gf-text-muted)]">
            {data.sources} · Kerala PSC has no public RSS — add feeds in config/sources.ts
          </p>
        </>
      )}
    </GrafanaPanel>
  );
}
