import { NextResponse } from "next/server";
import { keralaMainCities } from "@/config/kerala-cities";

export const dynamic = "force-dynamic";

/** IMD 24-hour rainfall categories (mm). */
export type RainCategory =
  | "None"
  | "Light"
  | "Moderate"
  | "Heavy"
  | "Very Heavy"
  | "Extremely Heavy";

export function rainCategory(mm: number | null): RainCategory {
  if (mm === null || mm < 2.5) return "None";
  if (mm <= 15.5) return "Light";
  if (mm <= 64.4) return "Moderate";
  if (mm <= 115.5) return "Heavy";
  if (mm <= 204.4) return "Very Heavy";
  return "Extremely Heavy";
}

export type RainfallDistrict = {
  district: string;
  cityLabel: string;
  /** Rain already recorded over the previous 2 days (mm). */
  past48hMm: number | null;
  /** Forecast for today (mm). */
  todayMm: number | null;
  /** Forecast total for the next 5 days (mm). */
  next5dMm: number | null;
  /** Max daily precipitation probability across the forecast window (%). */
  maxProbability: number | null;
  category: RainCategory;
  /** Simple saturation signal: heavy recent rain + more coming. */
  floodWatch: boolean;
};

export type RainfallPayload = {
  districts: RainfallDistrict[];
  updatedAt: string;
  error: string | null;
};

type OmDaily = {
  daily?: {
    time?: string[];
    precipitation_sum?: (number | null)[];
    precipitation_probability_max?: (number | null)[];
  };
};

const PAST_DAYS = 2;

function sum(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => typeof v === "number");
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) * 10) / 10;
}

export async function GET() {
  const lat = keralaMainCities.map((c) => c.lat).join(",");
  const lon = keralaMainCities.map((c) => c.lon).join(",");
  const base =
    process.env.NEXT_PUBLIC_OPEN_METEO_BASE || "https://api.open-meteo.com/v1/forecast";
  const url =
    `${base}?latitude=${lat}&longitude=${lon}` +
    `&daily=precipitation_sum,precipitation_probability_max` +
    `&past_days=${PAST_DAYS}&forecast_days=6&timezone=Asia%2FKolkata`;

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const raw = (await res.json()) as OmDaily[] | OmDaily;
    const list: OmDaily[] = Array.isArray(raw) ? raw : [raw];

    const districts: RainfallDistrict[] = keralaMainCities.map((c, i) => {
      const daily = list[i]?.daily;
      const precip = daily?.precipitation_sum ?? [];
      const prob = daily?.precipitation_probability_max ?? [];

      // Index layout: [0..PAST_DAYS-1] = past days, [PAST_DAYS] = today, rest = forecast.
      const past48hMm = sum(precip.slice(0, PAST_DAYS));
      const todayMm = precip[PAST_DAYS] ?? null;
      const next5dMm = sum(precip.slice(PAST_DAYS, PAST_DAYS + 6));
      const probs = prob.slice(PAST_DAYS).filter((v): v is number => typeof v === "number");
      const maxProbability = probs.length ? Math.max(...probs) : null;

      const category = rainCategory(todayMm);
      const floodWatch =
        (past48hMm ?? 0) >= 64.5 && (next5dMm ?? 0) >= 64.5;

      return {
        district: c.district,
        cityLabel: c.cityLabel,
        past48hMm,
        todayMm: todayMm === null ? null : Math.round(todayMm * 10) / 10,
        next5dMm,
        maxProbability,
        category,
        floodWatch,
      };
    });

    return NextResponse.json(
      { districts, updatedAt: new Date().toISOString(), error: null } satisfies RainfallPayload,
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { districts: [], updatedAt: new Date().toISOString(), error: msg } satisfies RainfallPayload,
      { status: 500 },
    );
  }
}
