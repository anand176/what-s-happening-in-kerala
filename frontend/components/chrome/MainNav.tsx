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
  const [menuOpen, setMenuOpen] = useState(false);
  const railRef = useRef<HTMLElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const chipRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const scrollTo = useCallback((href: string) => {
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActive(href);
    }
    setMenuOpen(false);
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

  /** Keep the active chip visible in the horizontal rail (matters most on mobile). */
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

  /** Dismiss the full section menu on Escape or an outside tap. */
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [menuOpen]);

  return (
    <div ref={wrapRef} className="gf-nav-bar relative flex items-stretch">
      <nav
        ref={railRef}
        aria-label="Dashboard sections"
        className="gf-nav-fade flex min-w-0 flex-1 overflow-x-auto [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {LINKS.map(({ href, label }) => {
          const isOn = active === href;
          return (
            <a
              key={href}
              href={href}
              ref={(el) => { chipRefs.current[href] = el; }}
              aria-current={isOn ? "true" : undefined}
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

      {/* Full section index — the rail alone can't show all 17 at once on a phone. */}
      <button
        type="button"
        aria-label={menuOpen ? "Close section menu" : "Show all sections"}
        aria-expanded={menuOpen}
        aria-controls="nav-all-sections"
        onClick={() => setMenuOpen((v) => !v)}
        className="flex min-h-11 w-11 shrink-0 items-center justify-center border-l border-[var(--gf-panel-border)] bg-[var(--gf-header-bar)] text-[var(--gf-text-muted)] transition-colors hover:text-[var(--gf-accent)] md:hidden"
        style={menuOpen ? { color: "var(--gf-accent)", background: "var(--gf-accent-soft)" } : undefined}
      >
        <span className="sr-only">Sections</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" aria-hidden>
          {menuOpen ? (
            <>
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </>
          ) : (
            <>
              <line x1="3.5" y1="7" x2="20.5" y2="7" />
              <line x1="3.5" y1="12" x2="20.5" y2="12" />
              <line x1="3.5" y1="17" x2="20.5" y2="17" />
            </>
          )}
        </svg>
      </button>

      {menuOpen && (
        <div
          id="nav-all-sections"
          className="absolute top-full right-0 left-0 z-50 max-h-[70vh] overflow-y-auto border-b border-[var(--gf-panel-border)] bg-[var(--gf-panel-bg)] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.55)] md:hidden"
        >
          <div className="grid grid-cols-2 gap-1.5">
            {LINKS.map(({ href, label }) => {
              const isOn = active === href;
              return (
                <a
                  key={href}
                  href={href}
                  aria-current={isOn ? "true" : undefined}
                  onClick={(e) => { e.preventDefault(); scrollTo(href); }}
                  className="flex min-h-11 items-center rounded-sm border px-3 font-mono text-[0.7rem] font-medium tracking-wide uppercase transition-colors"
                  style={{
                    color: isOn ? "var(--gf-accent)" : "var(--gf-text-muted)",
                    borderColor: isOn ? "var(--gf-accent)" : "var(--gf-panel-border-soft)",
                    background: isOn ? "var(--gf-accent-soft)" : "var(--gf-panel-inner)",
                  }}
                >
                  {label}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
