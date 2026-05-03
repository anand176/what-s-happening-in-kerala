"use client";

import { useCallback, useEffect, useState } from "react";
import type { AqiPayload } from "@/app/api/aqi/route";
import type { QuakePayload } from "@/app/api/earthquakes/route";
import { keralaMainCities, openMeteoMultiCityUrl } from "@/config/kerala-cities";
import { weatherCodeLabel } from "@/lib/weather";

// ─── shared helpers ────────────────────────────────────────────────────────────

/** European AQI (EAQI) 0–500 → label + colour */
function aqiMeta(idx: number | null): { label: string; color: string } {
  if (idx === null) return { label: "N/A",        color: "var(--gf-text-muted)" };
  if (idx <= 20)   return { label: "Good",        color: "var(--gf-live)" };
  if (idx <= 40)   return { label: "Fair",        color: "#a8d08d" };
  if (idx <= 60)   return { label: "Moderate",    color: "var(--gf-warn)" };
  if (idx <= 80)   return { label: "Poor",        color: "#e07b39" };
  if (idx <= 100)  return { label: "Very Poor",   color: "var(--gf-danger)" };
  return            { label: "Ext. Poor",   color: "#9b1c1c" };
}

function magColor(mag: number): string {
  if (mag < 2) return "var(--gf-text-muted)";
  if (mag < 3) return "var(--gf-live)";
  if (mag < 4) return "var(--gf-warn)";
  if (mag < 5) return "#e07b39";
  return "var(--gf-danger)";
}

function timeAgo(epochMs: number): string {
  const diff = Date.now() - epochMs;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── mini-panel shell ─────────────────────────────────────────────────────────

function MiniPanel({
  title,
  badge,
  id,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="gf-panel flex min-w-0 flex-1 flex-col scroll-mt-[120px]">
      <div className="flex items-center gap-2 border-b border-[var(--gf-panel-border)] bg-black/20 px-3 py-2">
        <span className="flex-1 font-mono text-[0.68rem] font-semibold tracking-widest text-[var(--gf-text)] uppercase">
          {title}
        </span>
        {badge}
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="kt-spinner" />
    </div>
  );
}

// ─── City Weather ─────────────────────────────────────────────────────────────

type WeatherRow = {
  district: string;
  temperature: number;
  weathercode: number;
  windspeed: number;
};

function CityWeatherPanel() {
  const [rows, setRows] = useState<WeatherRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(openMeteoMultiCityUrl())
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const list = Array.isArray(json) ? json : [json];
        setRows(keralaMainCities.map((c, i) => ({
          district: c.district,
          temperature: list[i]?.current_weather?.temperature ?? 0,
          weathercode: list[i]?.current_weather?.weathercode ?? 0,
          windspeed: list[i]?.current_weather?.windspeed ?? 0,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const liveBadge = (
    <span className="rounded-sm bg-[var(--gf-live)] px-1.5 py-0.5 font-mono text-[0.55rem] font-bold text-black">
      LIVE
    </span>
  );

  return (
    <MiniPanel title="City Weather" badge={liveBadge} id="weather-section">
      {loading ? <Spinner /> : (
        <div className="divide-y divide-[var(--gf-panel-border)]">
          {rows.map((r) => (
            <div key={r.district} className="flex h-[52px] items-center justify-between px-3 hover:bg-white/[0.03]">
              <div className="min-w-0">
                <div className="truncate text-[0.75rem] font-medium text-[var(--gf-text)]">
                  {r.district}
                </div>
                <div className="font-mono text-[0.6rem] text-[var(--gf-text-muted)]">
                  {weatherCodeLabel(r.weathercode)} · {r.windspeed} km/h
                </div>
              </div>
              <div className="ml-3 shrink-0 font-mono text-[0.9rem] font-bold text-[var(--gf-accent)]">
                {Math.round(r.temperature)}°C
              </div>
            </div>
          ))}
        </div>
      )}
    </MiniPanel>
  );
}

// ─── Air Quality ──────────────────────────────────────────────────────────────

function AirQualityPanel() {
  const [data, setData] = useState<AqiPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/aqi?t=${Date.now()}`, { cache: "no-store" });
      setData(await res.json());
    } catch { /* keep */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = window.setInterval(load, 10 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <MiniPanel title="Air Quality" id="aqi">
      {loading ? <Spinner /> : (
        <div className="divide-y divide-[var(--gf-panel-border)]">
          {(data?.cities ?? []).map((c) => {
            const meta = aqiMeta(c.aqi_index);
            return (
              <div key={c.district} className="flex h-[52px] items-center justify-between px-3 hover:bg-white/[0.03]">
                <div className="min-w-0">
                  <div className="truncate text-[0.75rem] font-medium text-[var(--gf-text)]">
                    {c.district}
                  </div>
                  {c.pm2_5 !== null && (
                    <div className="font-mono text-[0.6rem] text-[var(--gf-text-muted)]">
                      PM2.5 {c.pm2_5.toFixed(1)} µg/m³
                    </div>
                  )}
                </div>
                <div className="ml-3 flex shrink-0 items-center gap-2">
                  {c.aqi_index !== null && (
                    <span className="font-mono text-[0.9rem] font-bold" style={{ color: meta.color }}>
                      {c.aqi_index}
                    </span>
                  )}
                  <span className="w-16 text-right font-mono text-[0.62rem] font-semibold" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MiniPanel>
  );
}

// ─── Earthquakes ──────────────────────────────────────────────────────────────

function EarthquakesPanel() {
  const [data, setData] = useState<QuakePayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/earthquakes?t=${Date.now()}`, { cache: "no-store" });
      setData(await res.json());
    } catch { /* keep */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = window.setInterval(load, 15 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [load]);

  const countBadge = data ? (
    <span className="rounded-sm bg-[var(--gf-warn)]/20 px-1.5 py-0.5 font-mono text-[0.6rem] font-bold text-[var(--gf-warn)]">
      {data.count}
    </span>
  ) : null;

  return (
    <MiniPanel title="Earthquakes & Disasters" badge={countBadge} id="earthquakes">
      {loading ? <Spinner /> : !data?.quakes.length ? (
        <div className="px-3 py-4 text-center font-mono text-[0.72rem] text-[var(--gf-text-muted)]">
          No significant activity in last 30 days
        </div>
      ) : (
        <div className="divide-y divide-[var(--gf-panel-border)]">
          {data.quakes.slice(0, 20).map((q) => {
            const color = magColor(q.magnitude);
            return (
              <a
                key={q.id}
                href={q.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 no-underline hover:bg-white/[0.03]"
                style={{ color: "inherit" }}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="truncate text-[0.72rem] text-[var(--gf-text)]">{q.place}</div>
                  <div className="font-mono text-[0.6rem] text-[var(--gf-text-muted)]">
                    {timeAgo(q.time)} · {q.depth.toFixed(0)} km deep
                  </div>
                </div>
                <div className="shrink-0 font-mono text-[1rem] font-bold" style={{ color }}>
                  M{q.magnitude.toFixed(1)}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </MiniPanel>
  );
}

// ─── Exported row ─────────────────────────────────────────────────────────────

export function GrafanaDashRow() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <CityWeatherPanel />
      <AirQualityPanel />
      <EarthquakesPanel />
    </div>
  );
}
