"use client";

import { useCallback, useEffect, useState } from "react";

const LINKS = [
  { href: "#districts", label: "Districts", emoji: "\u{1F5FA}\uFE0F" },
  { href: "#live-news", label: "Live News", emoji: "\u{1F4FA}" },
  { href: "#retail-rates", label: "Fuel & gold", emoji: "\u26FD" },
  { href: "#markets", label: "Markets", emoji: "\u{1F4C8}" },
  { href: "#forex", label: "Forex", emoji: "\u{1F4B1}" },
  { href: "#aqi", label: "Air quality", emoji: "\u{1F32B}\uFE0F" },
  { href: "#earthquakes", label: "Seismic", emoji: "\u{1F30D}" },
  { href: "#latest-news", label: "Headlines", emoji: "\u{1F4F0}" },
  { href: "#weather-section", label: "Weather", emoji: "\u{1F327}\uFE0F" },
  { href: "#festivals", label: "Festivals", emoji: "\u{1F389}" },
  { href: "#movies", label: "Movies", emoji: "\u{1F3AC}" },
] as const;

export function MainNav() {
  const [active, setActive] = useState("#districts");

  const scrollTo = useCallback((href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActive(href);
    }
  }, []);

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
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );
    LINKS.forEach(({ href }) => {
      const id = href.slice(1);
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  return (
    <nav
      className="gf-nav-bar flex overflow-x-auto [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      {LINKS.map(({ href, label, emoji }) => {
        const isOn = active === href;
        return (
          <a
            key={href}
            href={href}
            className="flex shrink-0 items-center gap-1.5 px-4 py-2.5 font-mono text-[0.72rem] font-medium whitespace-nowrap tracking-wide uppercase transition-colors"
            style={{
              color: isOn ? "var(--gf-accent)" : "var(--gf-text-muted)",
              borderBottom: isOn
                ? "2px solid var(--gf-accent)"
                : "2px solid transparent",
              marginBottom: "-1px",
              background: isOn ? "var(--gf-accent-soft)" : "transparent",
            }}
            onClick={(e) => {
              e.preventDefault();
              scrollTo(href);
            }}
          >
            <span>{emoji}</span>
            {label}
          </a>
        );
      })}
    </nav>
  );
}
