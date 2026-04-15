/** WMO Weather interpretation codes (WW) for Open-Meteo current_weather.weathercode */
export function weatherCodeLabel(code: number): string {
  const c = [
    [0, "Clear"],
    [1, "Mainly clear"],
    [2, "Partly cloudy"],
    [3, "Overcast"],
    [45, "Fog"],
    [48, "Fog"],
    [51, "Light drizzle"],
    [53, "Drizzle"],
    [55, "Heavy drizzle"],
    [61, "Slight rain"],
    [63, "Rain"],
    [65, "Heavy rain"],
    [71, "Slight snow"],
    [73, "Snow"],
    [75, "Heavy snow"],
    [80, "Rain showers"],
    [81, "Rain showers"],
    [82, "Violent rain showers"],
    [95, "Thunderstorm"],
    [96, "Thunderstorm & hail"],
    [99, "Thunderstorm & hail"],
  ] as const;
  for (const [v, label] of c) {
    if (code === v) return label;
  }
  if (code > 0 && code < 50) return "Cloudy / variable";
  return `Code ${code}`;
}
