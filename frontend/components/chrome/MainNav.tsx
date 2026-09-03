"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const LINKS = [
  { href: "#districts",       label: "Districts"   },
  { href: "#live-news",       label: "Live News"   },
  { href: "#latest-news",     label: "Headlines"   },
  { href: "#forex",           label: "Forex"       },
  { href: "#markets",         label: "Markets"     },
  { href: "#retail-rates",    label: "Fuel & Gold" },
  { href: "#earthquakes",     label: "Seismic"     },
  { href: "#weather-section", label: "Weather"     },
  { href: "#aqi",             label: "Air Quality" },
  { href: "#rainfall",        label: "Rainfall"    },
  { href: "#reservoirs",      label: "Dams"        },
  { href: "#flights",         label: "Airspace"    },
  { href: "#sports",          label: "Sports"      },
  { href: "#lottery",         label: "Lottery"     },
  { href: "#jobs",            label: "Govt Jobs"   },
  { href: "#festivals",       label: "Festivals"   },
  { href: "#movies",          label: "Movies"      },
] as const;

export function MainNav() {
  const [active, setActive] = useState("#districts");
  const railRef = useRef<HTMLElement | null>(null);
  const chipRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

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

  useEffect(() => {
    const chip = chipRefs.current[active];
    const rail = railRef.current;
    if (!chip || !rail) return;
    const chipBox = chip.getBoundingClientRect();
    const railBox = rail.getBoundingClientRect();
    if (chipBox.left < railBox.left || chipBox.right > railBox.right) {
      chip.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [active]);

  return (
    <nav
      ref={railRef}
      className="gf-nav-bar gf-nav-fade flex overflow-x-auto [&::-webkit-scrollbar]:hidden"
      style={{ scrollbarWidth: "none" }}
    >
      {LINKS.map(({ href, label }) => {
        const isOn = active === href;
        return (
          <a
            key={href}
            href={href}
            ref={(el) => { chipRefs.current[href] = el; }}
            className="flex min-h-11 shrink-0 items-center px-3.5 py-2.5 font-mono text-[0.7rem] font-medium whitespace-nowrap tracking-wide uppercase transition-colors md:min-h-0 md:px-4 md:text-[0.72rem]"
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
