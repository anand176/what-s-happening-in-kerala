"use client";

import React, { useCallback, useEffect, useState } from "react";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import type { AqiPayload } from "@/app/api/aqi/route";
import type { QuakePayload } from "@/app/api/earthquakes/route";
import { keralaMainCities, openMeteoMultiCityUrl } from "@/config/kerala-cities";
import { weatherCodeLabel } from "@/lib/weather";

function aqiMeta(idx: number | null): { label: string; color: string } {
  if (idx === null) return { label: "N/A", color: "var(--mute)" };
  if (idx <= 20) return { label: "Good", color: "var(--primary)" };
  if (idx <= 40) return { label: "Fair", color: "#a8d08d" };
  if (idx <= 60) return { label: "Moderate", color: "var(--warning-deep)" };
  if (idx <= 80) return { label: "Poor", color: "#e07b39" };
  if (idx <= 100) return { label: "Very Poor", color: "var(--error)" };
  return { label: "Ext. Poor", color: "#9b1c1c" };
}

function magColor(mag: number): string {
  if (mag < 2) return "var(--mute)";
  if (mag < 3) return "var(--primary)";
  if (mag < 4) return "var(--warning-deep)";
  if (mag < 5) return "#e07b39";
  return "var(--error)";
}

function timeAgo(epochMs: number): string {
  const diff = Date.now() - epochMs;
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="spinner" />
    </div>
  );
}

// ─── City Weather ─────────────────────────────────────────────────────────────

type WeatherRow = { district: string; temperature: number; weathercode: number; windspeed: number };

function CityWeatherPanel() {
  const [rows, setRows] = useState<WeatherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setRefreshing(true);
    fetch(openMeteoMultiCityUrl())
      .then((r) => r.json())
      .then((json) => {
        const list = Array.isArray(json) ? json : [json];
        setRows(keralaMainCities.map((c, i) => ({
          district: c.district,
          temperature: list[i]?.current_weather?.temperature ?? 0,
          weathercode: list[i]?.current_weather?.weathercode ?? 0,
          windspeed: list[i]?.current_weather?.windspeed ?? 0,
        })));
        setLoading(false);
        setRefreshing(false);
      })
      .catch(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <GrafanaPanel 
      title="City Weather" 
      rightSlot={
        <div className="flex items-center gap-2">
          <span className="badge badge-live text-[9px]">LIVE</span>
          <button
            type="button"
            onClick={load}
            disabled={refreshing}
            className="btn-secondary h-7 px-2.5 font-mono text-[10px] disabled:opacity-50"
          >
            {refreshing ? "⟳" : "↻"}
          </button>
        </div>
      }
      id="weather-section" 
      className="scroll-mt-[140px]"
    >
      {loading ? <Spinner /> : (
        <div className="divide-y divide-[var(--hairline-soft)]">
          {rows.map((r) => (
            <div key={r.district} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-card)] transition-colors">
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-[var(--ink)]">{r.district}</div>
                <div className="font-mono text-[11px] text-[var(--mute)]">
                  {weatherCodeLabel(r.weathercode)} · {r.windspeed} km/h
                </div>
              </div>
              <span className="ml-3 font-mono text-[16px] font-bold text-[var(--ink)]">
                {Math.round(r.temperature)}°
              </span>
            </div>
          ))}
        </div>
      )}
    </GrafanaPanel>
  );
}

// ─── Air Quality ──────────────────────────────────────────────────────────────

function AirQualityPanel() {
  const [data, setData] = useState<AqiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/aqi?t=${Date.now()}`, { cache: "no-store" });
      setData(await res.json());
    } catch { /* keep */ } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = window.setInterval(load, 10 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <GrafanaPanel 
      title="Air Quality" 
      id="aqi" 
      className="scroll-mt-[140px]"
      rightSlot={
        <button
          type="button"
          onClick={load}
          disabled={refreshing}
          className="btn-secondary h-7 px-2.5 font-mono text-[10px] disabled:opacity-50"
        >
          {refreshing ? "⟳" : "↻"}
        </button>
      }
    >
      {loading ? <Spinner /> : (
        <div className="divide-y divide-[var(--hairline-soft)]">
          {(data?.cities ?? []).map((c) => {
            const meta = aqiMeta(c.aqi_index);
            return (
              <div key={c.district} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-card)] transition-colors">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-[var(--ink)]">{c.district}</div>
                  {c.pm2_5 !== null && (
                    <div className="font-mono text-[11px] text-[var(--mute)]">PM2.5 {c.pm2_5.toFixed(1)} µg/m³</div>
                  )}
                </div>
                <div className="ml-3 flex items-center gap-2">
                  {c.aqi_index !== null && (
                    <span className="font-mono text-[16px] font-bold" style={{ color: meta.color }}>{c.aqi_index}</span>
                  )}
                  <span className="w-14 text-right font-mono text-[11px] font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GrafanaPanel>
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

  return (
    <GrafanaPanel
      title="Earthquakes"
      rightSlot={data ? <span className="badge badge-count">{data.count}</span> : null}
      id="earthquakes-detail"
      className="scroll-mt-[140px]"
    >
      {loading ? <Spinner /> : !data?.quakes.length ? (
        <div className="px-4 py-6 text-center font-mono text-[12px] text-[var(--mute)]">
          No significant activity in last 30 days.
        </div>
      ) : (
        <div className="divide-y divide-[var(--hairline-soft)]">
          {data.quakes.slice(0, 20).map((q) => (
            <a
              key={q.id}
              href={q.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-2.5 no-underline hover:bg-[var(--surface-card)] transition-colors"
              style={{ color: "inherit" }}
            >
              <div className="min-w-0 flex-1 pr-2">
                <div className="truncate text-[13px] text-[var(--ink)]">{q.place}</div>
                <div className="font-mono text-[11px] text-[var(--mute)]">
                  {timeAgo(q.time)} · {q.depth.toFixed(0)} km deep
                </div>
              </div>
              <span className="shrink-0 font-mono text-[16px] font-bold" style={{ color: magColor(q.magnitude) }}>
                M{q.magnitude.toFixed(1)}
              </span>
            </a>
          ))}
        </div>
      )}
    </GrafanaPanel>
  );
}

export function GrafanaDashRow() {
  return (
    <>
      <CityWeatherPanel />
    </>
  );
}

export function AirQualitySection() {
  return <AirQualityPanel />;
}

export function EarthquakesSection() {
  return <EarthquakesPanel />;
}
