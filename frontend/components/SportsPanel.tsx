"use client";

import { useCallback, useEffect, useState } from "react";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import { PanelRefreshButton } from "@/components/grafana/PanelRefreshButton";
import type { SportsPayload } from "@/app/api/sports/route";
import { tint } from "@/lib/color";

const REFRESH_MS = 30 * 60 * 1000;

function formatDate(d: string | null): string {
  if (!d) return "TBD";
  const dt = new Date(`${d}T12:00:00`);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function SportsPanel() {
  const [data, setData] = useState<SportsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/sports?t=${Date.now()}`, { cache: "no-store" });
      setData((await res.json()) as SportsPayload);
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
      id="sports"
      title="Kerala sports"
      subtitle="കായിക വാർത്തകൾ"
      className="kt-animate-in gf-anchor"
      rightSlot={
        <div className="flex shrink-0 items-center gap-2">
          <PanelRefreshButton onClick={load} ariaLabel="Refresh sports fixtures" />
          <span className="font-mono text-[10px] font-semibold tracking-wider text-[var(--gf-text-muted)]">
            FIXTURES
          </span>
        </div>
      }
    >
      {loading && (
        <div className="py-8 text-center text-[0.85rem] text-[var(--gf-text-muted)]">
          <div className="kt-spinner" />
          Loading fixtures…
        </div>
      )}

      {!loading && data?.error && (
        <p className="rounded-sm border border-[var(--gf-danger)]/40 bg-[rgba(226,77,77,0.1)] px-3 py-2 text-[0.82rem] text-[var(--gf-danger)]">
          {data.error}
        </p>
      )}

      {!loading && data && !data.error && (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {data.teams.map((t) => (
              <div key={t.label} className="gf-subpanel overflow-hidden">
                <div className="flex items-center gap-3 border-b border-[var(--gf-panel-border)] px-3 py-2.5">
                  {t.badge ? (
                    <img
                      src={t.badge}
                      alt={t.teamName ?? t.label}
                      className="h-8 w-8 shrink-0 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center text-lg" aria-hidden>
                      {t.sport === "Cricket" ? "\u{1F3CF}" : "\u26BD"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[0.85rem] font-semibold text-[var(--gf-text)]">
                      {t.teamName ?? t.label}
                    </p>
                    <p className="font-mono text-[0.58rem] text-[var(--gf-text-muted)]">
                      {t.league ?? t.sport}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 p-3">
                  {t.fixtures.length === 0 ? (
                    <p className="text-[0.78rem] text-[var(--gf-text-muted)]">
                      {t.note ?? "No fixtures available."}
                    </p>
                  ) : (
                    t.fixtures.map((f) => {
                      const isResult = f.status === "result";
                      const color = isResult ? "var(--gf-text-muted)" : "var(--gf-live)";
                      return (
                        <div
                          key={f.id}
                          className="rounded-sm border border-[var(--gf-panel-border)] bg-[var(--gf-panel-inner)] px-2.5 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="rounded-sm px-1.5 py-0.5 font-mono text-[0.52rem] font-bold uppercase"
                              style={{ color, background: tint(color, 13) }}
                            >
                              {isResult ? "Result" : "Upcoming"}
                            </span>
                            <span className="font-mono text-[0.58rem] text-[var(--gf-text-muted)]">
                              {formatDate(f.date)}
                              {f.time ? ` · ${f.time}` : ""}
                            </span>
                          </div>
                          <div className="mt-1 line-clamp-2 text-[0.78rem] leading-snug text-[var(--gf-text)]">
                            {f.event}
                          </div>
                          {isResult && f.homeScore !== null && f.awayScore !== null && (
                            <div className="mt-0.5 font-mono text-[0.72rem] font-bold text-[var(--gf-accent)]">
                              {f.homeScore} – {f.awayScore}
                            </div>
                          )}
                          {f.venue && (
                            <div className="mt-0.5 truncate font-mono text-[0.55rem] text-[var(--gf-text-muted)]">
                              {f.venue}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 font-mono text-[0.62rem] text-[var(--gf-text-muted)]">
            TheSportsDB · set THESPORTSDB_KEY for full fixture access · teams configurable in config/sources.ts
          </p>
        </>
      )}
    </GrafanaPanel>
  );
}
