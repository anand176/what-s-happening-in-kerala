"use client";

import { useEffect, useState } from "react";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import type { FestivalsPayload } from "@/app/api/festivals/route";

function daysUntilLabel(dateStr: string): string | null {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff < 0) return null;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `${diff}d`;
}

export function FestivalsSection() {
  const [data, setData] = useState<FestivalsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/festivals")
      .then((r) => r.json())
      .then((j) => setData(j))
      .catch(() => setData({ items: [], source: "none", error: "Failed to load" }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <GrafanaPanel
      id="festivals"
      title="Upcoming festivals."
      subtitle={"\u0D35\u0D30\u0D3E\u0D28\u0D3F\u0D30\u0D3F\u0D15\u0D4D\u0D15\u0D41\u0D28\u0D4D\u0D28 \u0D06\u0D18\u0D4B\u0D37\u0D19\u0D4D\u0D19\u0D7E"}
      className="stagger-4 scroll-mt-[140px]"
    >
      {loading ? (
        <div className="flex justify-center py-8"><div className="spinner" /></div>
      ) : !data?.items.length ? (
        <p className="text-sm text-[var(--text-muted)]">
          {data?.error || "No upcoming festivals found."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {data.items
            .filter((item) => daysUntilLabel(item.date) !== null)
            .map((item) => {
              const countdown = daysUntilLabel(item.date)!;
              const d = new Date(`${item.date}T12:00:00`);
              const dateLabel = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
              const weekday = d.toLocaleDateString("en-IN", { weekday: "long" });
              return (
                <div key={`${item.title}-${item.date}`} className="sub-pin flex items-center justify-between px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold tracking-[-0.2px] text-[var(--ink)]">
                      {item.title}
                    </div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-[var(--mute)]">
                      <span>{dateLabel}</span>
                      <span className="capitalize">{weekday}</span>
                    </div>
                  </div>
                  <span className="badge badge-live ml-3 shrink-0 text-[11px]">{countdown}</span>
                </div>
              );
            })}
        </div>
      )}
    </GrafanaPanel>
  );
}
