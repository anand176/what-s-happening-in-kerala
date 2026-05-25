import { Navbar } from "@/components/chrome/Navbar";
import { GrafanaDashRow, AirQualitySection, EarthquakesSection } from "@/components/GrafanaDashRow";
import { GrafanaDataRow, ExchangeRatesSection } from "@/components/GrafanaDataRow";
import { KeralaMapWeatherLoader } from "@/components/KeralaMapWeatherLoader";
import { NewsSection } from "@/components/NewsSection";
import { StreamEmbeds } from "@/components/StreamEmbeds";
import { FestivalsSection } from "@/components/FestivalsSection";
import { MoviesSection } from "@/components/MoviesSection";
import { GITHUB_REPO_URL } from "@/config/site";
import { youtubeStreamEntries } from "@/config/sources";

export default function Home() {
  return (
    <div className="relative min-h-dvh">
      <div className="hero-mesh" aria-hidden />
      <div className="relative z-10">
        <Navbar />

        <main className="mx-auto max-w-[1400px] px-3 py-4 md:px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Left section */}
            <div className="space-y-3">
              <KeralaMapWeatherLoader />
              <GrafanaDataRow />
              <GrafanaDashRow />
              <ExchangeRatesSection />
              <FestivalsSection />
            </div>

            {/* Right section */}
            <div className="space-y-3">
              <StreamEmbeds entries={youtubeStreamEntries} />
              <AirQualitySection />
              <EarthquakesSection />
              <NewsSection />
              <MoviesSection />
            </div>
          </div>
        </main>

        <footer className="border-t border-[var(--hairline-soft)] bg-[var(--canvas)] mt-6">
          <div className="mx-auto max-w-[1400px] px-3 py-8 md:px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <img src="/logo.svg" alt="Kerala Monitor Logo" className="h-8 w-8 object-contain" />
                  <div>
                    <h3 className="text-[14px] font-bold text-[var(--ink)]">Kerala Monitor</h3>
                    <p className="font-ml-sans text-[9px] text-[var(--mute)]">
                      God&apos;s Own Country
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-[var(--mute)] leading-relaxed">
                  Real-time command center for Kerala: live news, weather, markets, air quality, and more.
                </p>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-[12px] font-bold text-[var(--ink)] mb-3 uppercase tracking-wide">Quick Links</h4>
                <ul className="space-y-2">
                  <li><a href="#districts" className="text-[11px] text-[var(--mute)] hover:text-[var(--primary)] transition-colors">Districts</a></li>
                  <li><a href="#live-news" className="text-[11px] text-[var(--mute)] hover:text-[var(--primary)] transition-colors">Live News</a></li>
                  <li><a href="#markets" className="text-[11px] text-[var(--mute)] hover:text-[var(--primary)] transition-colors">Markets</a></li>
                  <li><a href="#latest-news" className="text-[11px] text-[var(--mute)] hover:text-[var(--primary)] transition-colors">Headlines</a></li>
                </ul>
              </div>

              {/* Top Contributors */}
              <div>
                <h4 className="text-[12px] font-bold text-[var(--ink)] mb-3 uppercase tracking-wide">Top Contributors</h4>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://github.com/anand176"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2.5 rounded-md border border-[var(--hairline-soft)] bg-[var(--surface-soft)] p-2 hover:bg-[var(--surface-card)] transition-all max-w-[200px]"
                  >
                    <img
                      src="https://github.com/anand176.png?size=64"
                      alt="Anand Harikrishnan"
                      className="h-8 w-8 rounded-full object-cover border border-[var(--hairline-soft)]"
                    />
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-[var(--ink)] truncate group-hover:text-[var(--primary)] transition-colors">
                        Anand Harikrishnan
                      </div>
                      <div className="text-[9px] text-[var(--mute)] font-mono">
                        @anand176
                      </div>
                    </div>
                  </a>
                </div>
              </div>

              {/* Connect */}
              <div>
                <h4 className="text-[12px] font-bold text-[var(--ink)] mb-3 uppercase tracking-wide">Connect</h4>
                <div className="flex gap-2">
                  <a
                    href={GITHUB_REPO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--hairline-soft)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--canvas)] transition-all"
                    title="GitHub"
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.113.825-.262.825-.585 0-.292-.015-1.263-.015-2.295-3.015.653-3.653-.735-3.885-1.403-.131-.33-.698-1.403-1.188-1.688-.405-.218-.99-.756-.015-.771.918-.014 1.575.844 1.791 1.188 1.05 1.744 2.73 1.253 3.39.948.098-.746.405-1.253.735-1.543-2.565-.293-5.265-1.283-5.265-5.698 0-1.26.45-2.288 1.185-3.096-.12-.293-.51-1.47.113-3.065 0 0 .968-.307 3.17 1.178a10.95 10.95 0 0 1 5.7 0c2.202-1.485 3.165-1.178 3.165-1.178.627 1.595.233 2.772.118 3.065.735.808 1.18 1.83 1.18 3.096 0 4.425-2.708 5.398-5.28 5.688.42.36.795 1.065.795 2.145 0 1.548-.015 2.79-.015 3.165 0 .323.225.708.825.585A11.987 11.987 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-6 pt-4 border-t border-[var(--hairline-soft)] flex flex-col md:flex-row justify-between items-center gap-2">
              <p className="text-[10px] text-[var(--mute)]">
                © {new Date().getFullYear()} Kerala Monitor. Built with Next.js & React.
              </p>
              <p className="text-[10px] text-[var(--mute)]">
                Data from Open-Meteo, USGS, Yahoo Finance & RSS feeds
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
