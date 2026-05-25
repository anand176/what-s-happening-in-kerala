import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type QuakeFeature = {
  id: string;
  magnitude: number;
  place: string;
  time: number; // epoch ms
  depth: number; // km
  lat: number;
  lon: number;
  url: string;
};

export type QuakePayload = {
  quakes: QuakeFeature[];
  count: number;
  updatedAt: string;
  error: string | null;
};

// Bounding box that covers Kerala + 300 km buffer
const BBOX = {
  minLat: 7.5,
  maxLat: 14.0,
  minLon: 73.5,
  maxLon: 79.5,
};

export async function GET() {
  // Last 30 days, M ≥ 1.0
  const endTime = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const startTime = startDate.toISOString().split("T")[0];

  const apiBase = process.env.USGS_EARTHQUAKES_BASE || "https://earthquake.usgs.gov/fdsnws/event/1/query";
  const url =
    `${apiBase}?format=geojson` +
    `&starttime=${startTime}&endtime=${endTime}` +
    `&minlatitude=${BBOX.minLat}&maxlatitude=${BBOX.maxLat}` +
    `&minlongitude=${BBOX.minLon}&maxlongitude=${BBOX.maxLon}` +
    `&minmagnitude=1.0&orderby=time&limit=50`;

  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`USGS ${res.status}`);
    const json = (await res.json()) as UsgsResponse;

    const quakes: QuakeFeature[] = (json.features ?? []).map((f) => ({
      id: f.id,
      magnitude: f.properties.mag ?? 0,
      place: f.properties.place ?? "Unknown",
      time: f.properties.time,
      depth: f.geometry.coordinates[2] ?? 0,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      url: f.properties.url ?? "",
    }));

    return NextResponse.json(
      {
        quakes,
        count: quakes.length,
        updatedAt: new Date().toISOString(),
        error: null,
      } satisfies QuakePayload,
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { quakes: [], count: 0, updatedAt: new Date().toISOString(), error: msg } satisfies QuakePayload,
      { status: 500 },
    );
  }
}

type UsgsResponse = {
  features: Array<{
    id: string;
    properties: {
      mag: number | null;
      place: string | null;
      time: number;
      url: string | null;
    };
    geometry: {
      coordinates: [number, number, number]; // lon, lat, depth
    };
  }>;
};
