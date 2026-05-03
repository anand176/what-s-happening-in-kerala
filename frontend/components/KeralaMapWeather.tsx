"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { StyleFunction } from "leaflet";
import type { Feature, FeatureCollection, GeoJsonObject } from "geojson";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import { keralaMainCities, openMeteoMultiCityUrl } from "@/config/kerala-cities";
import { weatherCodeLabel } from "@/lib/weather";
import type { AqiPayload } from "@/app/api/aqi/route";
import type { WikiPayload } from "@/app/api/wiki-district/route";

// ─── types ────────────────────────────────────────────────────────────────────

type CurrentWeather = {
  time: string;
  temperature: number;
  windspeed: number;
  weathercode: number;
};

type ForecastBlock = {
  current_weather: CurrentWeather;
};

// ─── AQI helpers ──────────────────────────────────────────────────────────────

/** European AQI (0–500 scale from Open-Meteo) → label + colour */
function aqiMeta(idx: number | null): { label: string; color: string } {
  if (idx === null) return { label: "N/A", color: "var(--gf-text-muted)" };
  if (idx <= 20)  return { label: "Good",          color: "var(--gf-live)" };
  if (idx <= 40)  return { label: "Fair",           color: "#a8d08d" };
  if (idx <= 60)  return { label: "Moderate",       color: "var(--gf-warn)" };
  if (idx <= 80)  return { label: "Poor",           color: "#e07b39" };
  if (idx <= 100) return { label: "Very Poor",      color: "var(--gf-danger)" };
  return           { label: "Extremely Poor", color: "#9b1c1c" };
}

function pm25Bar(val: number | null) {
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

// ─── Map helpers ──────────────────────────────────────────────────────────────

function FitBounds({ data }: { data: FeatureCollection }) {
  const map = useMap();
  useEffect(() => {
    const gj = L.geoJSON(data as GeoJsonObject);
    const b = gj.getBounds();
    if (b.isValid()) map.fitBounds(b, { padding: [28, 28], maxZoom: 10 });
  }, [map, data]);
  return null;
}

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const id = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(id);
  }, [map]);
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function KeralaMapWeather() {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [geoErr, setGeoErr] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Ernakulam");
  const [forecasts, setForecasts] = useState<ForecastBlock[] | null>(null);
  const [weatherErr, setWeatherErr] = useState<string | null>(null);

  // AQI state — fetched once for all districts
  const [aqiData, setAqiData] = useState<AqiPayload | null>(null);

  // Wikipedia state — fetched per selected district
  const [wiki, setWiki] = useState<WikiPayload | null>(null);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [wikiDistrict, setWikiDistrict] = useState<string>("");

  // ── GeoJSON ──
  useEffect(() => {
    fetch("/kerala.geojson")
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((j: FeatureCollection) => setGeo(j))
      .catch(() => { setGeo(null); setGeoErr(true); });
  }, []);

  // ── Weather ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(openMeteoMultiCityUrl());
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = (await res.json()) as ForecastBlock[] | ForecastBlock;
        const list = Array.isArray(json) ? json : [json];
        if (!cancelled) { setForecasts(list); setWeatherErr(null); }
      } catch (e) {
        if (!cancelled) {
          setForecasts(null);
          setWeatherErr(e instanceof Error ? e.message : "Weather request failed");
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── AQI (all districts, refresh every 10 min) ──
  const loadAqi = useCallback(async () => {
    try {
      const res = await fetch(`/api/aqi?t=${Date.now()}`, { cache: "no-store" });
      const json = (await res.json()) as AqiPayload;
      setAqiData(json);
    } catch { /* keep previous */ }
  }, []);

  useEffect(() => { loadAqi(); }, [loadAqi]);
  useEffect(() => {
    const id = window.setInterval(loadAqi, 10 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [loadAqi]);

  // ── Wikipedia (per selected district) ──
  useEffect(() => {
    if (!selectedDistrict || selectedDistrict === wikiDistrict) return;
    let cancelled = false;
    setWikiLoading(true);
    setWiki(null);
    fetch(`/api/wiki-district?district=${encodeURIComponent(selectedDistrict)}`)
      .then((r) => r.json())
      .then((json: WikiPayload) => {
        if (!cancelled) { setWiki(json); setWikiDistrict(selectedDistrict); }
      })
      .catch(() => {
        if (!cancelled) setWiki({ title: selectedDistrict, extract: "", pageUrl: "", thumbnail: null, error: "Could not load Wikipedia summary." });
      })
      .finally(() => { if (!cancelled) setWikiLoading(false); });
    return () => { cancelled = true; };
  }, [selectedDistrict, wikiDistrict]);

  // ── Derived ──
  const districtStyle = useCallback(
    (feature?: Feature) => {
      const name = (feature?.properties as { district?: string } | null)?.district;
      const sel = name === selectedDistrict;
      return {
        fillColor: sel ? "#f05a28" : "#2d4a52",
        fillOpacity: sel ? 0.45 : 0.28,
        color: sel ? "#ff8a5c" : "#4a6670",
        weight: sel ? 2.5 : 1,
      };
    },
    [selectedDistrict],
  );

  const cityRows = useMemo(() => {
    if (!forecasts?.length) return [];
    return keralaMainCities.map((c, i) => ({
      ...c,
      weather: forecasts[i]?.current_weather,
      aqi: aqiData?.cities[i] ?? null,
    }));
  }, [forecasts, aqiData]);

  const detail = cityRows.find((c) => c.district === selectedDistrict);
  const detailAqi = aqiData?.cities.find((c) => c.district === selectedDistrict);

  const mlMapSub = "ജില്ലകൾ മാപ്പും കാലാവസ്ഥയും";

  return (
    <GrafanaPanel
      id="districts"
      title="District situation"
      subtitle={mlMapSub}
      className="kt-animate-in scroll-mt-[120px]"
      rightSlot={
        <span className="font-mono text-[10px] font-semibold tracking-wider text-[var(--gf-text-muted)]">
          WX / AQI / GEO
        </span>
      }
    >
      <p className="mb-4 text-[0.8rem] text-[var(--gf-text-muted)]">
        Click a district on the map or use the chips below — weather, air quality and a brief will load for the selected district.
      </p>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── Left: Map + Wikipedia brief below ── */}
        <div className="relative z-0 flex flex-col gap-4 lg:col-span-3">
          {geoErr && (
            <p className="text-[0.82rem] text-[var(--gf-warn)]">
              Could not load district boundaries. Try refreshing.
            </p>
          )}
          <div className="gf-map-shell">
            <div className="relative h-[min(58vh,600px)] min-h-[400px] w-full">
              {geo ? (
                <MapContainer
                  center={[10.15, 76.35]}
                  zoom={7}
                  className="h-full w-full [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:font-sans"
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom
                  zoomControl
                  doubleClickZoom
                  dragging
                  minZoom={6}
                  maxZoom={15}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap &copy; CARTO'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />
                  <FitBounds data={geo} />
                  <InvalidateSize />
                  <GeoJSON
                    data={geo}
                    style={districtStyle as StyleFunction}
                    onEachFeature={(feature, layer) => {
                      const name = (feature.properties as { district?: string })?.district;
                      if (name) {
                        layer.bindTooltip(name, { sticky: true, direction: "center", opacity: 0.95 });
                      }
                      layer.on("click", () => { if (name) setSelectedDistrict(name); });
                    }}
                  />
                </MapContainer>
              ) : !geoErr ? (
                <div className="flex h-full items-center justify-center text-[0.85rem] text-[var(--gf-text-muted)]">
                  Loading map…
                </div>
              ) : null}
            </div>
          </div>
          <p className="font-mono text-[0.65rem] text-[var(--gf-text-muted)]">
            scroll to zoom · click district for details
          </p>

          {/* ── Wikipedia brief — fills the space below the map ── */}
          <div className="gf-subpanel flex-1 p-4">
            <p className="mb-3 font-mono text-[0.6rem] font-semibold tracking-widest text-[var(--gf-accent)] uppercase">
              📖 District brief — {selectedDistrict}
            </p>
            {wikiLoading && (
              <div className="flex items-center gap-2 text-[0.8rem] text-[var(--gf-text-muted)]">
                <div className="kt-spinner !mb-0 !h-4 !w-4 !border-2" />
                Loading…
              </div>
            )}
            {!wikiLoading && wiki && !wiki.error && (
              <div className="flex gap-3">
                {wiki.thumbnail && (
                  <img
                    src={wiki.thumbnail}
                    alt={wiki.title}
                    className="h-20 w-20 shrink-0 rounded-sm object-cover border border-[var(--gf-panel-border)]"
                    loading="lazy"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-[0.82rem] leading-relaxed text-[var(--gf-text)]">
                    {wiki.extract}
                  </p>
                  {wiki.pageUrl && (
                    <a
                      href={wiki.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block font-mono text-[0.65rem] text-[var(--gf-live)] hover:underline"
                    >
                      Read more →
                    </a>
                  )}
                </div>
              </div>
            )}
            {!wikiLoading && wiki?.error && (
              <p className="text-[0.78rem] text-[var(--gf-text-muted)]">{wiki.error}</p>
            )}
            {!wikiLoading && !wiki && (
              <p className="text-[0.78rem] text-[var(--gf-text-muted)]">Select a district to load its brief.</p>
            )}
          </div>
        </div>

        {/* ── Right: Weather + AQI + district chips ── */}
        <div
          id="weather-section"
          className="flex scroll-mt-[120px] flex-col gap-4 lg:col-span-2"
        >
          {weatherErr && (
            <p className="rounded-sm border border-[var(--gf-danger)]/40 bg-[rgba(226,77,77,0.12)] px-3 py-2 text-[0.82rem] text-[var(--gf-danger)]">
              {weatherErr}
            </p>
          )}

          {/* Weather + AQI card */}
          <div className="gf-subpanel overflow-hidden">
            <div className="border-b border-[var(--gf-panel-border)] px-4 py-3">
              <p className="font-mono text-[0.68rem] font-medium tracking-wider text-[var(--gf-text-muted)] uppercase">
                {selectedDistrict}{detail?.cityLabel ? ` · ${detail.cityLabel}` : ""}
              </p>
            </div>
            <div className="space-y-4 p-4">
              {/* Weather */}
              {detail?.weather ? (
                <div>
                  <p className="mb-1 font-mono text-[0.6rem] font-semibold tracking-widest text-[var(--gf-accent)] uppercase">
                    🌤 Weather
                  </p>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-mono text-[2.6rem] font-bold leading-none text-[var(--gf-accent)]">
                        {Math.round(detail.weather.temperature)}°C
                      </div>
                      <div className="mt-1 text-[0.85rem] text-[var(--gf-text)]">
                        {weatherCodeLabel(detail.weather.weathercode)}
                      </div>
                    </div>
                    <div className="text-5xl text-[var(--gf-text-muted)]" aria-hidden>⛅</div>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-sm border border-[var(--gf-panel-border)] bg-[var(--gf-panel-inner)] px-2 py-2 text-center">
                      <dt className="font-mono text-[0.6rem] text-[var(--gf-text-muted)] uppercase">Wind</dt>
                      <dd className="font-mono font-medium text-[var(--gf-live)]">{detail.weather.windspeed} km/h</dd>
                    </div>
                    <div className="rounded-sm border border-[var(--gf-panel-border)] bg-[var(--gf-panel-inner)] px-2 py-2 text-center">
                      <dt className="font-mono text-[0.6rem] text-[var(--gf-text-muted)] uppercase">Obs. time</dt>
                      <dd className="font-mono font-medium text-[var(--gf-live)] text-[0.68rem]">{detail.weather.time}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <p className="text-[0.8rem] text-[var(--gf-text-muted)]">Weather loading…</p>
              )}

              {/* AQI */}
              {detailAqi ? (
                <div>
                  <p className="mb-2 font-mono text-[0.6rem] font-semibold tracking-widest text-[var(--gf-accent)] uppercase">
                    🌫 Air quality
                  </p>
                  {(() => {
                    const aqiInfo = aqiMeta(detailAqi.aqi_index);
                    const bar = pm25Bar(detailAqi.pm2_5);
                    return (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[0.82rem] text-[var(--gf-text)]">European AQI</span>
                          <span
                            className="rounded-sm px-2 py-0.5 font-mono text-[0.62rem] font-bold"
                            style={{ color: aqiInfo.color, background: `${aqiInfo.color}22`, border: `1px solid ${aqiInfo.color}55` }}
                          >
                            {aqiInfo.label}
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="mb-1 flex justify-between font-mono text-[0.6rem] text-[var(--gf-text-muted)]">
                            <span>PM2.5</span>
                            <span>{detailAqi.pm2_5 !== null ? `${detailAqi.pm2_5.toFixed(1)} µg/m³` : "—"}</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--gf-panel-border)]">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${bar.pct}%`, background: bar.color }} />
                          </div>
                        </div>
                        <div className="mt-1.5 flex justify-between font-mono text-[0.6rem] text-[var(--gf-text-muted)]">
                          <span>PM10</span>
                          <span>{detailAqi.pm10 !== null ? `${detailAqi.pm10.toFixed(1)} µg/m³` : "—"}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <p className="text-[0.75rem] text-[var(--gf-text-muted)]">AQI loading…</p>
              )}

              <p className="font-mono text-[0.6rem] text-[var(--gf-text-muted)]">
                Last updated: {detail?.weather?.time ?? "—"}
              </p>
            </div>
          </div>

          {/* District chips */}
          <div className="flex-1">
            <p className="mb-2 font-mono text-[0.68rem] font-semibold tracking-wide text-[var(--gf-text-muted)] uppercase">
              All districts
            </p>
            <div className="flex flex-wrap gap-2">
              {cityRows.map((c) => {
                const w = c.weather;
                const sel = c.district === selectedDistrict;
                const chipAqi = aqiMeta(c.aqi?.aqi_index ?? null);
                return (
                  <button
                    key={c.district}
                    type="button"
                    onClick={() => setSelectedDistrict(c.district)}
                    className="kt-card-hover rounded-sm border px-2.5 py-1.5 text-left text-[0.72rem] transition-transform"
                    style={{
                      borderColor: sel ? "var(--gf-accent)" : "var(--gf-panel-border)",
                      background: sel ? "var(--gf-accent-soft)" : "var(--gf-panel-inner)",
                      color: sel ? "var(--gf-text)" : "var(--gf-text-muted)",
                    }}
                  >
                    <span className="font-semibold">{c.district}</span>
                    {w ? <span className="ml-1.5 tabular-nums">{Math.round(w.temperature)}°</span> : null}
                    <span className="mt-0.5 block text-[0.65rem] opacity-85">{c.cityLabel}</span>
                    {c.aqi && (
                      <span className="mt-0.5 block font-mono text-[0.58rem] font-semibold" style={{ color: chipAqi.color }}>
                        AQI: {chipAqi.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </GrafanaPanel>
  );
}
