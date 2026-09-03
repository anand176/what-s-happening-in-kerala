"use client";

import { useCallback, useEffect, useState } from "react";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import { PanelRefreshButton } from "@/components/grafana/PanelRefreshButton";
import type { RainfallPayload, RainCategory } from "@/app/api/rainfall/route";
import { tint } from "@/lib/color";

const REFRESH_MS = 15 * 60 * 1000;

function catColor(c: RainCategory): string {
  switch (c) {
    case "None": return "var(--gf-text-muted)";
    case "Light": return "var(--gf-live)";
    case "Moderate": return "var(--gf-info)";
    case "Heavy": return "var(--gf-warn)";
    case "Very Heavy": return "#e07b39";
    case "Extremely Heavy": return "var(--gf-danger)";
  }
}

/** Bar scale tops out at 120 mm so ordinary monsoon days stay readable. */
function barPct(mm: number | null): number {
  if (mm === null) return 0;
  return Math.min(100, (mm / 120) * 100);
}

export function RainfallPanel() {
  const [data, setData] = useState<RainfallPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/rainfall?t=${Date.now()}`, { cache: "no-store" });
      setData((await res.json()) as RainfallPayload);
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

  const watches = data?.districts.filter((d) => d.floodWatch) ?? [];

  return (
    <GrafanaPanel
      id="rainfall"
      title="Rainfall & flood watch"
      subtitle="മഴയും വെള്ളപ്പൊക്ക നിരീക്ഷണവും"
      className="kt-animate-in gf-anchor"
      rightSlot={
        <div className="flex shrink-0 items-center gap-2">
          <PanelRefreshButton onClick={load} ariaLabel="Refresh rainfall data" />
          <span className="font-mono text-[10px] font-semibold tracking-wider text-[var(--gf-text-muted)]">
            RAIN · 5D
          </span>
        </div>
      }
    >
      {loading && (
        <div className="py-8 text-center text-[0.85rem] text-[var(--gf-text-muted)]">
          <div className="kt-spinner" />
          Loading rainfall data…
        </div>
      )}

      {!loading && data?.error && (
        <p className="rounded-sm border border-[var(--gf-danger)]/40 bg-[rgba(226,77,77,0.1)] px-3 py-2 text-[0.82rem] text-[var(--gf-danger)]">
          {data.error}
        </p>
      )}

      {!loading && data && !data.error && (
        <>
          {watches.length > 0 && (
            <div className="mb-3 rounded-sm border border-[var(--gf-warn)]/40 bg-[rgba(245,166,35,0.1)] px-3 py-2 text-[0.8rem] text-[var(--gf-warn)]">
              <strong className="font-semibold">Saturation watch:</strong>{" "}
              {watches.map((w) => w.district).join(", ")} — heavy rain in the last 48 h with more forecast.
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            {data.districts.map((d) => {
              const color = catColor(d.category);
              return (
                <div key={d.district} className="gf-subpanel kt-card-hover p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[0.85rem] font-semibold text-[var(--gf-text)]">
                      {d.district}
                    </span>
                    <span
                      className="shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-[0.55rem] font-bold uppercase"
                      style={{ color, background: tint(color, 13), border: `1px solid ${tint(color, 33)}` }}
                    >
                      {d.category}
                    </span>
                  </div>

                  <div className="mt-2 flex items-end gap-2">
                    <span className="font-mono text-[1.35rem] leading-none font-bold" style={{ color }}>
                      {d.todayMm !== null ? d.todayMm.toFixed(1) : "—"}
                    </span>
                    <span className="font-mono text-[0.6rem] text-[var(--gf-text-muted)]">mm today</span>
                  </div>

                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--gf-panel-border)]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${barPct(d.todayMm)}%`, background: color }}
                    />
                  </div>

                  <dl className="mt-2 grid grid-cols-3 gap-1 font-mono text-[0.58rem] text-[var(--gf-text-muted)]">
                    <div>
                      <dt className="opacity-80">PAST 48H</dt>
                      <dd className="text-[var(--gf-text)]">
                        {d.past48hMm !== null ? `${d.past48hMm} mm` : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="opacity-80">NEXT 5D</dt>
                      <dd className="text-[var(--gf-text)]">
                        {d.next5dMm !== null ? `${d.next5dMm} mm` : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="opacity-80">MAX PROB</dt>
                      <dd className="text-[var(--gf-text)]">
                        {d.maxProbability !== null ? `${d.maxProbability}%` : "—"}
                      </dd>
                    </div>
                  </dl>

                  {d.floodWatch && (
                    <p className="mt-1.5 font-mono text-[0.55rem] font-bold text-[var(--gf-warn)]">
                      ⚠ SATURATION WATCH
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-3 font-mono text-[0.62rem] text-[var(--gf-text-muted)]">
            Open-Meteo forecast · IMD 24 h rainfall categories · not an official IMD warning
          </p>
        </>
      )}
    </GrafanaPanel>
  );
}
