import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type FestivalItem = {
  title: string;
  date: string;
  note: string;
};

export type FestivalsPayload = {
  items: FestivalItem[];
  source: string;
  error: string | null;
};

// Calendarific response shape (subset)
type CalHoliday = {
  name: string;
  date: { iso: string };
  type: string[];
  description?: string;
};

async function fetchCalendarific(year: number): Promise<FestivalItem[]> {
  const key = process.env.CALENDARIFIC_API_KEY;
  if (!key) return [];
  const apiBase = process.env.CALENDARIFIC_API_BASE || "https://calendarific.com/api/v2/holidays";
  const url = `${apiBase}?api_key=${key}&country=IN&year=${year}&location=in-kl&type=national,observance,local`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return [];
  const json = await res.json();
  const holidays: CalHoliday[] = json?.response?.holidays ?? [];
  const today = new Date().toISOString().slice(0, 10);
  return holidays
    .filter((h) => h.date.iso >= today)
    .map((h) => ({ title: h.name, date: h.date.iso.slice(0, 10), note: h.type.join(", ") }));
}

// Fallback: Nager.Date (free, no key, national holidays only)
async function fetchNagerDate(year: number): Promise<FestivalItem[]> {
  const apiBase = process.env.NAGER_DATE_BASE || "https://date.nager.at/api/v3/PublicHolidays";
  const url = `${apiBase}/${year}/IN`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return [];
  const holidays = (await res.json()) as { date: string; localName: string; name: string; types: string[] }[];
  const today = new Date().toISOString().slice(0, 10);
  return holidays
    .filter((h) => h.date >= today)
    .map((h) => ({ title: h.localName || h.name, date: h.date, note: h.types.join(", ") }));
}

const FALLBACK_FESTIVALS: FestivalItem[] = [
  { title: "Vishu", date: "2026-04-14", note: "Traditional festival" },
  { title: "Id-ul-Zuha (Bakrid)", date: "2026-05-27", note: "Public holiday" },
  { title: "Muharram", date: "2026-06-26", note: "Public holiday" },
  { title: "Independence Day", date: "2026-08-15", note: "National holiday" },
  { title: "Thiruvonam (Onam)", date: "2026-08-26", note: "Traditional harvest festival" },
  { title: "Prophet Mohammad's Birthday", date: "2026-08-26", note: "Public holiday" },
  { title: "Gandhi Jayanthi", date: "2026-10-02", note: "National holiday" },
  { title: "Mahanavami", date: "2026-10-20", note: "Public holiday" },
  { title: "Vijayadasami", date: "2026-10-21", note: "Public holiday" },
  { title: "Christmas", date: "2026-12-25", note: "Public holiday" }
];

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    let items = await fetchCalendarific(new Date().getFullYear());
    let source = "calendarific";

    if (!items.length) {
      items = await fetchNagerDate(new Date().getFullYear());
      source = "nager.date";
    }

    // If still empty, try next year
    if (!items.length) {
      items = await fetchCalendarific(new Date().getFullYear() + 1);
      if (!items.length) {
        items = await fetchNagerDate(new Date().getFullYear() + 1);
        source = "nager.date";
      } else {
        source = "calendarific";
      }
    }

    // If still empty, use fallback list
    if (!items.length) {
      items = FALLBACK_FESTIVALS.filter((h) => h.date >= today);
      source = "fallback";
    }

    return NextResponse.json({ items, source, error: null } satisfies FestivalsPayload, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
    });
  } catch (e) {
    console.error("Festivals fetch failed, using fallback:", e);
    const items = FALLBACK_FESTIVALS.filter((h) => h.date >= today);
    return NextResponse.json(
      {
        items,
        source: "fallback",
        error: `Failed to fetch live updates: ${String(e)}`,
      } satisfies FestivalsPayload,
      {
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
      }
    );
  }
}
