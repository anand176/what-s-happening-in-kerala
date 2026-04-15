import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import { youtubeStreamEntries } from "@/config/sources";
import { youtubeEmbedUrl } from "@/lib/youtube";

type Entry = (typeof youtubeStreamEntries)[number];

function LivePill() {
  return (
    <span className="gf-live-pill kt-pulse-live font-mono">LIVE</span>
  );
}

export function StreamEmbeds({ entries }: { entries: readonly Entry[] }) {
  return (
    <GrafanaPanel
      id="live-news"
      title="Live broadcasts"
      // subtitle="All configured YouTube embeds · autoplay starts muted (unmute per player)"
      rightSlot={<LivePill />}
      className="kt-stagger-2"
      contentClassName="!p-3 md:!p-4"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
        {entries.map((e, i) => (
          <div
            key={e.videoId}
            className="gf-subpanel overflow-hidden"
          >
            <div className="gf-subpanel-toolbar">
              <span className="font-mono text-[10px] font-semibold tracking-wider text-[var(--gf-text-muted)]">
                FEED_{String(i + 1).padStart(2, "0")}
              </span>
              <span className="gf-live-pill text-[9px] py-0.5">ON AIR</span>
            </div>
            <div className="relative aspect-video bg-black">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={youtubeEmbedUrl(e.videoId)}
                title={`YouTube ${e.videoId}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
            <a
              href={e.url}
              target="_blank"
              rel="noopener noreferrer"
              className="gf-feed-footer block py-2 text-center font-mono text-[11px] font-medium text-[var(--gf-accent)] hover:underline"
            >
              OPEN ON YOUTUBE
            </a>
          </div>
        ))}
      </div>
    </GrafanaPanel>
  );
}
