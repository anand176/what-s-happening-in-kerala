import { AlertBanner } from "@/components/chrome/AlertBanner";
import { ElephantDivider } from "@/components/chrome/ElephantDivider";
import { MainNav } from "@/components/chrome/MainNav";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import { KeralaMapWeatherLoader } from "@/components/KeralaMapWeatherLoader";
import { NewsSection } from "@/components/NewsSection";
import { RetailRatesPanel } from "@/components/RetailRatesPanel";
import { StreamEmbeds } from "@/components/StreamEmbeds";
import { youtubeStreamEntries } from "@/config/sources";
import festivals from "@/data/festivals.json";
import movies from "@/data/movies.json";

type Upcoming = {
  title: string;
  date: string;
  note?: string;
  link?: string;
  poster?: string;
};

function formatMovieDateLine(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T12:00:00`);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }
  return raw;
}

const FEST_EMOJI = ["\u{1F338}", "\u{1F389}", "\u{1F319}", "\u{1F49A}", "\u{1FA94}", "\u2728"];

function daysUntilLabel(dateStr: string): string | null {
  const diff = Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / 86400000,
  );
  if (diff < 0) return null;
  if (diff === 0) return "Today!";
  if (diff === 1) return "Tomorrow!";
  return `${diff} days away`;
}

export default function Home() {
  const festivalItems = festivals as Upcoming[];
  const movieItems = movies as Upcoming[];

  const mlFest =
    "\u0D35\u0D30\u0D3E\u0D28\u0D3F\u0D30\u0D3F\u0D15\u0D4D\u0D15\u0D41\u0D28\u0D4D\u0D28 \u0D06\u0D18\u0D4B\u0D37\u0D19\u0D4D\u0D19\u0D7E";
  const mlMovies =
    "\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02 \u0D38\u0D3F\u0D28\u0D3F\u0D2E";

  return (
    <div className="min-h-full bg-[var(--gf-page)]">
      <div className="gf-top-stripe" aria-hidden />
      <SiteHeader />
      <AlertBanner />
      <MainNav />

      <main className="mx-auto max-w-7xl space-y-5 px-3 py-5 md:px-5">
        <KeralaMapWeatherLoader />

        <RetailRatesPanel />

        <StreamEmbeds entries={youtubeStreamEntries} />

        <NewsSection />

        <ElephantDivider emoji={"\u{1F418}"} />

        <GrafanaPanel
          id="festivals"
          title="Upcoming festivals"
          subtitle={mlFest}
          className="kt-animate-in kt-stagger-4 scroll-mt-[120px]"
        >
          {festivalItems.length === 0 ? (
            <p className="text-[0.85rem] text-[var(--gf-text-muted)]">
              Add entries in data/festivals.json.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3">
              {festivalItems
                .filter((item) => daysUntilLabel(item.date) !== null)
                .map((item, i) => {
                  const countdown = daysUntilLabel(item.date)!;
                  const d = new Date(item.date);
                  const dateLabel = d.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  return (
                    <div
                      key={`${item.title}-${item.date}`}
                      className="kt-card-hover gf-subpanel relative overflow-hidden p-4 text-center"
                    >
                      <span
                        className="absolute top-0 right-0 left-0 h-0.5 bg-[var(--gf-accent)]"
                        aria-hidden
                      />
                      <span className="mb-2 block text-4xl">
                        {FEST_EMOJI[i % FEST_EMOJI.length]}
                      </span>
                      <div className="text-[0.86rem] font-semibold text-[var(--gf-text)]">
                        {item.title}
                      </div>
                      {item.note ? (
                        <div className="mt-1 text-[0.68rem] text-[var(--gf-text-muted)]">
                          {item.note}
                        </div>
                      ) : null}
                      <span className="mt-2 inline-block rounded-sm bg-[var(--gf-accent-soft)] px-2.5 py-0.5 font-mono text-[0.65rem] font-semibold text-[var(--gf-accent)]">
                        {dateLabel}
                      </span>
                      <div className="mt-2 font-mono text-[0.62rem] font-semibold text-[var(--gf-warn)]">
                        {"\u23F3"} {countdown}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </GrafanaPanel>

        <ElephantDivider emoji={"\u{1F4E1}"} />

        <GrafanaPanel
          id="movies"
          title="Malayalam movies"
          subtitle={mlMovies}
          className="kt-animate-in kt-stagger-5 scroll-mt-[120px]"
        >
          {movieItems.length === 0 ? (
            <p className="text-[0.85rem] text-[var(--gf-text-muted)]">
              Add entries in data/movies.json.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {movieItems.map((item, i) => (
                <div
                  key={`${item.title}-${item.date}-${i}`}
                  className="kt-card-hover gf-subpanel cursor-default overflow-hidden"
                >
                  <div className="relative aspect-[2/3] overflow-hidden border-b border-[var(--gf-panel-border)] bg-[var(--gf-panel-inner)]">
                    {item.poster ? (
                      <img
                        src={item.poster}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-4xl">
                        {
                          ["\u{1F3AC}", "\u{1F39E}\uFE0F", "\u{1F3AD}", "\u{1F3DE}\uFE0F"][
                            i % 4
                          ]
                        }
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="line-clamp-2 text-[0.78rem] text-[var(--gf-text)]">
                      {item.title}
                    </div>
                    <div className="mt-1 font-mono text-[0.62rem] text-[var(--gf-text-muted)]">
                      {formatMovieDateLine(item.date)}
                    </div>
                    {item.note ? (
                      <div className="mt-0.5 text-[0.58rem] leading-snug text-[var(--gf-text-muted)] opacity-90">
                        {item.note}
                      </div>
                    ) : null}
                    <span className="mt-1 inline-block rounded-sm border border-[var(--gf-live)]/40 bg-[rgba(63,185,80,0.12)] px-1.5 py-0.5 font-mono text-[0.55rem] font-bold text-[var(--gf-live)]">
                      {"\u{1F3A5}"} Showtime
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GrafanaPanel>
      </main>

      <footer className="mt-8 border-t border-[var(--gf-panel-border)] bg-[var(--gf-header-bar)] px-4 py-6 text-center font-mono text-[0.68rem] text-[var(--gf-text-muted)]">
        <span className="font-ml-serif mb-1 block text-[0.82rem] text-[var(--gf-accent)]">
          {"\u0D15\u0D47\u0D30\u0D33\u0D02 \u00B7 \u0D26\u0D48\u0D35\u0D24\u0D4D\u0D24\u0D3F\u0D28\u0D4D\u0D31\u0D46 \u0D38\u0D4D\u0D35\u0D28\u0D4D\u0D24\u0D02 \u0D28\u0D3E\u0D1F\u0D4D"}
        </span>
        Kerala Monitor — telemetry for God&apos;s Own Country
        <br />
        <span className="opacity-90">Data: Open-Meteo · RSS · GeoJSON districts</span>
      </footer>
    </div>
  );
}
