import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import { youtubeStreamEntries } from "@/config/sources";
import { youtubeEmbedUrl } from "@/lib/youtube";

type Entry = (typeof youtubeStreamEntries)[number];

function LivePill() {
  return <span className="badge badge-live pulse-live">LIVE</span>;
}

export function StreamEmbeds({ entries }: { entries: readonly Entry[] }) {
  return (
    <GrafanaPanel
      id="live-news"
      title="Live broadcasts."
      rightSlot={<LivePill />}
      className="stagger-2"
      contentClassName="!p-4"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {entries.map((e) => (
          <div key={e.videoId} className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--hairline-soft)] bg-[var(--canvas)] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between border-b border-[var(--hairline-soft)] bg-[var(--surface-card)] px-3 py-2">
              <span className="font-mono text-[11px] font-semibold tracking-wide text-[var(--ink)]">
                {e.name}
              </span>
            </div>
            <div className="relative aspect-video bg-[var(--ink)]">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={youtubeEmbedUrl(e.videoId)}
                title={e.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>
    </GrafanaPanel>
  );
}
