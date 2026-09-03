"use client";

import { useCallback, useEffect, useState } from "react";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import { PanelRefreshButton } from "@/components/grafana/PanelRefreshButton";
import type { ReservoirPayload, ReservoirAlert } from "@/app/api/reservoirs/route";
import { tint } from "@/lib/color";

const REFRESH_MS = 30 * 60 * 1000;

function alertColor(a: ReservoirAlert): string {
  switch (a) {
    case "Normal": return "var(--gf-live)";
    case "Blue": return "var(--gf-info)";
    case "Orange": return "var(--gf-warn)";
    case "Red": return "var(--gf-danger)";
  }
}

function fillColor(pct: number): string {
  if (pct >= 90) return "var(--gf-danger)";
  if (pct >= 75) return "var(--gf-warn)";
  if (pct >= 40) return "var(--gf-live)";
  return "var(--gf-info)";
}

export function ReservoirPanel() {
  const [data, setData] = useState<ReservoirPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/reservoirs?t=${Date.now()}`, { cache: "no-store" });
      setData((await res.json()) as ReservoirPayload);
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

  const alerts = data?.dams.filter((d) => d.alert !== "Normal") ?? [];

  return (
    <GrafanaPanel
      id="reservoirs"
      title="Reservoir levels"
      subtitle="അണക്കെട്ടുകളുടെ ജലനിരപ്പ്"
      className="kt-animate-in gf-anchor"
      rightSlot={
        <div className="flex shrink-0 items-center gap-2">
          <PanelRefreshButton onClick={load} ariaLabel="Refresh reservoir levels" />
          <span className="font-mono text-[10px] font-semibold tracking-wider text-[var(--gf-text-muted)]">
            DAMS
          </span>
        </div>
      }
    >
      {loading && (
        <div className="py-8 text-center text-[0.85rem] text-[var(--gf-text-muted)]">
          <div className="kt-spinner" />
          Loading reservoir levels…
        </div>
      )}

      {!loading && data && (
        <>

          {alerts.length > 0 && (
            <div className="mb-3 rounded-sm border border-[var(--gf-warn)]/40 bg-[rgba(245,166,35,0.1)] px-3 py-2 text-[0.8rem] text-[var(--gf-warn)]">
              <strong className="font-semibold">Alert level reached:</strong>{" "}
              {alerts.map((a) => `${a.name} (${a.alert})`).join(", ")}
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            {data.dams.map((d) => {
              const aColor = alertColor(d.alert);
              const bColor = fillColor(d.fillPercent);
              return (
                <div key={d.name} className="gf-subpanel kt-card-hover p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-[0.85rem] font-semibold text-[var(--gf-text)]">
                        {d.name}
                      </div>
                      <div className="font-mono text-[0.58rem] text-[var(--gf-text-muted)]">
                        {d.district} · {d.operator}
                      </div>
                    </div>
                    <span
                      className="shrink-0 rounded-sm px-1.5 py-0.5 font-mono text-[0.55rem] font-bold uppercase"
                      style={{ color: aColor, background: tint(aColor, 13), border: `1px solid ${tint(aColor, 33)}` }}
                    >
                      {d.alert}
                    </span>
                  </div>

                  <div className="mt-2 flex items-end justify-between gap-2">
                    <div className="flex items-end gap-1.5">
                      <span className="font-mono text-[1.3rem] leading-none font-bold" style={{ color: bColor }}>
                        {d.currentLevel}
                      </span>
                      <span className="font-mono text-[0.6rem] text-[var(--gf-text-muted)]">
                        {d.unit} / FRL {d.frl} {d.unit}
                      </span>
                    </div>
                    <span className="font-mono text-[0.72rem] font-bold text-[var(--gf-text)]">
                      {d.fillPercent}%
                    </span>
                  </div>

                  <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--gf-panel-border)]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${d.fillPercent}%`, background: bColor }}
                    />
                  </div>

                  <div className="mt-1.5 flex justify-between font-mono text-[0.55rem] text-[var(--gf-text-muted)]">
                    <span>Blue {d.blueAlert}</span>
                    <span>Orange {d.orangeAlert}</span>
                    <span>Red {d.redAlert}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-3 font-mono text-[0.62rem] text-[var(--gf-text-muted)]">
            Indicative levels · as of {data.asOf} · refer to the official KSEB bulletin for
            operational decisions
          </p>
        </>
      )}
    </GrafanaPanel>
  );
}
