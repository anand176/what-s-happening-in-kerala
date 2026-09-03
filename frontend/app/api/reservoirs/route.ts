import { NextResponse } from "next/server";
import { keralaDams, damsAsOf, type KeralaDam } from "@/config/kerala-dams";

export const dynamic = "force-dynamic";

export type ReservoirAlert = "Normal" | "Blue" | "Orange" | "Red";

export type ReservoirRow = {
  name: string;
  district: string;
  unit: "m" | "ft";
  currentLevel: number;
  frl: number;
  blueAlert: number;
  orangeAlert: number;
  redAlert: number;
  operator: string;
  /** Storage between minLevel and FRL, as a percentage. */
  fillPercent: number;
  alert: ReservoirAlert;
};

export type ReservoirPayload = {
  dams: ReservoirRow[];
  asOf: string;
  /** True because levels are hand-maintained, not fetched live. */
  manualData: true;
  updatedAt: string;
};

function alertFor(d: KeralaDam): ReservoirAlert {
  if (d.currentLevel >= d.redAlert) return "Red";
  if (d.currentLevel >= d.orangeAlert) return "Orange";
  if (d.currentLevel >= d.blueAlert) return "Blue";
  return "Normal";
}

function fillPercent(d: KeralaDam): number {
  const span = d.frl - d.minLevel;
  if (span <= 0) return 0;
  const pct = ((d.currentLevel - d.minLevel) / span) * 100;
  return Math.max(0, Math.min(100, Math.round(pct * 10) / 10));
}

export async function GET() {
  const dams: ReservoirRow[] = keralaDams
    .map((d) => ({
      name: d.name,
      district: d.district,
      unit: d.unit,
      currentLevel: d.currentLevel,
      frl: d.frl,
      blueAlert: d.blueAlert,
      orangeAlert: d.orangeAlert,
      redAlert: d.redAlert,
      operator: d.operator,
      fillPercent: fillPercent(d),
      alert: alertFor(d),
    }))
    .sort((a, b) => b.fillPercent - a.fillPercent);

  return NextResponse.json(
    {
      dams,
      asOf: damsAsOf,
      manualData: true,
      updatedAt: new Date().toISOString(),
    } satisfies ReservoirPayload,
    { headers: { "Cache-Control": "no-store" } },
  );
}
