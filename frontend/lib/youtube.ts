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
 * Embed URL with autoplay. `mute=1` is required for autoplay in most browsers until
 * the user has interacted with the page; they can unmute in the YouTube controls.
 */
export function youtubeEmbedUrl(videoId: string): string {
  const u = new URL(
    `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`,
  );
  u.searchParams.set("autoplay", "1");
  u.searchParams.set("mute", "1");
  u.searchParams.set("playsinline", "1");
  return u.toString();
}
