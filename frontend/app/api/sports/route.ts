import { NextResponse } from "next/server";
import { keralaSportsTeams } from "@/config/sources";

export const dynamic = "force-dynamic";

/**
 * TheSportsDB free tier. Key "3" is their public test key; set THESPORTSDB_KEY
 * to a Patreon key for the fixture endpoints that are gated on the free tier.
 * Any endpoint that is gated or fails degrades to an empty list rather than
 * failing the whole panel.
 */
const API_KEY = process.env.THESPORTSDB_KEY || "3";
const BASE = process.env.THESPORTSDB_BASE || "https://www.thesportsdb.com/api/v1/json";

export type SportsFixture = {
  id: string;
  event: string;
  league: string | null;
  date: string | null;
  time: string | null;
  venue: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: "upcoming" | "result";
};

export type SportsTeam = {
  label: string;
  sport: string;
  teamName: string | null;
  badge: string | null;
  league: string | null;
  fixtures: SportsFixture[];
  note: string | null;
};

export type SportsPayload = {
  teams: SportsTeam[];
  updatedAt: string;
  error: string | null;
};

type RawTeam = {
  idTeam?: string;
  strTeam?: string;
  strBadge?: string;
  strTeamBadge?: string;
  strLeague?: string;
};

type RawEvent = {
  idEvent?: string;
  strEvent?: string;
  strLeague?: string;
  dateEvent?: string;
  strTime?: string;
  strVenue?: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
};

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function toFixture(e: RawEvent, status: "upcoming" | "result"): SportsFixture {
  const home = e.intHomeScore != null ? Number(e.intHomeScore) : null;
  const away = e.intAwayScore != null ? Number(e.intAwayScore) : null;
  return {
    id: e.idEvent ?? `${e.strEvent}-${e.dateEvent}`,
    event: e.strEvent ?? "Fixture",
    league: e.strLeague ?? null,
    date: e.dateEvent ?? null,
    time: e.strTime ? e.strTime.slice(0, 5) : null,
    venue: e.strVenue ?? null,
    homeScore: Number.isFinite(home) ? home : null,
    awayScore: Number.isFinite(away) ? away : null,
    status,
  };
}

async function loadTeam(cfg: (typeof keralaSportsTeams)[number]): Promise<SportsTeam> {
  const search = await getJson<{ teams?: RawTeam[] }>(
    `${BASE}/${API_KEY}/searchteams.php?t=${encodeURIComponent(cfg.query)}`,
  );
  const team = search?.teams?.[0];

  if (!team?.idTeam) {
    return {
      label: cfg.label,
      sport: cfg.sport,
      teamName: null,
      badge: null,
      league: null,
      fixtures: [],
      note: "Team not found on TheSportsDB.",
    };
  }

  const [next, last] = await Promise.all([
    getJson<{ events?: RawEvent[] | null }>(`${BASE}/${API_KEY}/eventsnext.php?id=${team.idTeam}`),
    getJson<{ results?: RawEvent[] | null }>(`${BASE}/${API_KEY}/eventslast.php?id=${team.idTeam}`),
  ]);

  const fixtures: SportsFixture[] = [
    ...(next?.events ?? []).slice(0, 3).map((e) => toFixture(e, "upcoming")),
    ...(last?.results ?? []).slice(0, 3).map((e) => toFixture(e, "result")),
  ];

  return {
    label: cfg.label,
    sport: cfg.sport,
    teamName: team.strTeam ?? null,
    badge: team.strBadge ?? team.strTeamBadge ?? null,
    league: team.strLeague ?? null,
    fixtures,
    note:
      fixtures.length === 0
        ? "No fixtures available on the free API tier right now."
        : null,
  };
}

export async function GET() {
  try {
    const teams = await Promise.all(keralaSportsTeams.map(loadTeam));
    return NextResponse.json(
      { teams, updatedAt: new Date().toISOString(), error: null } satisfies SportsPayload,
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { teams: [], updatedAt: new Date().toISOString(), error: msg } satisfies SportsPayload,
      { status: 500 },
    );
  }
}
