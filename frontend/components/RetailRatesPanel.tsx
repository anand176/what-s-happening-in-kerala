"use client";

import { useCallback, useEffect, useState } from "react";
import { GrafanaPanel } from "@/components/grafana/GrafanaPanel";
import type { RetailRatesPayload } from "@/lib/retail-rates";

const inr = (n: number, maxFrac = 2) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: maxFrac,
  }).format(n);

const inrInt = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export function RetailRatesPanel() {
  const [data, setData] = useState<RetailRatesPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetch(`/api/retail-rates?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const json = (await res.json()) as RetailRatesPayload;
      setData(json);
    } catch {
      setData(null);
      setErr("Could not load rates.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const mlSub =
    "\u0D2A\u0D47\u0D1F\u0D4D\u0D31\u0D4D\u0D31\u0D4D\u0D31\u0D4B\u0D02 \u0D21\u0D40\u0D38\u0D32\u0D4D\u0D31\u0D4D \u0D38\u0D4D\u0D35\u0D30\u0D4D\u0D23\u0D4D\u0D23\u0D02";

  return (
    <GrafanaPanel
      id="retail-rates"
      title="Petrol · diesel · gold (Kerala)"
      subtitle={mlSub}
      className="kt-stagger-1"
      rightSlot={
        <button
          type="button"
          onClick={() => load()}
          className="rounded-sm border border-[var(--gf-accent)] bg-[var(--gf-accent-soft)] px-2 py-1 font-mono text-[9px] font-semibold tracking-wide text-[var(--gf-accent)] uppercase"
        >
          Refresh
        </button>
      }
    >
      {err && (
        <p className="mb-3 text-[0.82rem] text-[var(--gf-danger)]">{err}</p>
      )}
      {!data && !err ? (
        <div className="py-6 text-center font-mono text-[0.8rem] text-[var(--gf-text-muted)]">
          <div className="kt-spinner" />
          Loading rates{"\u2026"}
        </div>
      ) : null}
      {data ? (
        <>
          <p className="mb-3 font-mono text-[0.65rem] leading-snug text-[var(--gf-text-muted)]">
            {data.regionLabel}
            <span className="block text-[var(--gf-live)]">
              As of {data.asOf}
            </span>
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="gf-subpanel p-3">
              <div className="font-mono text-[0.58rem] tracking-wide text-[var(--gf-text-muted)] uppercase">
                Petrol
              </div>
              <div className="mt-1 font-mono text-[1.05rem] font-semibold text-[var(--gf-accent)]">
                {inr(data.petrolInrPerLitre)}
              </div>
              <div className="mt-0.5 font-mono text-[0.58rem] text-[var(--gf-text-muted)]">
                per litre
              </div>
            </div>
            <div className="gf-subpanel p-3">
              <div className="font-mono text-[0.58rem] tracking-wide text-[var(--gf-text-muted)] uppercase">
                Diesel
              </div>
              <div className="mt-1 font-mono text-[1.05rem] font-semibold text-[var(--gf-accent)]">
                {inr(data.dieselInrPerLitre)}
              </div>
              <div className="mt-0.5 font-mono text-[0.58rem] text-[var(--gf-text-muted)]">
                per litre
              </div>
            </div>
            <div className="gf-subpanel p-3">
              <div className="font-mono text-[0.58rem] tracking-wide text-[var(--gf-text-muted)] uppercase">
                Gold 22K
              </div>
              <div className="mt-1 font-mono text-[1.05rem] font-semibold text-[var(--gf-warn)]">
                {inrInt(data.gold22Carat.inrPerGram)}
              </div>
              <div className="mt-0.5 font-mono text-[0.58rem] text-[var(--gf-text-muted)]">
                per gram
              </div>
            </div>
            <div className="gf-subpanel p-3">
              <div className="font-mono text-[0.58rem] tracking-wide text-[var(--gf-text-muted)] uppercase">
                1 pavan
              </div>
              <div className="mt-1 font-mono text-[1.05rem] font-semibold text-[var(--gf-warn)]">
                {inrInt(data.gold22Carat.inrPerPavan)}
              </div>
              <div className="mt-0.5 font-mono text-[0.58rem] text-[var(--gf-text-muted)]">
                {data.gold22Carat.pavanGrams} g 22 ct
              </div>
            </div>
          </div>
          <p className="mt-3 font-mono text-[0.6rem] leading-relaxed text-[var(--gf-text-muted)]">
            {data.disclaimer}
          </p>
        </>
      ) : null}
    </GrafanaPanel>
  );
}
