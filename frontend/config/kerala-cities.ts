/** Main urban centres per district — used for Open-Meteo (coordinates — city / municipality hub). */
export const keralaMainCities = [
  {
    district: "Kasaragod",
    cityLabel: "Kasaragod",
    lat: 12.4996,
    lon: 74.9869,
  },
  {
    district: "Kannur",
    cityLabel: "Kannur Corp.",
    lat: 11.8745,
    lon: 75.3704,
  },
  {
    district: "Wayanad",
    cityLabel: "Kalpetta",
    lat: 11.6083,
    lon: 76.083,
  },
  {
    district: "Kozhikode",
    cityLabel: "Kozhikode Corp.",
    lat: 11.2588,
    lon: 75.7804,
  },
  {
    district: "Malappuram",
    cityLabel: "Malappuram",
    lat: 11.051,
    lon: 76.0711,
  },
  {
    district: "Palakkad",
    cityLabel: "Palakkad",
    lat: 10.7867,
    lon: 76.6548,
  },
  {
    district: "Thrissur",
    cityLabel: "Thrissur Corp.",
    lat: 10.5276,
    lon: 76.2144,
  },
  {
    district: "Ernakulam",
    cityLabel: "Kochi Corp.",
    lat: 9.9312,
    lon: 76.2673,
  },
  {
    district: "Idukki",
    cityLabel: "Thodupuzha",
    lat: 9.8953,
    lon: 76.7185,
  },
  {
    district: "Kottayam",
    cityLabel: "Kottayam",
    lat: 9.5916,
    lon: 76.5222,
  },
  {
    district: "Alappuzha",
    cityLabel: "Alappuzha",
    lat: 9.4981,
    lon: 76.3388,
  },
  {
    district: "Pathanamthitta",
    cityLabel: "Pathanamthitta",
    lat: 9.2648,
    lon: 76.787,
  },
  {
    district: "Kollam",
    cityLabel: "Kollam Corp.",
    lat: 8.8932,
    lon: 76.6141,
  },
  {
    district: "Thiruvananthapuram",
    cityLabel: "Thiruvananthapuram Corp.",
    lat: 8.5244,
    lon: 76.9361,
  },
] as const;

export type KeralaCity = (typeof keralaMainCities)[number];

const TIMEZONE = "Asia/Kolkata";

export function openMeteoMultiCityUrl(): string {
  const lat = keralaMainCities.map((c) => c.lat).join(",");
  const lon = keralaMainCities.map((c) => c.lon).join(",");
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=${encodeURIComponent(TIMEZONE)}`;
}
