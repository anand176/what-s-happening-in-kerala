import { NextResponse } from "next/server";
import { keralaMainCities } from "@/config/kerala-cities";

export const dynamic = "force-dynamic";

export type AqiCityData = {
  district: string;
  cityLabel: string;
  pm2_5: number | null;
  pm10: number | null;
  aqi_index: number | null; // Indian AQI (NAQI) 0–500
};

export type AqiPayload = {
  cities: AqiCityData[];
  updatedAt: string;
  error: string | null;
};

export async function GET() {
  const lat = keralaMainCities.map((c) => c.lat).join(",");
  const lon = keralaMainCities.map((c) => c.lon).join(",");
  const apiBase = process.env.AQI_API_BASE || "https://air-quality-api.open-meteo.com/v1/air-quality";
  const url =
    `${apiBase}` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=pm2_5,pm10,european_aqi` +
    `&timezone=Asia%2FKolkata`;

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`AQI API ${res.status}`);

    const raw = (await res.json()) as AqiRaw[] | AqiRaw;
    const list: AqiRaw[] = Array.isArray(raw) ? raw : [raw];

    const cities: AqiCityData[] = keralaMainCities.map((c, i) => {
      const d = list[i];
      return {
        district: c.district,
        cityLabel: c.cityLabel,
        pm2_5: d?.current?.pm2_5 ?? null,
        pm10: d?.current?.pm10 ?? null,
        aqi_index: d?.current?.european_aqi ?? null,
      };
    });

    return NextResponse.json(
      { cities, updatedAt: new Date().toISOString(), error: null } satisfies AqiPayload,
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { cities: [], updatedAt: new Date().toISOString(), error: msg } satisfies AqiPayload,
      { status: 500 },
    );
  }
}

type AqiRaw = {
  current?: {
    pm2_5?: number;
    pm10?: number;
    european_aqi?: number;
  };
};
