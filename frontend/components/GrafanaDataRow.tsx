"use client";

import React, { useCallback, useEffect, useState } from "react";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import type { ForexPayload } from "@/app/api/forex/route";
import type { MarketsPayload } from "@/app/api/markets/route";
import type { QuakePayload } from "@/app/api/earthquakes/route";
import type { RetailRatesPayload } from "@/lib/retail-rates";

function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="spinner" />
    </div>
  );
}

// ─── Exchange Rates ───────────────────────────────────────────────────────────

const CURRENCY_META: Record<string, { label: string; flag: string }> = {
  USD: { label: "US Dollar", flag: "USD" },
  EUR: { label: "Euro", flag: "EUR" },
  GBP: { label: "Pound", flag: "GBP" },
  JPY: { label: "Yen", flag: "JPY" },
  AED: { label: "Dirham", flag: "AED" },
  SGD: { label: "S$ Dollar", flag: "SGD" },
  SAR: { label: "Riyal", flag: "SAR" },
};

function ExchangeRatesPanel() {
  const [data, setData] = useState<ForexPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/forex?t=${Date.now()}`, { cache: "no-store" });
      setData(await res.json());
    } catch { /* keep */ } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = window.setInterval(load, 60 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <GrafanaPanel 
      title="Exchange Rates" 
      id="forex" 
      className="scroll-mt-[140px]"
      rightSlot={
        <button
          type="button"
          onClick={load}
          disabled={refreshing}
          className="btn-secondary h-7 px-2.5 font-mono text-[10px] disabled:opacity-50"
        >
          {refreshing ? "⟳" : "↻"}
        </button>
      }
    >
      {loading ? <Spinner /> : (
        <div className="divide-y divide-[var(--hairline-soft)]">
          {(data?.rates ?? []).map((r) => {
            const meta = CURRENCY_META[r.code];
            return (
              <div key={r.code} className="flex items-center justify-between px-4 py-2.5 hover:bg-[var(--surface-card)] transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="rounded bg-[var(--secondary-bg)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--mute)]">
                    {meta?.flag ?? r.code}
                  </span>
                  <div>
                    <span className="font-mono text-[13px] font-semibold text-[var(--ink)]">{r.code}</span>
                    {meta && <span className="ml-1.5 font-mono text-[11px] text-[var(--mute)]">{meta.label}</span>}
                  </div>
                </div>
                <span className="font-mono text-[14px] font-bold text-[var(--ink)]">
                  ₹{r.inrPer.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </GrafanaPanel>
  );
}

// ─── Indian Markets ───────────────────────────────────────────────────────────

function IndianMarketsPanel() {
  const [data, setData] = useState<MarketsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/markets?t=${Date.now()}`, { cache: "no-store" });
      setData(await res.json());
    } catch { /* keep */ } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const id = window.setInterval(load, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [load]);

  const liveBadge = data?.marketOpen ? (
    <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-[var(--primary)]">
      <span className="pulse-live inline-block h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
      LIVE
    </span>
  ) : null;

  return (
    <GrafanaPanel 
      title="Indian Markets" 
      rightSlot={
        <div className="flex items-center gap-2">
          {liveBadge}
          <button
            type="button"
            onClick={load}
            disabled={refreshing}
            className="btn-secondary h-7 px-2.5 font-mono text-[10px] disabled:opacity-50"
          >
            {refreshing ? "⟳" : "↻"}
          </button>
        </div>
      }
      id="markets" 
      className="scroll-mt-[140px]"
    >
      {loading ? <Spinner /> : (
        <div className="divide-y divide-[var(--hairline-soft)]">
          {(data?.indices ?? []).map((idx) => {
            const up = (idx.changePct ?? 0) >= 0;
            const color = up ? "var(--primary)" : "var(--error)";
            return (
              <div key={idx.symbol} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-card)] transition-colors">
                <div>
                  <div className="text-[13px] font-semibold text-[var(--ink)]">{idx.label}</div>
                  {idx.prevClose !== null && (
                    <div className="font-mono text-[11px] text-[var(--mute)]">
                      Prev {idx.prevClose.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-mono text-[15px] font-bold text-[var(--ink)]">
                    {idx.price !== null ? idx.price.toLocaleString("en-IN", { maximumFractionDigits: 0 }) : "—"}
                  </div>
                  {idx.changePct !== null && (
                    <div className="font-mono text-[11px] font-bold" style={{ color }}>
                      {up ? "▲" : "▼"} {Math.abs(idx.changePct).toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GrafanaPanel>
  );
}

// ─── Fuel & Gold ──────────────────────────────────────────────────────────────

function FuelPanel() {
  const [data, setData] = useState<RetailRatesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setRefreshing(true);
    fetch(`/api/retail-rates?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => { setData(j); setLoading(false); setRefreshing(false); })
      .catch(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const inr = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
  const inrInt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const rows = data ? [
    { label: "Petrol", value: inr(data.petrolInrPerLitre), sub: "per litre", color: "var(--ink)" },
    { label: "Diesel", value: inr(data.dieselInrPerLitre), sub: "per litre", color: "var(--ink)" },
    { label: "LPG", value: inrInt(data.lpgInrPerCylinder), sub: "14.2 kg cylinder", color: "var(--ink)" },
    { label: "Gold 22K", value: inrInt(data.gold22Carat.inrPerGram), sub: "per gram", color: "var(--warning-deep)" },
    { label: "1 Pavan", value: inrInt(data.gold22Carat.inrPerPavan), sub: `${data.gold22Carat.pavanGrams}g 22ct`, color: "var(--warning-deep)" },
  ] : [];

  return (
    <GrafanaPanel 
      title="Fuel & Gold" 
      id="retail-rates" 
      className="scroll-mt-[140px]"
      rightSlot={
        <button
          type="button"
          onClick={load}
          disabled={refreshing}
          className="btn-secondary h-7 px-2.5 font-mono text-[10px] disabled:opacity-50"
        >
          {refreshing ? "⟳" : "↻"}
        </button>
      }
    >
      {loading ? <Spinner /> : (
        <div className="divide-y divide-[var(--hairline-soft)]">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-card)] transition-colors">
              <div>
                <div className="text-[13px] font-medium text-[var(--ink)]">{r.label}</div>
                <div className="font-mono text-[11px] text-[var(--mute)]">{r.sub}</div>
              </div>
              <span className="font-mono text-[14px] font-bold" style={{ color: r.color }}>{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </GrafanaPanel>
  );
}

// ─── Seismic ──────────────────────────────────────────────────────────────────

function magColor(mag: number) {
  if (mag < 2) return "var(--mute)";
  if (mag < 3) return "var(--primary)";
  if (mag < 4) return "var(--warning-deep)";
  if (mag < 5) return "#e07b39";
  return "var(--error)";
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

  return (
    <GrafanaPanel
      title="Seismic · 30d"
      rightSlot={data ? <span className="badge badge-count">{data.count}</span> : null}
      id="earthquakes"
      className="scroll-mt-[140px]"
    >
      {loading ? <Spinner /> : !data?.quakes.length ? (
        <div className="px-4 py-6 text-center font-mono text-[12px] text-[var(--mute)]">
          No significant activity in last 30 days.
        </div>
      ) : (
        <div className="divide-y divide-[var(--hairline-soft)]">
          {data.quakes.slice(0, 15).map((q) => (
            <a
              key={q.id}
              href={q.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-2.5 no-underline hover:bg-[var(--surface-card)] transition-colors"
              style={{ color: "inherit" }}
            >
              <div className="min-w-0 flex-1 pr-2">
                <div className="truncate text-[13px] text-[var(--ink)]">{q.place}</div>
                <div className="font-mono text-[11px] text-[var(--mute)]">
                  {timeAgo(q.time)} · {q.depth.toFixed(0)} km
                </div>
              </div>
              <span className="shrink-0 font-mono text-[16px] font-bold" style={{ color: magColor(q.magnitude) }}>
                M{q.magnitude.toFixed(1)}
              </span>
            </a>
          ))}
        </div>
      )}
    </GrafanaPanel>
  );
}

export function GrafanaDataRow() {
  return (
    <>
      <IndianMarketsPanel />
      <FuelPanel />
    </>
  );
}

export function ExchangeRatesSection() {
  return <ExchangeRatesPanel />;
}
