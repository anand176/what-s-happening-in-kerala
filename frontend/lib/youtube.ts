export function youtubeVideoIdFromUrl(input: string): string | null {
  try {
    const u = new URL(input.trim());
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id || null;
    }
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/watch")) {
        return u.searchParams.get("v");
      }
      if (u.pathname.startsWith("/embed/")) {
        return u.pathname.split("/")[2] || null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Embed URL without autoplay. Videos will be paused by default.
 */
export function youtubeEmbedUrl(videoId: string): string {
  const u = new URL(
    `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`,
  );
  u.searchParams.set("autoplay", "0");
  u.searchParams.set("playsinline", "1");
  return u.toString();
}
