import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type WikiPayload = {
  title: string;
  extract: string; // plain-text summary, first ~3 sentences
  pageUrl: string;
  thumbnail: string | null;
  error: string | null;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const district = (searchParams.get("district") ?? "").trim();
  if (!district) {
    return NextResponse.json(
      { title: "", extract: "", pageUrl: "", thumbnail: null, error: "Missing district param" } satisfies WikiPayload,
      { status: 400 },
    );
  }

  // Try "<District> district, Kerala" first, fall back to "<District>, Kerala"
  const queries = [
    `${district} district, Kerala`,
    `${district}, Kerala`,
    district,
  ];

  for (const q of queries) {
    const url =
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "KeralaMonitor/1.0 (dashboard; contact@example.com)" },
        next: { revalidate: 3600 }, // cache 1 hour
      });
      if (!res.ok) continue;
      const json = (await res.json()) as WikiSummary;
      if (!json.extract) continue;

      // Trim to ~3 sentences to keep the card compact
      const sentences = json.extract.match(/[^.!?]+[.!?]+/g) ?? [];
      const extract = sentences.slice(0, 3).join(" ").trim() || json.extract.slice(0, 300);

      return NextResponse.json(
        {
          title: json.title,
          extract,
          pageUrl: json.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(q)}`,
          thumbnail: json.thumbnail?.source ?? null,
          error: null,
        } satisfies WikiPayload,
        { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } },
      );
    } catch {
      continue;
    }
  }

  return NextResponse.json(
    { title: district, extract: "", pageUrl: "", thumbnail: null, error: "No Wikipedia article found." } satisfies WikiPayload,
    { status: 404 },
  );
}

type WikiSummary = {
  title: string;
  extract: string;
  thumbnail?: { source: string };
  content_urls?: { desktop?: { page: string } };
};
