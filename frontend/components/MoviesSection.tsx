"use client";

import { useEffect, useState } from "react";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import type { MoviesPayload, MovieItem } from "@/app/api/movies/route";

function formatDate(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }
  }
  return raw;
}

function MovieCard({ item }: { item: MovieItem }) {
  return (
    <div className="sub-pin overflow-hidden !p-0">
      <div className="relative aspect-[2/3] overflow-hidden border-b border-[var(--hairline-soft)] bg-[var(--surface-card)]">
        <img
          src={item.poster || "/placeholder-poster.png"}
          alt={item.title}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/placeholder-poster.png";
          }}
        />
      </div>
      <div className="p-3">
        <div className="line-clamp-2 text-[13px] font-semibold tracking-[-0.2px] text-[var(--ink)]">
          {item.title}
        </div>
        <div className="mt-1 font-mono text-[11px] text-[var(--mute)]">
          {formatDate(item.date)}
        </div>
        {item.note && (
          <div className="mt-0.5 text-[11px] text-[var(--mute)]">{item.note}</div>
        )}
      </div>
    </div>
  );
}

export function MoviesSection() {
  const [data, setData] = useState<MoviesPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/movies")
      .then((r) => r.json())
      .then((j) => setData(j))
      .catch(() => setData({ items: [], source: "none", error: "Failed to load" }))
      .finally(() => setLoading(false));
  }, []);

  const theatricalMovies = data?.items.filter(item => item.releaseType === "theatrical") || [];
  const ottMovies = data?.items.filter(item => item.releaseType === "ott") || [];

  return (
    <GrafanaPanel
      id="movies"
      title="Malayalam cinema."
      subtitle={"മലയാളം സിനിമ"}
      className="stagger-5 scroll-mt-[140px]"
    >
      {loading ? (
        <div className="flex justify-center py-8"><div className="spinner" /></div>
      ) : !data?.items.length ? (
        <p className="text-sm text-[var(--mute)]">
          {data?.error || "No movies found. Set WATCHMODE_API_KEY in .env.local."}
        </p>
      ) : (
        <div className="space-y-8">
          {/* Theatrical releases */}
          {theatricalMovies.length > 0 && (
            <div>
              <h3 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--mute)] flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                In Theaters
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {theatricalMovies.map((item, i) => (
                  <MovieCard key={`${item.title}-${i}`} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* OTT releases */}
          {ottMovies.length > 0 && (
            <div>
              <h3 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--mute)] flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                On OTT Platforms
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {ottMovies.map((item, i) => (
                  <MovieCard key={`${item.title}-${i}`} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </GrafanaPanel>
  );
}
