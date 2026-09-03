"use client";

import { useCallback, useEffect, useState } from "react";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import { PanelRefreshButton } from "@/components/grafana/PanelRefreshButton";
import { keralaAirports } from "@/config/sources";
import type { FlightsPayload } from "@/app/api/flights/route";

/** OpenSky anonymous quota is small — poll gently. */
const REFRESH_MS = 60 * 1000;

function metresToFeet(m: number | null): string {
  if (m === null) return "—";
  return `${Math.round((m * 3.28084) / 100) * 100} ft`;
}

function msToKmh(v: number | null): string {
  if (v === null) return "—";
  return `${Math.round(v * 3.6)} km/h`;
}

function compass(deg: number | null): string {
  if (deg === null) return "—";
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

export function FlightsPanel() {
  const [data, setData] = useState<FlightsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/flights?t=${Date.now()}`, { cache: "no-store" });
      setData((await res.json()) as FlightsPayload);
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

  const airborne = data?.flights.filter((f) => !f.onGround) ?? [];
  const onGround = data?.flights.filter((f) => f.onGround) ?? [];

  return (
    <GrafanaPanel
      id="flights"
      title="Kerala airspace"
      subtitle="വിമാന നിരീക്ഷണം"
      className="kt-animate-in gf-anchor"
      rightSlot={
        <div className="flex shrink-0 items-center gap-2">
          <PanelRefreshButton onClick={load} ariaLabel="Refresh live flights" />
          <span className="font-mono text-[10px] font-semibold tracking-wider text-[var(--gf-text-muted)]">
            LIVE ADS-B
          </span>
        </div>
      }
    >
      {loading && (
        <div className="py-8 text-center text-[0.85rem] text-[var(--gf-text-muted)]">
          <div className="kt-spinner" />
          Scanning airspace…
        </div>
      )}

      {!loading && data?.error && (
        <p className="mb-3 rounded-sm border border-[var(--gf-warn)]/40 bg-[rgba(245,166,35,0.1)] px-3 py-2 text-[0.8rem] text-[var(--gf-warn)]">
          {data.error}
        </p>
      )}

      {!loading && data && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[0.72rem] text-[var(--gf-live)]">
              {airborne.length} airborne
            </span>
            <span className="font-mono text-[0.72rem] text-[var(--gf-text-muted)]">
              {onGround.length} on ground
            </span>
            <span className="font-mono text-[0.68rem] text-[var(--gf-text-muted)]">
              {keralaAirports.map((a) => a.iata).join(" · ")}
            </span>
          </div>

          {data.flights.length === 0 ? (
            <p className="py-4 text-center text-[0.85rem] text-[var(--gf-text-muted)]">
              No aircraft currently reported over Kerala.
            </p>
          ) : (
            <div className="max-h-[min(70vh,480px)] overflow-y-auto pr-1">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 bg-[var(--gf-panel-bg)]">
                  <tr className="font-mono text-[0.55rem] tracking-wider text-[var(--gf-text-muted)] uppercase">
                    <th className="py-1.5 pr-2 font-semibold">Callsign</th>
                    <th className="hidden py-1.5 pr-2 font-semibold sm:table-cell">Origin</th>
                    <th className="py-1.5 pr-2 text-right font-semibold">Alt</th>
                    <th className="py-1.5 pr-2 text-right font-semibold">Speed</th>
                    <th className="hidden py-1.5 pr-2 text-center font-semibold sm:table-cell">Hdg</th>
                    <th className="py-1.5 text-right font-semibold">Near</th>
                  </tr>
                </thead>
                <tbody>
                  {data.flights.map((f) => (
                    <tr
                      key={f.icao24}
                      className="border-t border-[var(--gf-panel-border)] text-[0.72rem] text-[var(--gf-text)]"
                    >
                      <td className="py-1.5 pr-2 font-mono font-semibold text-[var(--gf-accent)]">
                        {f.callsign || f.icao24}
                        {f.onGround && (
                          <span className="ml-1.5 font-mono text-[0.5rem] text-[var(--gf-text-muted)]">
                            GND
                          </span>
                        )}
                      </td>
                      <td className="hidden max-w-[7rem] truncate py-1.5 pr-2 text-[var(--gf-text-muted)] sm:table-cell">
                        {f.originCountry}
                      </td>
                      <td className="py-1.5 pr-2 text-right font-mono tabular-nums">
                        {metresToFeet(f.altitude)}
                      </td>
                      <td className="py-1.5 pr-2 text-right font-mono tabular-nums">
                        {msToKmh(f.velocity)}
                      </td>
                      <td className="hidden py-1.5 pr-2 text-center font-mono text-[var(--gf-text-muted)] sm:table-cell">
                        {compass(f.heading)}
                      </td>
                      <td className="py-1.5 text-right font-mono text-[var(--gf-text-muted)]">
                        {f.nearestAirport} {f.nearestAirportKm}km
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-3 font-mono text-[0.62rem] text-[var(--gf-text-muted)]">
            Live ADS-B via OpenSky Network · updates every 60 s
          </p>
        </>
      )}
    </GrafanaPanel>
  );
}
