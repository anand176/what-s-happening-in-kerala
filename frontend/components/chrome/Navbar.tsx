"use client";

import { useCallback, useEffect, useState } from "react";
import { weatherCodeLabel } from "@/lib/weather";
import { GITHUB_REPO_URL } from "@/config/site";

const STRIP_CITIES = [
  { name: "Kochi", lat: 9.9312, lon: 76.2673 },
  { name: "Trivandrum", lat: 8.5241, lon: 76.9366 },
  { name: "Kozhikode", lat: 11.2588, lon: 75.7804 },
  { name: "Thrissur", lat: 10.5276, lon: 76.2144 },
  { name: "Kottayam", lat: 9.5916, lon: 76.5222 },
] as const;

const LINKS = [
  { href: "#districts", label: "Districts" },
  { href: "#live-news", label: "Live News" },
  { href: "#markets", label: "Markets" },
  { href: "#latest-news", label: "Headlines" },
] as const;

type NewsItem = { title: string; source: string };
type NewsPayload = { items: NewsItem[]; error: string | null };

const FALLBACK_NEWS = "Kerala Monitor — live news, weather, markets and more";
const NEWS_REFRESH_MS = 5 * 60 * 1000;

function mlCalendarLine(d: Date): string {
  const gMonth = d.getMonth();
  const gDay = d.getDate();
  const MONTHS = [
    { name: "\u0D2E\u0D15\u0D30\u0D02", m: 0, day: 14 },
    { name: "\u0D15\u0D41\u0D02\u0D2D\u0D02", m: 1, day: 13 },
    { name: "\u0D2E\u0D40\u0D28\u0D02", m: 2, day: 15 },
    { name: "\u0D2E\u0D47\u0D1F\u0D02", m: 3, day: 14 },
    { name: "\u0D07\u0D1F\u0D35\u0D02", m: 4, day: 15 },
    { name: "\u0D2E\u0D3F\u0D25\u0D41\u0D28\u0D02", m: 5, day: 15 },
    { name: "\u0D15\u0D7C\u0D15\u0D4D\u0D15\u0D1F\u0D15\u0D02", m: 6, day: 17 },
    { name: "\u0D1A\u0D3F\u0D19\u0D4D\u0D19\u0D02", m: 7, day: 17 },
    { name: "\u0D15\u0D28\u0D4D\u0D28\u0D3F", m: 8, day: 17 },
    { name: "\u0D24\u0D41\u0D32\u0D3E\u0D02", m: 9, day: 17 },
    { name: "\u0D35\u0D43\u0D36\u0D4D\u0D1A\u0D3F\u0D15\u0D02", m: 10, day: 16 },
    { name: "\u0D27\u0D28\u0D41", m: 11, day: 16 },
  ];
  let current = MONTHS[0];
  for (const entry of MONTHS) {
    if (gMonth > entry.m || (gMonth === entry.m && gDay >= entry.day)) {
      current = entry;
    }
  }
  const gYear = d.getFullYear();
  const startDate = new Date(gYear, current.m, current.day);
  const today = new Date(gYear, gMonth, gDay);
  const mlDay = Math.round((today.getTime() - startDate.getTime()) / 86400000) + 1;
  const afterNewYear = gMonth > 7 || (gMonth === 7 && gDay >= 17);
  const meYear = afterNewYear ? gYear - 824 : gYear - 825;
  return `${current.name} ${mlDay}, ${meYear} ME`;
}

export function Navbar() {
  const [now, setNow] = useState<Date | null>(null);
  const [active, setActive] = useState("#districts");
  const [tickerText, setTickerText] = useState(FALLBACK_NEWS);

  // Time effect
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // News ticker effect
  useEffect(() => {
    let cancelled = false;
    async function loadNewsTicker() {
      try {
        const res = await fetch("/api/news?limit=20", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as NewsPayload;
        if (cancelled) return;
        if (json.items?.length) {
          const titles = json.items.slice(0, 20).map((i) => i.title).join("   •   ");
          setTickerText(titles);
        }
      } catch { /* keep fallback */ }
    }
    loadNewsTicker();
    const id = window.setInterval(loadNewsTicker, NEWS_REFRESH_MS);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  // ScrollSpy effect
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.target.id) {
            setActive(`#${e.target.id}`);
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );
    LINKS.forEach(({ href }) => {
      const el = document.getElementById(href.slice(1));
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const scrollTo = useCallback((href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActive(href);
    }
  }, []);

  const timeStr = now?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) ?? "--:--";
  const dateStr = now?.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) ?? "";

  const doubledMarquee = `${tickerText}   •   ${tickerText}`;

  return (
    <nav className="sticky top-0 z-[200] border-b border-[var(--hairline-soft)] bg-[var(--canvas)] shadow-sm">
      {/* Main navigation row */}
      <div className="relative flex h-14 items-center justify-between px-3 md:px-4 max-w-[1400px] mx-auto gap-2">
        {/* Left: Brand & Navigation Links */}
        <div className="flex items-center gap-2 lg:gap-6 min-w-0 flex-1 lg:flex-none">
          {/* Brand */}
          <div className="flex shrink-0 items-center gap-2">
            <img src="/logo.svg" alt="Kerala Monitor Logo" className="h-8 w-8 object-contain" />
            <div className="min-w-0 hidden md:block">
              <h1 className="text-[13px] font-bold tracking-tight text-[var(--ink)] leading-none">
                Kerala Monitor
              </h1>
            </div>
          </div>

          {/* Scrollable Pills navigation */}
          <div className="flex-1 lg:flex-initial min-w-0 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
            <div className="flex items-center gap-1 py-1 whitespace-nowrap">
              {LINKS.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  onClick={(e) => { e.preventDefault(); scrollTo(href); }}
                  className={`nav-pill text-[11px] font-semibold py-1 px-2.5 border border-transparent ${active === href ? "nav-pill-active" : "hover:border-[var(--hairline-soft)]"}`}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Malayalam Tagline (with traditional Kerala touch font style) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden lg:block">
          <span className="font-ml-serif text-[17px] font-bold text-[var(--ink)] tracking-wide whitespace-nowrap">
            ദൈവത്തിന്റെ സ്വന്തം നാട്
          </span>
        </div>

        {/* Right: Time & Calendar & GitHub */}
        <div className="hidden lg:flex shrink-0 items-center gap-2.5">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--hairline-soft)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--canvas)] transition-all"
            title="GitHub"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.113.825-.262.825-.585 0-.292-.015-1.263-.015-2.295-3.015.653-3.653-.735-3.885-1.403-.131-.33-.698-1.403-1.188-1.688-.405-.218-.99-.756-.015-.771.918-.014 1.575.844 1.791 1.188 1.05 1.744 2.73 1.253 3.39.948.098-.746.405-1.253.735-1.543-2.565-.293-5.265-1.283-5.265-5.698 0-1.26.45-2.288 1.185-3.096-.12-.293-.51-1.47.113-3.065 0 0 .968-.307 3.17 1.178a10.95 10.95 0 0 1 5.7 0c2.202-1.485 3.165-1.178 3.165-1.178.627 1.595.233 2.772.118 3.065.735.808 1.18 1.83 1.18 3.096 0 4.425-2.708 5.398-5.28 5.688.42.36.795 1.065.795 2.145 0 1.548-.015 2.79-.015 3.165 0 .323.225.708.825.585A11.987 11.987 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
            </svg>
          </a>
          <div className="h-5 w-px bg-[var(--hairline-soft)]" />
          <div className="font-mono text-[15px] font-bold tracking-tight text-[var(--ink)] tabular-nums">
            {timeStr}
          </div>
        </div>
        <div className="flex lg:hidden shrink-0 items-center gap-2">
          <div className="h-5 w-px bg-[var(--hairline-soft)]" />
          <div className="font-mono text-[14px] font-bold tracking-tight text-[var(--ink)] tabular-nums whitespace-nowrap">
            {timeStr}
          </div>
        </div>
      </div>

      {/* Unified Marquee Ticker: Combines Live News & City Weather into one thin row */}
      <div className="flex h-6 items-center gap-2 overflow-hidden border-t border-[var(--hairline-soft)] bg-[var(--surface-card)] px-3 md:px-4">
        <span className="badge badge-live shrink-0 text-[8px] py-0.5 px-1.5">
          HEADLINES
        </span>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="ticker-track whitespace-nowrap font-mono text-[10px] text-[var(--mute)]">
            <span className="inline-block pr-16">{doubledMarquee}</span>
            <span className="inline-block pr-16">{doubledMarquee}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
