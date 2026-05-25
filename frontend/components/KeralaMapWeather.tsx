"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, useMap } from "react-leaflet";
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

function aqiMeta(idx: number | null): { label: string; color: string } {
  if (idx === null) return { label: "N/A",        color: "var(--mute)" };
  if (idx <= 20)   return { label: "Good",        color: "#103c25" };
  if (idx <= 40)   return { label: "Fair",        color: "#2e7d32" };
  if (idx <= 60)   return { label: "Moderate",    color: "#f5a623" };
  if (idx <= 80)   return { label: "Poor",        color: "#e07b39" };
  if (idx <= 100)  return { label: "Very Poor",   color: "var(--primary)" };
  return            { label: "Ext. Poor",   color: "#9b1c1c" };
}

function pm25Bar(val: number | null) {
  const pct = val === null ? 0 : Math.min(100, (val / 75) * 100);
  const color =
    val === null
      ? "var(--hairline-soft)"
      : val <= 15
        ? "#103c25"
        : val <= 35
          ? "#f5a623"
          : "var(--primary)";
  return { pct, color };
}

// ─── Map helpers ──────────────────────────────────────────────────────────────

function FitBounds({ data }: { data: FeatureCollection }) {
  const map = useMap();
  useEffect(() => {
    const gj = L.geoJSON(data as GeoJsonObject);
    const b = gj.getBounds();
    if (b.isValid()) map.fitBounds(b, { padding: [24, 24], maxZoom: 10 });
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

const DISTRICT_COLORS: Record<string, string> = {
  "Kasaragod": "hsl(14, 85%, 82%)",
  "Kannur": "hsl(35, 85%, 82%)",
  "Wayanad": "hsl(85, 65%, 82%)",
  "Kozhikode": "hsl(145, 60%, 82%)",
  "Malappuram": "hsl(170, 65%, 82%)",
  "Palakkad": "hsl(195, 75%, 82%)",
  "Thrissur": "hsl(215, 80%, 84%)",
  "Ernakulam": "hsl(240, 70%, 84%)",
  "Idukki": "hsl(270, 65%, 84%)",
  "Kottayam": "hsl(300, 60%, 84%)",
  "Alappuzha": "hsl(325, 75%, 84%)",
  "Pathanamthitta": "hsl(345, 80%, 84%)",
  "Kollam": "hsl(9, 85%, 83%)",
  "Thiruvananthapuram": "hsl(50, 80%, 82%)",
};

// ─── Main component ───────────────────────────────────────────────────────────

export function KeralaMapWeather() {
  const [geo, setGeo] = useState<FeatureCollection | null>(null);
  const [geoErr, setGeoErr] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Ernakulam");
  const [forecasts, setForecasts] = useState<ForecastBlock[] | null>(null);
  const [weatherErr, setWeatherErr] = useState<string | null>(null);
  const [aqiData, setAqiData] = useState<AqiPayload | null>(null);
  const [wiki, setWiki] = useState<WikiPayload | null>(null);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [wikiDistrict, setWikiDistrict] = useState<string>("");

  useEffect(() => {
    fetch("/kerala.geojson")
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((j: FeatureCollection) => setGeo(j))
      .catch(() => { setGeo(null); setGeoErr(true); });
  }, []);

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

  const districtStyle = useCallback(
    (feature?: Feature) => {
      const name = (feature?.properties as { district?: string } | null)?.district || "";
      const sel = name === selectedDistrict;
      const baseColor = DISTRICT_COLORS[name] || "#fafafa";
      return {
        fillColor: baseColor,
        fillOpacity: sel ? 0.9 : 0.6,
        color: sel ? "var(--primary)" : "var(--stone)",
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

  const mlMapSub = "Districts map & weather";

  return (
    <GrafanaPanel
      id="districts"
      title="District situation"
      subtitle={mlMapSub}
      className="scroll-mt-[120px]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3">
        {/* Map with district selector overlay */}
        <div className="relative border border-[var(--hairline-soft)] rounded-[var(--radius-md)] overflow-hidden">
          <div className="relative h-[min(58vh,600px)] min-h-[400px] w-full bg-[var(--canvas)]">
            {geo ? (
              <MapContainer
                center={[10.15, 76.35]}
                zoom={7}
                className="h-full w-full [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:font-sans"
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
                zoomControl={false}
                doubleClickZoom={false}
                dragging={false}
                touchZoom={false}
                boxZoom={false}
                keyboard={false}
              >
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
              <div className="flex h-full items-center justify-center text-sm text-[var(--mute)]">
                Loading map…
              </div>
            ) : (
              <p className="p-4 text-sm text-[var(--error)]">
                Could not load district boundaries. Try refreshing.
              </p>
            )}
          </div>
        </div>

        {/* Selected district details */}
        <div className="space-y-3">
          {/* Weather & AQI */}
          <div className="sub-pin">
            <h3 className="mb-2 font-mono text-[10px] font-bold tracking-widest text-[var(--primary)] uppercase">
              {selectedDistrict}{detail?.cityLabel ? ` · ${detail.cityLabel}` : ""}
            </h3>
            {detail?.weather ? (
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[2rem] font-bold tracking-tight text-[var(--ink)] leading-none">
                      {Math.round(detail.weather.temperature)}°C
                    </div>
                    <div className="text-[12px] text-[var(--mute)] mt-1 font-semibold">
                      {weatherCodeLabel(detail.weather.weathercode)}
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-[var(--mute)]">
                    <div>Wind: <span className="font-bold text-[var(--ink)]">{detail.weather.windspeed} km/h</span></div>
                    <div className="mt-0.5">Obs: <span className="font-bold text-[var(--ink)]">{detail.weather.time}</span></div>
                  </div>
                </div>

                {detailAqi && (
                  <div className="pt-2 border-t border-[var(--hairline-soft)]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[12px] font-semibold text-[var(--ink)]">European AQI</span>
                      <span className="text-[13px] font-bold" style={{ color: aqiMeta(detailAqi.aqi_index).color }}>
                        {detailAqi.aqi_index} ({aqiMeta(detailAqi.aqi_index).label})
                      </span>
                    </div>
                    <div className="space-y-1 mt-1.5">
                      <div className="flex justify-between text-[10px] text-[var(--mute)]">
                        <span>PM2.5</span>
                        <span>{detailAqi.pm2_5 !== null ? `${detailAqi.pm2_5.toFixed(1)} µg/m³` : "—"}</span>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--hairline-soft)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pm25Bar(detailAqi.pm2_5).pct}%`, backgroundColor: pm25Bar(detailAqi.pm2_5).color }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-[var(--mute)]">
                        <span>PM10</span>
                        <span>{detailAqi.pm10 !== null ? `${detailAqi.pm10.toFixed(1)} µg/m³` : "—"}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[12px] text-[var(--mute)]">Weather loading…</p>
            )}
          </div>

          {/* Wiki brief */}
          <div className="sub-pin flex flex-col justify-between">
            <div>
              <h3 className="mb-2 font-mono text-[10px] font-bold tracking-widest text-[var(--primary)] uppercase">
                District Brief
              </h3>
              {wikiLoading ? (
                <div className="text-[12px] text-[var(--mute)]">Loading summary…</div>
              ) : wiki && !wiki.error ? (
                <div className="flex gap-2">
                  {wiki.thumbnail && (
                    <img
                      src={wiki.thumbnail}
                      alt={wiki.title}
                      className="h-14 w-14 shrink-0 rounded-[var(--radius-sm)] object-cover bg-[var(--surface-soft)]"
                      loading="lazy"
                    />
                  )}
                  <p className="text-[12px] leading-relaxed text-[var(--body)] line-clamp-4">
                    {wiki.extract}
                  </p>
                </div>
              ) : (
                <p className="text-[12px] text-[var(--mute)]">{wiki?.error || "Select a district."}</p>
              )}
            </div>
            {wiki?.pageUrl && (
              <a
                href={wiki.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-[10px] font-bold text-[var(--primary)] hover:underline inline-flex items-center"
              >
                Read on Wikipedia →
              </a>
            )}
          </div>
        </div>
      </div>
    </GrafanaPanel>
  );
}
