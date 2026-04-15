"use client";

import { useEffect, useState } from "react";

const STRIP_CITIES = [
  { name: "Kottayam", lat: 9.5916, lon: 76.5222 },
  { name: "Kochi", lat: 9.9312, lon: 76.2673 },
  { name: "Thiruvananthapuram", lat: 8.5241, lon: 76.9366 },
  { name: "Kozhikode", lat: 11.2588, lon: 75.7804 },
  { name: "Thrissur", lat: 10.5276, lon: 76.2144 },
] as const;

function wxEmoji(code: number): string {
  if (code === 0) return "\u2600\uFE0F";
  if (code === 1 || code === 2) return "\u26C5";
  if (code === 3) return "\u2601\uFE0F";
  if (code >= 45 && code <= 48) return "\u{1F32B}\uFE0F";
  if (code >= 51 && code <= 57) return "\u{1F328}\uFE0F";
  if (code >= 61 && code <= 67) return "\u{1F327}\uFE0F";
  if (code >= 80 && code <= 82) return "\u{1F326}\uFE0F";
  if (code >= 95) return "\u26C8\uFE0F";
  return "\u{1F321}\uFE0F";
}

function mlCalendarLine(d: Date) {
  const mlMonths = [
    "\u0D1A\u0D3F\u0D19\u0D4D\u0D19\u0D02",
    "\u0D15\u0D28\u0D4D\u0D28\u0D3F",
    "\u0D24\u0D41\u0D32\u0D3E\u0D02",
    "\u0D35\u0D43\u0D36\u0D4D\u0D1A\u0D3F\u0D15\u0D02",
    "\u0D27\u0D28\u0D41",
    "\u0D2E\u0D15\u0D30\u0D02",
    "\u0D15\u0D41\u0D02\u0D2D\u0D02",
    "\u0D2E\u0D40\u0D28\u0D02",
    "\u0D2E\u0D47\u0D1F\u0D02",
    "\u0D07\u0D1F\u0D35\u0D02",
    "\u0D2E\u0D3F\u0D25\u0D41\u0D28\u0D02",
    "\u0D15\u0D7C\u0D15\u0D4D\u0D15\u0D1F\u0D15\u0D02",
  ];
  const mlMonth = mlMonths[(d.getMonth() + 1) % 12];
  return `${mlMonth} ${d.getDate()}, ${d.getFullYear() - 822} ME`;
}

export function SiteHeader() {
  const [now, setNow] = useState<Date | null>(null);
  const [strip, setStrip] = useState<
    { name: string; temp: number; code: number }[] | null
  >(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const lat = STRIP_CITIES.map((c) => c.lat).join(",");
        const lon = STRIP_CITIES.map((c) => c.lon).join(",");
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=Asia%2FKolkata`;
        const res = await fetch(url);
        const data = (await res.json()) as {
          current_weather?: { temperature: number; weathercode: number };
        }[];
        if (!cancelled && Array.isArray(data)) {
          setStrip(
            STRIP_CITIES.map((c, i) => {
              const cw = data[i]?.current_weather;
              return {
                name: c.name,
                temp: Math.round(cw?.temperature ?? 0),
                code: cw?.weathercode ?? 0,
              };
            }),
          );
        }
      } catch {
        if (!cancelled) setStrip([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const timeStr =
    now?.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }) ?? "--:--";

  const dateStr =
    now?.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }) ?? "";

  const mlSub =
    "\u0D15\u0D47\u0D30\u0D33 \u0D1F\u0D41\u0D21\u0D47 \u00B7 \u0D28\u0D3F\u0D19\u0D4D\u0D19\u0D33\u0D41\u0D1F\u0D46 \u0D15\u0D47\u0D30\u0D33\u0D02";

  return (
    <header className="sticky top-0 z-[200] shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      <div className="gf-site-header-main flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-[var(--gf-panel-border)] bg-[var(--gf-panel-inner)] text-lg"
            style={{ boxShadow: "inset 0 0 0 1px rgba(240,90,40,0.25)" }}
          >
            {"\u{1F965}"}
          </div>
          <div>
            <h1 className="font-mono text-[13px] font-bold tracking-[0.12em] text-[var(--gf-text)] uppercase md:text-sm">
              What's happening in Kerala
            </h1>
            <p className="font-ml-serif text-[0.7rem] text-[var(--gf-text-muted)] md:text-[0.72rem]">
              {mlSub}
            </p>
          </div>
        </div>
        <div className="text-right font-mono text-[0.65rem] leading-snug text-[var(--gf-text-muted)] md:text-[0.68rem]">
          <span className="font-ml-serif text-[0.74rem] font-medium text-[var(--gf-accent)] md:text-[0.76rem]">
            {now ? mlCalendarLine(now) : "\u2026"}
          </span>
          <br />
          <span className="text-[var(--gf-text)]">{dateStr}</span>
          <br />
          <span className="tabular-nums text-[var(--gf-live)]">{timeStr}</span>
        </div>
      </div>
      <div
        className="gf-site-header-strip flex items-center gap-4 overflow-x-auto px-4 py-2 md:px-6 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {!strip?.length ? (
          <div className="flex shrink-0 items-center gap-2 font-mono text-[0.75rem] text-[var(--gf-text-muted)]">
            <span>{"\u23F3"}</span>
            <span>Loading wx telemetry\u2026</span>
          </div>
        ) : (
          strip.map((row) => (
            <div
              key={row.name}
              className="flex shrink-0 items-center gap-2 text-[0.78rem] text-[var(--gf-text)]"
            >
              <span className="text-base">{wxEmoji(row.code)}</span>
              <div>
                <span className="block font-mono text-[0.62rem] tracking-wide text-[var(--gf-text-muted)] uppercase">
                  {row.name}
                </span>
                <span className="font-mono text-[0.95rem] font-semibold text-[var(--gf-accent)]">
                  {row.temp}\u00B0C
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </header>
  );
}
