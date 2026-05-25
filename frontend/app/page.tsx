import { AlertBanner } from "@/components/chrome/AlertBanner";
import { MainNav } from "@/components/chrome/MainNav";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import type { FestivalsPayload } from "@/app/api/festivals/route";
import type { MoviesPayload } from "@/app/api/movies/route";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import { RouterRefreshButton } from "@/components/grafana/RouterRefreshButton";
import { GrafanaDashRow } from "@/components/GrafanaDashRow";
import { GrafanaDataRow } from "@/components/GrafanaDataRow";
import { KeralaMapWeatherLoader } from "@/components/KeralaMapWeatherLoader";
import { NewsSection } from "@/components/NewsSection";
import { StreamEmbeds } from "@/components/StreamEmbeds";
import { GITHUB_REPO_URL } from "@/config/site";
import { youtubeStreamEntries } from "@/config/sources";

export const dynamic = "force-dynamic";

type Upcoming = {
  title: string;
  date: string;
  note?: string;
  link?: string;
  poster?: string;
};

function appBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://127.0.0.1:3000";
}

async function loadFestivalsAndMovies(): Promise<{ festivalItems: Upcoming[]; movieItems: Upcoming[] }> {
  const base = appBaseUrl();
  let festivalItems: Upcoming[] = [];
  let movieItems: Upcoming[] = [];

  try {
    const [festRes, movieRes] = await Promise.all([
      fetch(`${base}/api/festivals`, { cache: "no-store" }),
      fetch(`${base}/api/movies`, { cache: "no-store" }),
    ]);

    if (festRes.ok) {
      const j = (await festRes.json()) as FestivalsPayload;
      festivalItems = (j.items ?? []).map((i) => ({
        title: i.title,
        date: i.date.slice(0, 10),
        note: i.note || undefined,
      }));
    }

    if (movieRes.ok) {
      const j = (await movieRes.json()) as MoviesPayload;
      movieItems = (j.items ?? []).map((i) => ({
        title: i.title,
        date: i.date.slice(0, 10),
        note: i.note || undefined,
        poster: i.poster ?? undefined,
      }));
    }
  } catch {
    /* keep empty arrays */
  }

  return { festivalItems, movieItems };
}

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

function daysUntilLabel(dateStr: string): string | null {
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff < 0) return null;
  if (diff === 0) return "Today!";
  if (diff === 1) return "Tomorrow!";
  return `${diff} days away`;
}

export default async function Home() {
  const { festivalItems, movieItems } = await loadFestivalsAndMovies();

  const mlFest =
    "\u0D35\u0D30\u0D3E\u0D28\u0D3F\u0D30\u0D3F\u0D15\u0D4D\u0D15\u0D41\u0D28\u0D4D\u0D28 \u0D06\u0D18\u0D4B\u0D37\u0D19\u0D4D\u0D19\u0D7E";
  const mlMovies =
    "\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02 \u0D38\u0D3F\u0D28\u0D3F\u0D2E";

  return (
    <div className="min-h-full bg-[#0b0f14]">
      <div className="gf-top-stripe" aria-hidden />
      <SiteHeader />
      <AlertBanner />
      <MainNav />

      <main className="mx-auto max-w-7xl space-y-5 px-3 py-5 md:px-5">
        <KeralaMapWeatherLoader />

        <StreamEmbeds entries={youtubeStreamEntries} />

        <GrafanaDataRow />

        <GrafanaDashRow />

        <NewsSection />

        <GrafanaPanel
          id="festivals"
          title="Upcoming festivals"
          subtitle={mlFest}
          className="kt-animate-in kt-stagger-4 scroll-mt-[120px]"
          rightSlot={<RouterRefreshButton />}
        >
          {festivalItems.length === 0 ? (
            <p className="text-[0.85rem] text-[var(--gf-text-muted)]">
              No upcoming festivals from the calendar API yet. Configure keys in{" "}
              <code className="font-mono text-[var(--gf-accent)]">.env</code> or check{" "}
              <code className="font-mono text-[var(--gf-accent)]">/api/festivals</code>.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {festivalItems
                .filter((item) => daysUntilLabel(item.date) !== null)
                .map((item) => {
                  const countdown = daysUntilLabel(item.date)!;
                  const d = new Date(`${item.date}T12:00:00`);
                  const dateLabel = d.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const weekdayLabel = d.toLocaleDateString("en-IN", { weekday: "long" });
                  return (
                    <div
                      key={`${item.title}-${item.date}`}
                      className="kt-card-hover gf-subpanel relative flex items-stretch overflow-hidden"
                    >
                      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-3">
                        <div className="text-[0.88rem] font-semibold leading-snug text-[var(--gf-text)]">
                          {item.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[0.62rem] font-semibold text-[var(--gf-text-muted)]">
                            {dateLabel}
                          </span>
                          <span className="font-mono text-[0.6rem] capitalize text-[var(--gf-text-muted)]">
                            {weekdayLabel}
                          </span>
                        </div>
                        {item.note ? (
                          <div className="font-mono text-[0.55rem] leading-snug text-[var(--gf-text-muted)] opacity-90">
                            {item.note}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center pr-3">
                        <span className="rounded-sm border border-[var(--gf-panel-border)] bg-[var(--gf-panel-inner)] px-2 py-1 text-center font-mono text-[0.6rem] leading-tight font-bold text-[var(--gf-text-muted)]">
                          {countdown === "Today!" || countdown === "Tomorrow!" ? (
                            countdown
                          ) : (
                            <>
                              <span className="block text-[0.72rem]">{countdown.replace(" days away", "")}</span>
                              <span className="block opacity-70">days</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </GrafanaPanel>

        <GrafanaPanel
          id="movies"
          title="Malayalam movies"
          subtitle={mlMovies}
          className="kt-animate-in kt-stagger-5 scroll-mt-[120px]"
        >
          {movieItems.length === 0 ? (
            <p className="text-[0.85rem] text-[var(--gf-text-muted)]">
              No Malayalam listings from Watchmode yet. Set{" "}
              <code className="font-mono text-[var(--gf-accent)]">WATCHMODE_API_KEY</code> in{" "}
              <code className="font-mono text-[var(--gf-accent)]">.env</code> or open{" "}
              <code className="font-mono text-[var(--gf-accent)]">/api/movies</code>.
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
                        {["\u{1F3AC}", "\u{1F39E}\uFE0F", "\u{1F3AD}", "\u{1F3DE}\uFE0F"][i % 4]}
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="line-clamp-2 text-[0.78rem] text-[var(--gf-text)]">{item.title}</div>
                    <div className="mt-1 font-mono text-[0.62rem] text-[var(--gf-text-muted)]">
                      {formatMovieDateLine(item.date)}
                    </div>
                    {item.note ? (
                      <div className="mt-0.5 text-[0.58rem] leading-snug text-[var(--gf-text-muted)] opacity-90">
                        {item.note}
                      </div>
                    ) : null}
                    <span className="mt-1 inline-block rounded-sm border border-[var(--gf-live)]/40 bg-[rgba(63,185,80,0.12)] px-1.5 py-0.5 font-mono text-[0.55rem] font-bold text-[var(--gf-live)]">
                      Showtime
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
        <span className="opacity-90">Kerala Monitor · God&apos;s Own Country</span>
        <div className="mt-5 flex justify-center">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-md border border-[var(--gf-panel-border)] bg-[var(--gf-panel-inner)] px-4 py-2.5 font-mono text-[0.68rem] font-semibold tracking-wide text-[var(--gf-text)] uppercase shadow-[inset_0_0_0_1px_rgba(240,90,40,0.12)] transition-[color,background-color,border-color,box-shadow] hover:border-[var(--gf-accent)]/45 hover:bg-[var(--gf-accent-soft)] hover:text-[var(--gf-accent)]"
          >
            <svg
              className="size-4 shrink-0 opacity-90 group-hover:opacity-100"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.113.825-.262.825-.585 0-.292-.015-1.263-.015-2.295-3.015.653-3.653-.735-3.885-1.403-.131-.33-.698-1.403-1.188-1.688-.405-.218-.99-.756-.015-.771.918-.014 1.575.844 1.791 1.188 1.05 1.744 2.73 1.253 3.39.948.098-.746.405-1.253.735-1.543-2.565-.293-5.265-1.283-5.265-5.698 0-1.26.45-2.288 1.185-3.096-.12-.293-.51-1.47.113-3.065 0 0 .968-.307 3.17 1.178a10.95 10.95 0 0 1 5.7 0c2.202-1.485 3.165-1.178 3.165-1.178.627 1.595.233 2.772.118 3.065.735.808 1.18 1.83 1.18 3.096 0 4.425-2.708 5.398-5.28 5.688.42.36.795 1.065.795 2.145 0 1.548-.015 2.79-.015 3.165 0 .323.225.708.825.585A11.987 11.987 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
            </svg>
            <span>Star on GitHub</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
