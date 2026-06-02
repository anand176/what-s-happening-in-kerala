"use client";

import { useEffect, useState } from "react";
import { weatherCodeLabel } from "@/lib/weather";

const STRIP_CITIES = [
  { name: "Kottayam",          lat: 9.5916,  lon: 76.5222 },
  { name: "Kochi",             lat: 9.9312,  lon: 76.2673 },
  { name: "Thiruvananthapuram",lat: 8.5241,  lon: 76.9366 },
  { name: "Kozhikode",         lat: 11.2588, lon: 75.7804 },
  { name: "Thrissur",          lat: 10.5276, lon: 76.2144 },
] as const;

/**
 * Convert a Gregorian date to Malayalam Era (Kollam Era) date string.
 * Malayalam solar months start on fixed Gregorian dates each year.
 * Medam = Apr 14–May 14, Edavam = May 15–Jun 14, etc.
 */
function mlCalendarLine(d: Date): string {
  const gMonth = d.getMonth(); // 0-indexed
  const gDay   = d.getDate();

  // Each entry: [mlMonthName, gregMonth(0-idx), gregStartDay]
  // Sorted in calendar order starting from January
  const MONTHS = [
    { name: "\u0D2E\u0D15\u0D30\u0D02",                              m: 0,  day: 14 }, // Makaram   Jan 14
    { name: "\u0D15\u0D41\u0D02\u0D2D\u0D02",                        m: 1,  day: 13 }, // Kumbham   Feb 13
    { name: "\u0D2E\u0D40\u0D28\u0D02",                              m: 2,  day: 15 }, // Meenam    Mar 15
    { name: "\u0D2E\u0D47\u0D1F\u0D02",                              m: 3,  day: 14 }, // Medam     Apr 14
    { name: "\u0D07\u0D1F\u0D35\u0D02",                              m: 4,  day: 15 }, // Edavam    May 15
    { name: "\u0D2E\u0D3F\u0D25\u0D41\u0D28\u0D02",                  m: 5,  day: 15 }, // Mithunam  Jun 15
    { name: "\u0D15\u0D7C\u0D15\u0D4D\u0D15\u0D1F\u0D15\u0D02",     m: 6,  day: 17 }, // Karkidakam Jul 17
    { name: "\u0D1A\u0D3F\u0D19\u0D4D\u0D19\u0D02",                  m: 7,  day: 17 }, // Chingam   Aug 17
    { name: "\u0D15\u0D28\u0D4D\u0D28\u0D3F",                        m: 8,  day: 17 }, // Kanni     Sep 17
    { name: "\u0D24\u0D41\u0D32\u0D3E\u0D02",                        m: 9,  day: 17 }, // Thulam    Oct 17
    { name: "\u0D35\u0D43\u0D36\u0D4D\u0D1A\u0D3F\u0D15\u0D02",     m: 10, day: 16 }, // Vrischikam Nov 16
    { name: "\u0D27\u0D28\u0D41",                                    m: 11, day: 16 }, // Dhanu     Dec 16
  ];

  // Find current Malayalam month: the last entry whose start <= today
  let current = MONTHS[0];
  for (const entry of MONTHS) {
    if (gMonth > entry.m || (gMonth === entry.m && gDay >= entry.day)) {
      current = entry;
    }
  }

  const gYear = d.getFullYear();
  // Date diff handles cross-month cases (e.g. Medam starts Apr 14, today May 3)
  const startDate = new Date(gYear, current.m, current.day);
  const today     = new Date(gYear, gMonth, gDay);
  const mlDay     = Math.round((today.getTime() - startDate.getTime()) / 86400000) + 1;
  const afterNewYear = gMonth > 7 || (gMonth === 7 && gDay >= 17);
  const meYear = afterNewYear ? gYear - 824 : gYear - 825;

  return `${current.name} ${mlDay}, ${meYear} ME`;
}

export function SiteHeader() {
  const [now, setNow] = useState<Date | null>(null);
  const [strip, setStrip] = useState<{ name: string; temp: number; code: number }[] | null>(null);

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
        const data = (await res.json()) as { current_weather?: { temperature: number; weathercode: number } }[];
        if (!cancelled && Array.isArray(data)) {
          setStrip(STRIP_CITIES.map((c, i) => {
            const cw = data[i]?.current_weather;
            return { name: c.name, temp: Math.round(cw?.temperature ?? 0), code: cw?.weathercode ?? 0 };
          }));
        }
      } catch {
        if (!cancelled) setStrip([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const timeStr = now?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) ?? "--:--";
  const dateStr = now?.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) ?? "";
  const mlSub = "\u0D15\u0D47\u0D30\u0D33 \u0D1F\u0D41\u0D21\u0D47 \u00B7 \u0D28\u0D3F\u0D19\u0D4D\u0D19\u0D33\u0D41\u0D1F\u0D46 \u0D15\u0D47\u0D30\u0D33\u0D02";

  return (
    <header className="sticky top-0 z-[200] shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
      <div className="gf-site-header-main flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div
            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm border border-[var(--gf-panel-border)] bg-white"
            style={{ boxShadow: "inset 0 0 0 1px rgba(240,90,40,0.25)" }}
          >
            <img
              src="/logo.svg"
              alt="Kerala Monitor"
              width={40}
              height={40}
              className="h-full w-full object-contain"
              decoding="async"
            />
          </div>
          <div>
            <h1 className="font-mono text-[13px] font-bold tracking-[0.12em] text-[var(--gf-text)] uppercase md:text-sm">
              What&apos;s happening in Kerala
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
        className="gf-site-header-strip flex items-center gap-6 overflow-x-auto px-4 py-2 md:px-6 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {!strip?.length ? (
          <span className="font-mono text-[0.72rem] text-[var(--gf-text-muted)]">Loading wx telemetry…</span>
        ) : (
          strip.map((row) => (
            <div key={row.name} className="flex shrink-0 items-center gap-2">
              <div>
                <span className="block font-mono text-[0.6rem] tracking-wide text-[var(--gf-text-muted)] uppercase">
                  {row.name}
                </span>
                <span className="font-mono text-[0.88rem] font-semibold text-[var(--gf-accent)]">
                  {row.temp}°C
                </span>
                <span className="ml-1.5 font-mono text-[0.6rem] text-[var(--gf-text-muted)]">
                  {weatherCodeLabel(row.code)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </header>
  );
}
