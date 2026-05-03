"use client";

import { useCallback, useEffect, useState } from "react";

const LINKS = [
  { href: "#districts",     label: "Districts"   },
  { href: "#live-news",     label: "Live News"   },
  { href: "#retail-rates",  label: "Fuel & Gold" },
  { href: "#markets",       label: "Markets"     },
  { href: "#forex",         label: "Forex"       },
  { href: "#aqi",           label: "Air Quality" },
  { href: "#earthquakes",   label: "Seismic"     },
  { href: "#latest-news",   label: "Headlines"   },
  { href: "#weather-section", label: "Weather"   },
  { href: "#festivals",     label: "Festivals"   },
  { href: "#movies",        label: "Movies"      },
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
      {LINKS.map(({ href, label }) => {
        const isOn = active === href;
        return (
          <a
            key={href}
            href={href}
            className="flex shrink-0 items-center px-4 py-2.5 font-mono text-[0.72rem] font-medium whitespace-nowrap tracking-wide uppercase transition-colors"
            style={{
              color: isOn ? "var(--gf-accent)" : "var(--gf-text-muted)",
              borderBottom: isOn ? "2px solid var(--gf-accent)" : "2px solid transparent",
              marginBottom: "-1px",
              background: isOn ? "var(--gf-accent-soft)" : "transparent",
            }}
            onClick={(e) => { e.preventDefault(); scrollTo(href); }}
          >
            {label}
          </a>
        );
      })}
    </nav>
  );
}
