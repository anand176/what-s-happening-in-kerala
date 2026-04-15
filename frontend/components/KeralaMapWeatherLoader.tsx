"use client";

import dynamic from "next/dynamic";

const KeralaMapWeather = dynamic(
  () =>
    import("@/components/KeralaMapWeather").then((m) => ({
      default: m.KeralaMapWeather,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="gf-panel kt-animate-in p-0">
        <div className="gf-panel-header">
          <span className="gf-panel-accent-bar" aria-hidden />
          <div className="h-4 w-40 animate-pulse rounded-sm bg-[var(--gf-panel-border)]" />
        </div>
        <div className="gf-panel-body">
          <div className="gf-map-shell h-[min(58vh,600px)] min-h-[400px] animate-pulse bg-[var(--gf-panel-inner)]" />
        </div>
      </div>
    ),
  },
);

export function KeralaMapWeatherLoader() {
  return <KeralaMapWeather />;
}
