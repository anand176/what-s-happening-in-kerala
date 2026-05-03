"use client";

import { useCallback, useEffect, useState } from "react";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import type { ForexPayload, ForexRate } from "@/app/api/forex/route";

const REFRESH_MS = 60 * 60 * 1000; // 1 hour — free tier updates hourly

const FLAG: Record<string, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  AED: "🇦🇪",
  SGD: "🇸🇬",
  SAR: "🇸🇦",
};

function ForexCard({ rate }: { rate: ForexRate }) {
  const inrFormatted = rate.inrPer.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (
    <div className="kt-card-hover gf-subpanel flex flex-col items-center p-3 text-center">
      <span className="text-2xl" aria-hidden>
        {FLAG[rate.code] ?? "💱"}
      </span>
      <span className="mt-1 font-mono text-[0.68rem] font-semibold tracking-wider text-[var(--gf-text-muted)] uppercase">
        {rate.code}
      </span>
      <span className="mt-1 font-mono text-[1.05rem] font-bold text-[var(--gf-accent)]">
        ₹{inrFormatted}
      </span>
      <span className="mt-0.5 font-mono text-[0.58rem] text-[var(--gf-text-muted)]">
        per 1 {rate.code}
      </span>
    </div>
  );
}

export function ForexPanel() {
  const [data, setData] = useState<ForexPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/forex?t=${Date.now()}`, { cache: "no-store" });
      const json = (await res.json()) as ForexPayload;
      setData(json);
      setUpdatedAt(new Date());
    } catch {
      /* keep previous */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const mlSub = "വിദേശ നാണ്യ നിരക്ക്";

  return (
    <GrafanaPanel
      id="forex"
      title="INR exchange rates"
      subtitle={mlSub}
      className="kt-animate-in kt-stagger-1 scroll-mt-[120px]"
      rightSlot={
        updatedAt ? (
          <span className="font-mono text-[10px] text-[var(--gf-text-muted)]">
            {updatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
        ) : undefined
      }
    >
      {loading && (
        <div className="py-8 text-center text-[0.85rem] text-[var(--gf-text-muted)]">
          <div className="kt-spinner" />
          Loading exchange rates…
        </div>
      )}
      {!loading && data?.error && (
        <p className="rounded-sm border border-[var(--gf-danger)]/40 bg-[rgba(226,77,77,0.1)] px-3 py-2 text-[0.82rem] text-[var(--gf-danger)]">
          {data.error}
        </p>
      )}
      {!loading && data && !data.error && (
        <>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-7">
            {data.rates.map((r) => (
              <ForexCard key={r.code} rate={r} />
            ))}
          </div>
          <p className="mt-3 font-mono text-[0.62rem] text-[var(--gf-text-muted)]">
            Base: INR · Updates hourly
          </p>
        </>
      )}
    </GrafanaPanel>
  );
}
