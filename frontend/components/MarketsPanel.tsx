"use client";

import { useCallback, useEffect, useState } from "react";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import type { MarketsPayload, MarketIndex } from "@/app/api/markets/route";

const REFRESH_MS = 5 * 60 * 1000; // 5 min

function IndexCard({ idx, marketOpen }: { idx: MarketIndex; marketOpen: boolean }) {
  const up = (idx.changePct ?? 0) >= 0;
  const changeColor = up ? "var(--gf-live)" : "var(--gf-danger)";
  const arrow = up ? "▲" : "▼";

  const priceStr =
    idx.price !== null
      ? idx.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })
      : "—";
  const pctStr =
    idx.changePct !== null
      ? `${up ? "+" : ""}${idx.changePct.toFixed(2)}%`
      : "—";
  const absStr =
    idx.change !== null
      ? `${up ? "+" : ""}${idx.change.toFixed(2)}`
      : "";

  return (
    <div className="kt-card-hover gf-subpanel relative overflow-hidden p-4">
      <span
        className="absolute top-0 right-0 left-0 h-0.5"
        style={{ background: changeColor }}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[0.65rem] font-semibold tracking-wider text-[var(--gf-text-muted)] uppercase">
            {idx.label}
          </p>
          <p className="mt-1 font-mono text-[1.4rem] font-bold leading-none text-[var(--gf-text)]">
            {priceStr}
          </p>
        </div>
        <div className="text-right">
          <span
            className="font-mono text-[0.85rem] font-bold"
            style={{ color: changeColor }}
          >
            {arrow} {pctStr}
          </span>
          {absStr && (
            <p className="font-mono text-[0.62rem]" style={{ color: changeColor }}>
              {absStr}
            </p>
          )}
        </div>
      </div>
      {idx.prevClose !== null && (
        <p className="mt-2 font-mono text-[0.6rem] text-[var(--gf-text-muted)]">
          Prev close {idx.prevClose.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        </p>
      )}
      {marketOpen && (
        <span className="mt-2 inline-flex items-center gap-1 font-mono text-[0.58rem] font-bold text-[var(--gf-live)]">
          <span className="kt-pulse-live inline-block h-1.5 w-1.5 rounded-full bg-[var(--gf-live)]" />
          LIVE
        </span>
      )}
    </div>
  );
}

export function MarketsPanel() {
  const [data, setData] = useState<MarketsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/markets?t=${Date.now()}`, { cache: "no-store" });
      const json = (await res.json()) as MarketsPayload;
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

  const mlSub = "ഓഹരി വിപണി";

  return (
    <GrafanaPanel
      id="markets"
      title="Indian markets"
      subtitle={mlSub}
      className="kt-animate-in kt-stagger-2 scroll-mt-[120px]"
      rightSlot={
        <div className="flex items-center gap-2">
          {data?.marketOpen && (
            <span className="flex items-center gap-1 font-mono text-[0.65rem] font-bold text-[var(--gf-live)]">
              <span className="kt-pulse-live inline-block h-1.5 w-1.5 rounded-full bg-[var(--gf-live)]" />
              Market open
            </span>
          )}
          {updatedAt && (
            <span className="font-mono text-[10px] text-[var(--gf-text-muted)]">
              {updatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      }
    >
      {loading && (
        <div className="py-8 text-center text-[0.85rem] text-[var(--gf-text-muted)]">
          <div className="kt-spinner" />
          Loading market data…
        </div>
      )}
      {!loading && data?.error && (
        <p className="rounded-sm border border-[var(--gf-warn)]/40 bg-[rgba(245,166,35,0.1)] px-3 py-2 text-[0.82rem] text-[var(--gf-warn)]">
          {data.error}
        </p>
      )}
      {!loading && data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {data.indices.map((idx) => (
              <IndexCard key={idx.symbol} idx={idx} marketOpen={data.marketOpen} />
            ))}
          </div>
          {!data.marketOpen && data.indices.some((i) => i.price !== null) && (
            <p className="mt-2 font-mono text-[0.62rem] text-[var(--gf-text-muted)]">
              Market closed · Showing last available prices
            </p>
          )}
          <p className="mt-2 font-mono text-[0.62rem] text-[var(--gf-text-muted)]">
            NSE/BSE · Refreshes every 5 min
          </p>
        </>
      )}
    </GrafanaPanel>
  );
}
