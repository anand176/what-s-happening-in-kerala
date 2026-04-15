"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { StyleFunction } from "leaflet";
import type { Feature, FeatureCollection, GeoJsonObject } from "geojson";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import { keralaMainCities, openMeteoMultiCityUrl } from "@/config/kerala-cities";
import { weatherCodeLabel } from "@/lib/weather";

type CurrentWeather = {
  time: string;
  temperature: number;
  windspeed: number;
  weathercode: number;
};

type ForecastBlock = {
  current_weather: CurrentWeather;
};

function FitBounds({ data }: { data: FeatureCollection }) {
  const map = useMap();
  useEffect(() => {
    const gj = L.geoJSON(data as GeoJsonObject);
    const b = gj.getBounds();
    if (b.isValid()) {
      map.fitBounds(b, { padding: [28, 28], maxZoom: 10 });
    }
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

export function KeralaMapWeather() {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [geoErr, setGeoErr] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Ernakulam");
  const [forecasts, setForecasts] = useState<ForecastBlock[] | null>(null);
  const [weatherErr, setWeatherErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/kerala.geojson")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((j: FeatureCollection) => setGeo(j))
      .catch(() => {
        setGeo(null);
        setGeoErr(true);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(openMeteoMultiCityUrl());
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const json = (await res.json()) as ForecastBlock[] | ForecastBlock;
        const list = Array.isArray(json) ? json : [json];
        if (!cancelled) {
          setForecasts(list);
          setWeatherErr(null);
        }
      } catch (e) {
        if (!cancelled) {
          setForecasts(null);
          setWeatherErr(
            e instanceof Error ? e.message : "Weather request failed",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const districtStyle = useCallback(
    (feature?: Feature) => {
      const name = (feature?.properties as { district?: string } | null)
        ?.district;
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
    }));
  }, [forecasts]);

  const detail = cityRows.find((c) => c.district === selectedDistrict);

  const mlMapSub =
    "\u0D1C\u0D3F\u0D32\u0D4D\u0D32\u0D15\u0D7E \u0D2E\u0D3E\u0D2A\u0D4D\u0D2A\u0D4D \u0D0F\u0D35\u0D41\u0D02 \u0D15\u0D3E\u0D33\u0D3E\u0D35\u0D38\u0D4D\u0D25";

  return (
    <GrafanaPanel
      id="districts"
      title="District situation"
      subtitle={mlMapSub}
      className="kt-animate-in scroll-mt-[120px]"
      rightSlot={
        <span className="font-mono text-[10px] font-semibold tracking-wider text-[var(--gf-text-muted)]">
          WX / GEO
        </span>
      }
    >
      <p className="mb-4 text-[0.8rem] text-[var(--gf-text-muted)]">
        Pan and zoom the basemap. Orange fill = selected district. Dots mark main weather
        hubs (click a district or chip to retarget telemetry).
      </p>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="relative z-0 lg:col-span-3">
          {geoErr && (
            <p className="mb-2 text-[0.82rem] text-[var(--gf-warn)]">
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
                      const name = (feature.properties as { district?: string })
                        ?.district;
                      if (name) {
                        layer.bindTooltip(name, {
                          sticky: true,
                          direction: "center",
                          opacity: 0.95,
                        });
                      }
                      layer.on("click", () => {
                        if (name) setSelectedDistrict(name);
                      });
                    }}
                  />
                  {keralaMainCities.map((c) => (
                    <CircleMarker
                      key={c.district}
                      center={[c.lat, c.lon]}
                      radius={selectedDistrict === c.district ? 10 : 7}
                      pathOptions={{
                        color: "#d8dee9",
                        weight: 2,
                        fillColor:
                          selectedDistrict === c.district
                            ? "#f05a28"
                            : "#5c7a85",
                        fillOpacity: 1,
                      }}
                      eventHandlers={{
                        click: () => setSelectedDistrict(c.district),
                      }}
                    >
                      <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                        {c.cityLabel}
                      </Tooltip>
                    </CircleMarker>
                  ))}
                </MapContainer>
              ) : !geoErr ? (
                <div className="flex h-full items-center justify-center text-[0.85rem] text-[var(--gf-text-muted)]">
                  Loading map{"\u2026"}
                </div>
              ) : null}
            </div>
          </div>
          <p className="mt-2 font-mono text-[0.65rem] text-[var(--gf-text-muted)]">
            Census 2011 · Carto dark · Open-Meteo · scroll = zoom
          </p>
        </div>

        <div
          id="weather-section"
          className="flex scroll-mt-[120px] flex-col gap-4 lg:col-span-2"
        >
          {weatherErr && (
            <p className="rounded-sm border border-[var(--gf-danger)]/40 bg-[rgba(226,77,77,0.12)] px-3 py-2 text-[0.82rem] text-[var(--gf-danger)]">
              {weatherErr}
            </p>
          )}
          {detail?.weather && (
            <div className="gf-subpanel relative overflow-hidden p-4">
              <span
                className="pointer-events-none absolute -top-2 -right-2 text-6xl opacity-[0.06] text-[var(--gf-accent)]"
                aria-hidden
              >
                {"\u{1F965}"}
              </span>
              <p className="font-mono text-[0.68rem] font-medium tracking-wider text-[var(--gf-text-muted)] uppercase">
                {detail.district} · {detail.cityLabel}
              </p>
              <div className="mt-1 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-[3rem] font-bold leading-none font-mono text-[var(--gf-accent)]">
                    {Math.round(detail.weather.temperature)}
                    {"\u00B0C"}
                  </div>
                  <div className="mt-1 text-[0.85rem] text-[var(--gf-text)]">
                    {weatherCodeLabel(detail.weather.weathercode)}
                  </div>
                </div>
                <div className="text-5xl text-[var(--gf-text-muted)]" aria-hidden>
                  {"\u26C5"}
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-1 gap-2 text-[0.8rem] text-[var(--gf-text)] sm:grid-cols-2">
                <div className="rounded-sm border border-[var(--gf-panel-border)] bg-[var(--gf-panel-inner)] px-2 py-2 text-center">
                  <dt className="font-mono text-[0.6rem] text-[var(--gf-text-muted)] uppercase">
                    Wind
                  </dt>
                  <dd className="font-mono font-medium text-[var(--gf-live)]">
                    {detail.weather.windspeed} km/h
                  </dd>
                </div>
                <div className="rounded-sm border border-[var(--gf-panel-border)] bg-[var(--gf-panel-inner)] px-2 py-2 text-center">
                  <dt className="font-mono text-[0.6rem] text-[var(--gf-text-muted)] uppercase">
                    Time
                  </dt>
                  <dd className="font-mono font-medium text-[var(--gf-live)]">
                    {detail.weather.time}
                  </dd>
                </div>
              </dl>
              <p className="mt-2 font-mono text-[0.65rem] text-[var(--gf-text-muted)]">
                Open-Meteo · Asia/Kolkata
              </p>
            </div>
          )}

          <div>
            <p className="mb-2 font-mono text-[0.68rem] font-semibold tracking-wide text-[var(--gf-text-muted)] uppercase">
              All districts
            </p>
            <div className="flex max-h-52 flex-wrap gap-2 overflow-y-auto pr-1 lg:max-h-[min(52vh,420px)]">
              {cityRows.map((c) => {
                const w = c.weather;
                const sel = c.district === selectedDistrict;
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
                    {w ? (
                      <span className="ml-1.5 tabular-nums">
                        {Math.round(w.temperature)}
                        {"\u00B0"}
                      </span>
                    ) : null}
                    <span className="mt-0.5 block text-[0.65rem] opacity-85">
                      {c.cityLabel}
                    </span>
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
