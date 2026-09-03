"use client";

import { useCallback, useEffect, useState } from "react";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import type { LotteryPayload } from "@/app/api/lottery/route";

function formatInr(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(n % 10_000_000 === 0 ? 0 : 1)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(n % 100_000 === 0 ? 0 : 1)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function LotteryPanel() {
  const [data, setData] = useState<LotteryPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/lottery?t=${Date.now()}`, { cache: "no-store" });
      setData((await res.json()) as LotteryPayload);
    } catch {
      /* keep previous */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const today = data?.week[0];

  return (
    <GrafanaPanel
      id="lottery"
      title="State lottery"
      subtitle="കേരള ഭാഗ്യക്കുറി"
      className="kt-animate-in gf-anchor"
      rightSlot={
        <span className="font-mono text-[10px] font-semibold tracking-wider text-[var(--gf-text-muted)]">
          DRAW SCHEDULE
        </span>
      }
    >
      {loading && (
        <div className="py-8 text-center text-[0.85rem] text-[var(--gf-text-muted)]">
          <div className="kt-spinner" />
          Loading draw schedule…
        </div>
      )}

      {!loading && data && (
        <>
          {today && (
            <div className="gf-subpanel mb-3 flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-mono text-[0.6rem] font-semibold tracking-widest text-[var(--gf-accent)] uppercase">
                  Today&apos;s draw · {today.weekdayLabel}
                </p>
                <p className="mt-1 text-[1.3rem] leading-none font-bold text-[var(--gf-text)]">
                  {today.ticketName}
                </p>
                <p className="mt-1.5 font-mono text-[0.62rem] text-[var(--gf-text-muted)]">
                  Series {today.seriesCode} · {data.drawTime} · {data.venue}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[0.55rem] tracking-widest text-[var(--gf-text-muted)] uppercase">
                  1st prize
                </p>
                <p className="font-mono text-[1.5rem] leading-none font-bold text-[var(--gf-live)]">
                  {formatInr(today.firstPrizeInr)}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {data.week.map((d) => (
              <div
                key={d.date}
                className="kt-card-hover gf-subpanel p-2.5"
                style={
                  d.isToday
                    ? { borderColor: "var(--gf-accent)", background: "var(--gf-accent-soft)" }
                    : undefined
                }
              >
                <p className="font-mono text-[0.55rem] font-bold tracking-wider text-[var(--gf-text-muted)] uppercase">
                  {d.weekdayLabel.slice(0, 3)}
                </p>
                <p className="mt-1 text-[0.78rem] leading-snug font-semibold text-[var(--gf-text)]">
                  {d.ticketName}
                </p>
                <p className="mt-1 font-mono text-[0.55rem] text-[var(--gf-text-muted)]">
                  {d.seriesCode} · {formatInr(d.firstPrizeInr)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <a
              href={data.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[0.68rem] font-semibold text-[var(--gf-live)] hover:underline"
            >
              Official results (statelottery.kerala.gov.in) →
            </a>
            <p className="font-mono text-[0.6rem] text-[var(--gf-text-muted)]">
              Schedule only — winning numbers are published as official gazette PDFs
            </p>
          </div>
        </>
      )}
    </GrafanaPanel>
  );
}
