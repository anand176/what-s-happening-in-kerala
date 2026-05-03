"use client";

import { useCallback, useEffect, useState } from "react";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import type { QuakePayload, QuakeFeature } from "@/app/api/earthquakes/route";

const REFRESH_MS = 15 * 60 * 1000; // 15 min

function magColor(mag: number): string {
  if (mag < 2) return "var(--gf-text-muted)";
  if (mag < 3) return "var(--gf-live)";
  if (mag < 4) return "var(--gf-warn)";
  if (mag < 5) return "#e07b39";
  return "var(--gf-danger)";
}

function magLabel(mag: number): string {
  if (mag < 2) return "Micro";
  if (mag < 3) return "Minor";
  if (mag < 4) return "Light";
  if (mag < 5) return "Moderate";
  return "Strong";
}

function timeAgo(epochMs: number): string {
  const diff = Date.now() - epochMs;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function QuakeRow({ q }: { q: QuakeFeature }) {
  const color = magColor(q.magnitude);
  return (
    <a
      href={q.url}
      target="_blank"
      rel="noopener noreferrer"
      className="kt-card-hover gf-subpanel flex items-start gap-3 p-3 no-underline"
      style={{ color: "inherit" }}
    >
      {/* Magnitude badge */}
      <div
        className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-sm border font-mono font-bold"
        style={{ borderColor: `${color}55`, background: `${color}18`, color }}
      >
        <span className="text-[1.1rem] leading-none">{q.magnitude.toFixed(1)}</span>
        <span className="text-[0.52rem] font-semibold uppercase opacity-80">M</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-sm px-1.5 py-0.5 font-mono text-[0.58rem] font-bold uppercase"
            style={{ color, background: `${color}22` }}
          >
            {magLabel(q.magnitude)}
          </span>
          <span className="font-mono text-[0.62rem] text-[var(--gf-text-muted)]">
            {timeAgo(q.time)}
          </span>
        </div>
        <div className="mt-1 line-clamp-2 text-[0.82rem] leading-snug text-[var(--gf-text)]">
          {q.place}
        </div>
        <div className="mt-1 font-mono text-[0.6rem] text-[var(--gf-text-muted)]">
          Depth {q.depth.toFixed(1)} km · {q.lat.toFixed(2)}°N {q.lon.toFixed(2)}°E
        </div>
      </div>
    </a>
  );
}

export function EarthquakePanel() {
  const [data, setData] = useState<QuakePayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/earthquakes?t=${Date.now()}`, { cache: "no-store" });
      const json = (await res.json()) as QuakePayload;
      setData(json);
    } catch {
      /* keep previous data */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const mlSub = "ഭൂകമ്പ നിരീക്ഷണം";

  return (
    <GrafanaPanel
      id="earthquakes"
      title="Seismic activity"
      subtitle={mlSub}
      className="kt-animate-in kt-stagger-3 scroll-mt-[120px]"
      rightSlot={
        <span className="font-mono text-[10px] font-semibold tracking-wider text-[var(--gf-text-muted)]">
          SEISMIC · 30d
        </span>
      }
    >
      {loading && (
        <div className="py-8 text-center text-[0.85rem] text-[var(--gf-text-muted)]">
          <div className="kt-spinner" />
          Loading seismic data…
        </div>
      )}
      {!loading && data?.error && (
        <p className="rounded-sm border border-[var(--gf-danger)]/40 bg-[rgba(226,77,77,0.1)] px-3 py-2 text-[0.82rem] text-[var(--gf-danger)]">
          {data.error}
        </p>
      )}
      {!loading && data && !data.error && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[0.72rem] text-[var(--gf-live)]">
              {data.count} event{data.count !== 1 ? "s" : ""} in last 30 days
            </span>
            <span className="font-mono text-[0.68rem] text-[var(--gf-text-muted)]">
              Kerala region · M ≥ 1.0
            </span>
          </div>
          {data.quakes.length === 0 ? (
            <p className="py-4 text-center text-[0.85rem] text-[var(--gf-text-muted)]">
              No significant seismic activity in the last 30 days.
            </p>
          ) : (
            <ul className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto pr-1">
              {data.quakes.map((q) => (
                <li key={q.id}>
                  <QuakeRow q={q} />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 font-mono text-[0.62rem] text-[var(--gf-text-muted)]">
            Kerala region · M ≥ 1.0 · last 30 days
          </p>
        </>
      )}
    </GrafanaPanel>
  );
}
