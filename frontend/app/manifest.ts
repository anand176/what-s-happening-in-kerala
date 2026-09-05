import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kerala Monitor — What's happening in Kerala",
    short_name: "Kerala Monitor",
    description:
      "Live streams, district map, weather, rainfall, dams, fuel & gold, markets and news for Kerala.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0a0e13",
    theme_color: "#0a0e13",
    categories: ["news", "weather", "utilities"],
    lang: "en-IN",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "District map", url: "/#districts" },
      { name: "Live news", url: "/#live-news" },
      { name: "Rainfall & dams", url: "/#rainfall" },
    ],
  };
}
