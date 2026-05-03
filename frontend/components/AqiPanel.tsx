"use client";

import { useCallback, useEffect, useState } from "react";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import type { AqiPayload, AqiCityData } from "@/app/api/aqi/route";

const REFRESH_MS = 10 * 60 * 1000; // 10 min

/** European AQI (0–500 scale from Open-Meteo) → label + colour */
function aqiMeta(idx: number | null): { label: string; color: string } {
  if (idx === null) return { label: "N/A", color: "var(--gf-text-muted)" };
  if (idx <= 20)  return { label: "Good",           color: "var(--gf-live)" };
  if (idx <= 40)  return { label: "Fair",            color: "#a8d08d" };
  if (idx <= 60)  return { label: "Moderate",        color: "var(--gf-warn)" };
  if (idx <= 80)  return { label: "Poor",            color: "#e07b39" };
  if (idx <= 100) return { label: "Very Poor",       color: "var(--gf-danger)" };
  return           { label: "Extremely Poor",  color: "#9b1c1c" };
}

function pm25Bar(val: number | null) {
  // WHO 24h guideline: 15 µg/m³; danger: 75+
  const pct = val === null ? 0 : Math.min(100, (val / 75) * 100);
  const color =
    val === null
      ? "var(--gf-panel-border)"
      : val <= 15
        ? "var(--gf-live)"
        : val <= 35
          ? "var(--gf-warn)"
          : "var(--gf-danger)";
  return { pct, color };
}

function CityAqiRow({ city }: { city: AqiCityData }) {
  const meta = aqiMeta(city.aqi_index);
  const bar = pm25Bar(city.pm2_5);
  return (
    <div className="gf-subpanel p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-[0.8rem] font-semibold text-[var(--gf-text)]">
            {city.district}
          </span>
          <span className="ml-1.5 font-mono text-[0.62rem] text-[var(--gf-text-muted)]">
            {city.cityLabel}
          </span>
        </div>
        <span
          className="rounded-sm px-2 py-0.5 font-mono text-[0.62rem] font-bold"
          style={{ color: meta.color, background: `${meta.color}22`, border: `1px solid ${meta.color}55` }}
        >
          {meta.label}
        </span>
      </div>
      {/* PM2.5 bar */}
      <div className="mt-2">
        <div className="mb-1 flex justify-between font-mono text-[0.6rem] text-[var(--gf-text-muted)]">
          <span>PM2.5</span>
          <span>{city.pm2_5 !== null ? `${city.pm2_5.toFixed(1)} µg/m³` : "—"}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--gf-panel-border)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${bar.pct}%`, background: bar.color }}
          />
        </div>
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[0.6rem] text-[var(--gf-text-muted)]">
        <span>PM10</span>
        <span>{city.pm10 !== null ? `${city.pm10.toFixed(1)} µg/m³` : "—"}</span>
      </div>
    </div>
  );
}

export function AqiPanel() {
  const [data, setData] = useState<AqiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>("Ernakulam");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/aqi?t=${Date.now()}`, { cache: "no-store" });
      const json = (await res.json()) as AqiPayload;
      setData(json);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const mlSub = "വായു ഗുണനിലവാരം";

  const detail = data?.cities.find((c) => c.district === selected);

  return (
    <GrafanaPanel
      id="aqi"
      title="Air quality index"
      subtitle={mlSub}
      className="kt-animate-in kt-stagger-2 scroll-mt-[120px]"
      rightSlot={
        <span className="font-mono text-[10px] font-semibold tracking-wider text-[var(--gf-text-muted)]">
          AQI / PM
        </span>
      }
    >
      {loading && (
        <div className="py-8 text-center text-[0.85rem] text-[var(--gf-text-muted)]">
          <div className="kt-spinner" />
          Loading air quality…
        </div>
      )}
      {!loading && data?.error && (
        <p className="rounded-sm border border-[var(--gf-danger)]/40 bg-[rgba(226,77,77,0.1)] px-3 py-2 text-[0.82rem] text-[var(--gf-danger)]">
          {data.error}
        </p>
      )}
      {!loading && data && !data.error && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Detail card */}
          <div className="lg:col-span-1">
            {detail && <CityAqiRow city={detail} />}
            <p className="mt-2 font-mono text-[0.62rem] text-[var(--gf-text-muted)]">
              European AQI scale · PM2.5 WHO guideline 15 µg/m³
            </p>
          </div>
          {/* District chips */}
          <div className="lg:col-span-2">
            <p className="mb-2 font-mono text-[0.68rem] font-semibold tracking-wide text-[var(--gf-text-muted)] uppercase">
              All districts
            </p>
            <div className="flex max-h-52 flex-wrap gap-2 overflow-y-auto pr-1 lg:max-h-64">
              {data.cities.map((c) => {
                const meta = aqiMeta(c.aqi_index);
                const sel = c.district === selected;
                return (
                  <button
                    key={c.district}
                    type="button"
                    onClick={() => setSelected(c.district)}
                    className="kt-card-hover rounded-sm border px-2.5 py-1.5 text-left text-[0.72rem] transition-transform"
                    style={{
                      borderColor: sel ? "var(--gf-accent)" : "var(--gf-panel-border)",
                      background: sel ? "var(--gf-accent-soft)" : "var(--gf-panel-inner)",
                      color: sel ? "var(--gf-text)" : "var(--gf-text-muted)",
                    }}
                  >
                    <span className="font-semibold">{c.district}</span>
                    <span
                      className="ml-1.5 font-mono text-[0.6rem]"
                      style={{ color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    {c.pm2_5 !== null && (
                      <span className="mt-0.5 block font-mono text-[0.6rem] opacity-80">
                        {c.pm2_5.toFixed(1)} µg/m³
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </GrafanaPanel>
  );
}
