import { NextResponse } from "next/server";
import { KERALA_BBOX, keralaAirports } from "@/config/sources";

export const dynamic = "force-dynamic";

/**
 * Live aircraft over Kerala from the OpenSky Network.
 *
 * Anonymous access is heavily rate-limited (and OpenSky has been tightening it),
 * so set OPENSKY_USER / OPENSKY_PASS to use an account's higher quota. A 429 or
 * auth failure surfaces as a friendly message rather than an empty panel.
 */
const BASE = process.env.OPENSKY_BASE || "https://opensky-network.org/api";

export type Flight = {
  icao24: string;
  callsign: string | null;
  originCountry: string;
  lat: number;
  lon: number;
  /** Barometric altitude in metres. */
  altitude: number | null;
  /** Ground speed in m/s. */
  velocity: number | null;
  heading: number | null;
  onGround: boolean;
  /** Nearest Kerala airport by great-circle distance. */
  nearestAirport: string;
  nearestAirportKm: number;
};

export type FlightsPayload = {
  flights: Flight[];
  count: number;
  updatedAt: string;
  error: string | null;
};

/** OpenSky state vector tuple — index positions are fixed by their API. */
type StateVector = [
  string,            // 0 icao24
  string | null,     // 1 callsign
  string,            // 2 origin_country
  number | null,     // 3 time_position
  number | null,     // 4 last_contact
  number | null,     // 5 longitude
  number | null,     // 6 latitude
  number | null,     // 7 baro_altitude
  boolean,           // 8 on_ground
  number | null,     // 9 velocity
  number | null,     // 10 true_track
  ...unknown[],
];

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function nearestAirport(lat: number, lon: number) {
  let best: (typeof keralaAirports)[number] = keralaAirports[0];
  let bestKm = Number.POSITIVE_INFINITY;
  for (const a of keralaAirports) {
    const km = haversineKm(lat, lon, a.lat, a.lon);
    if (km < bestKm) {
      bestKm = km;
      best = a;
    }
  }
  return { iata: best.iata, km: Math.round(bestKm) };
}

export async function GET() {
  const { lamin, lomin, lamax, lomax } = KERALA_BBOX;
  const url = `${BASE}/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  const user = process.env.OPENSKY_USER;
  const pass = process.env.OPENSKY_PASS;
  if (user && pass) {
    headers.Authorization = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
  }

  try {
    const res = await fetch(url, { headers, cache: "no-store" });

    if (res.status === 429) {
      throw new Error("OpenSky rate limit reached — set OPENSKY_USER / OPENSKY_PASS for a higher quota.");
    }
    if (!res.ok) throw new Error(`OpenSky ${res.status}`);

    const json = (await res.json()) as { states?: StateVector[] | null };
    const states = json.states ?? [];

    const flights: Flight[] = states
      .filter((s) => typeof s[6] === "number" && typeof s[5] === "number")
      .map((s) => {
        const lat = s[6] as number;
        const lon = s[5] as number;
        const near = nearestAirport(lat, lon);
        return {
          icao24: s[0],
          callsign: s[1] ? s[1].trim() || null : null,
          originCountry: s[2],
          lat,
          lon,
          altitude: s[7],
          velocity: s[9],
          heading: s[10],
          onGround: s[8],
          nearestAirport: near.iata,
          nearestAirportKm: near.km,
        };
      })
      .sort((a, b) => (b.altitude ?? 0) - (a.altitude ?? 0));

    return NextResponse.json(
      {
        flights,
        count: flights.length,
        updatedAt: new Date().toISOString(),
        error: null,
      } satisfies FlightsPayload,
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { flights: [], count: 0, updatedAt: new Date().toISOString(), error: msg } satisfies FlightsPayload,
      { status: 200 },
    );
  }
}
