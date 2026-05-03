"use client";

import { useCallback, useEffect, useState } from "react";
import type { ForexPayload } from "@/app/api/forex/route";
import type { MarketsPayload } from "@/app/api/markets/route";
import type { QuakePayload } from "@/app/api/earthquakes/route";
import type { RetailRatesPayload } from "@/lib/retail-rates";

// ─── shared mini-panel shell ──────────────────────────────────────────────────

function MiniPanel({
  title,
  badge,
  id,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="gf-panel flex min-w-0 flex-1 flex-col scroll-mt-[120px]">
      <div className="flex items-center gap-2 border-b border-[var(--gf-panel-border)] bg-black/20 px-3 py-2">
        <span className="flex-1 font-mono text-[0.68rem] font-semibold tracking-widest text-[var(--gf-text)] uppercase">
          {title}
        </span>
        {badge}
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-6">
      <div className="kt-spinner" />
    </div>
  );
}

// ─── Exchange Rates ───────────────────────────────────────────────────────────

const CURRENCY_META: Record<string, { label: string; country: string }> = {
  USD: { label: "US Dollar",  country: "USA" },
  EUR: { label: "Euro",       country: "EUR" },
  GBP: { label: "Pound",      country: "GBP" },
  JPY: { label: "Yen",        country: "JPY" },
  AED: { label: "Dirham",     country: "UAE" },
  SGD: { label: "S$ Dollar",  country: "SGD" },
  SAR: { label: "Riyal",      country: "SAR" },
};

function ExchangeRatesPanel() {
  const [data, setData] = useState<ForexPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/forex?t=${Date.now()}`, { cache: "no-store" });
      setData(await res.json());
    } catch { /* keep */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = window.setInterval(load, 60 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <MiniPanel title="Exchange Rates" id="forex">
      {loading ? <Spinner /> : (
        <div className="divide-y divide-[var(--gf-panel-border)]">
          {(data?.rates ?? []).map((r) => {
            const meta = CURRENCY_META[r.code];
            return (
              <div key={r.code} className="flex items-center justify-between px-3 py-2 hover:bg-white/[0.03]">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 rounded-sm bg-[var(--gf-panel-border)] px-1 py-0.5 text-center font-mono text-[0.6rem] font-bold text-[var(--gf-text-muted)]">
                    {meta?.country ?? r.code.slice(0, 3)}
                  </span>
                  <span className="font-mono text-[0.72rem] font-semibold text-[var(--gf-text)]">{r.code}</span>
                  {meta && <span className="font-mono text-[0.6rem] text-[var(--gf-text-muted)]">{meta.label}</span>}
                </div>
                <span className="font-mono text-[0.88rem] font-bold text-[var(--gf-accent)]">
                  ₹{r.inrPer.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </MiniPanel>
  );
}

// ─── Indian Markets ───────────────────────────────────────────────────────────

function IndianMarketsPanel() {
  const [data, setData] = useState<MarketsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/markets?t=${Date.now()}`, { cache: "no-store" });
      setData(await res.json());
    } catch { /* keep */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = window.setInterval(load, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [load]);

  const liveBadge = data?.marketOpen ? (
    <span className="flex items-center gap-1 font-mono text-[0.55rem] font-bold text-[var(--gf-live)]">
      <span className="kt-pulse-live inline-block h-1.5 w-1.5 rounded-full bg-[var(--gf-live)]" />
      LIVE
    </span>
  ) : null;

  return (
    <MiniPanel title="Indian Markets" badge={liveBadge} id="markets">
      {loading ? <Spinner /> : (
        <div className="divide-y divide-[var(--gf-panel-border)]">
          {(data?.indices ?? []).map((idx) => {
            const up = (idx.changePct ?? 0) >= 0;
            const color = up ? "var(--gf-live)" : "var(--gf-danger)";
            return (
              <div key={idx.symbol} className="flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.03]">
                <div>
                  <div className="font-mono text-[0.7rem] font-semibold text-[var(--gf-text)]">{idx.label}</div>
                  {idx.prevClose !== null && (
                    <div className="font-mono text-[0.58rem] text-[var(--gf-text-muted)]">
                      Prev {idx.prevClose.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-mono text-[0.88rem] font-bold text-[var(--gf-text)]">
                    {idx.price !== null ? idx.price.toLocaleString("en-IN", { maximumFractionDigits: 0 }) : "—"}
                  </div>
                  {idx.changePct !== null && (
                    <div className="font-mono text-[0.65rem] font-bold" style={{ color }}>
                      {up ? "▲" : "▼"} {Math.abs(idx.changePct).toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MiniPanel>
  );
}

// ─── Petrol · Diesel · Gold ───────────────────────────────────────────────────

function FuelPanel() {
  const [data, setData] = useState<RetailRatesPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/retail-rates?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => { setData(j); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const inr = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
  const inrInt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const rows = data ? [
    { label: "Petrol",   value: inr(data.petrolInrPerLitre),          sub: "per litre",       color: "var(--gf-accent)" },
    { label: "Diesel",   value: inr(data.dieselInrPerLitre),           sub: "per litre",       color: "var(--gf-accent)" },
    { label: "LPG",      value: inrInt(data.lpgInrPerCylinder),        sub: "14.2 kg cylinder", color: "var(--gf-accent)" },
    { label: "Gold 22K", value: inrInt(data.gold22Carat.inrPerGram),   sub: "per gram",        color: "var(--gf-warn)" },
    { label: "1 Pavan",  value: inrInt(data.gold22Carat.inrPerPavan),  sub: `${data.gold22Carat.pavanGrams}g 22ct`, color: "var(--gf-warn)" },
  ] : [];

  const dateBadge = null;

  return (
    <MiniPanel title="Fuel &amp; Gold" id="retail-rates">
      {loading ? <Spinner /> : (
        <div className="divide-y divide-[var(--gf-panel-border)]">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.03]">
              <div>
                <div className="text-[0.72rem] font-medium text-[var(--gf-text)]">{r.label}</div>
                <div className="font-mono text-[0.58rem] text-[var(--gf-text-muted)]">{r.sub}</div>
              </div>
              <span className="font-mono text-[0.88rem] font-bold" style={{ color: r.color }}>
                {r.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </MiniPanel>
  );
}

// ─── Seismic ──────────────────────────────────────────────────────────────────

function magColor(mag: number) {
  if (mag < 2) return "var(--gf-text-muted)";
  if (mag < 3) return "var(--gf-live)";
  if (mag < 4) return "var(--gf-warn)";
  if (mag < 5) return "#e07b39";
  return "var(--gf-danger)";
}

function timeAgo(ms: number) {
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function SeismicPanel() {
  const [data, setData] = useState<QuakePayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/earthquakes?t=${Date.now()}`, { cache: "no-store" });
      setData(await res.json());
    } catch { /* keep */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = window.setInterval(load, 15 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [load]);

  const countBadge = data ? (
    <span className="rounded-sm bg-[var(--gf-warn)]/20 px-1.5 py-0.5 font-mono text-[0.55rem] font-bold text-[var(--gf-warn)]">
      {data.count}
    </span>
  ) : null;

  return (
    <MiniPanel title="Seismic · 30d" badge={countBadge} id="earthquakes">
      {loading ? <Spinner /> : !data?.quakes.length ? (
        <div className="px-3 py-4 text-center font-mono text-[0.72rem] text-[var(--gf-text-muted)]">
          No significant activity in last 30 days
        </div>
      ) : (
        <div className="divide-y divide-[var(--gf-panel-border)]">
          {data.quakes.slice(0, 15).map((q) => (
            <a
              key={q.id}
              href={q.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 no-underline hover:bg-white/[0.03]"
              style={{ color: "inherit" }}
            >
              <div className="min-w-0 flex-1 pr-2">
                <div className="truncate text-[0.7rem] text-[var(--gf-text)]">{q.place}</div>
                <div className="font-mono text-[0.58rem] text-[var(--gf-text-muted)]">
                  {timeAgo(q.time)} · {q.depth.toFixed(0)} km
                </div>
              </div>
              <span className="shrink-0 font-mono text-[0.95rem] font-bold" style={{ color: magColor(q.magnitude) }}>
                M{q.magnitude.toFixed(1)}
              </span>
            </a>
          ))}
        </div>
      )}
    </MiniPanel>
  );
}

// ─── Exported row ─────────────────────────────────────────────────────────────

export function GrafanaDataRow() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ExchangeRatesPanel />
      <IndianMarketsPanel />
      <FuelPanel />
      <SeismicPanel />
    </div>
  );
}
