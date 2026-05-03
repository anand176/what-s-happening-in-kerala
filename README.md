# What's happening in Kerala🥥

A real-time command-center dashboard for Kerala, built with a dark Grafana-inspired UI. Everything you need to know about God's Own Country — weather, air quality, markets, news, seismic activity, fuel prices, festivals, and more — in one place.

---

## What's inside

| Panel | Data |
|---|---|
| **District map** | Interactive Kerala map with district boundaries. Click any district for weather, AQI, and a Wikipedia brief |
| **City weather** | Live temperature and conditions for all 14 districts via Open-Meteo |
| **Air quality** | European AQI + PM2.5/PM10 per district via Open-Meteo Air Quality API |
| **Earthquakes** | Recent seismic events (M ≥ 1.0, last 30 days) in the Kerala region via USGS |
| **Live broadcasts** | 9 Kerala news channels embedded as YouTube live streams |
| **Indian markets** | NIFTY 50, SENSEX, NIFTY Bank, NIFTY IT via Yahoo Finance |
| **Exchange rates** | INR vs USD, EUR, GBP, JPY, AED, SGD, SAR via open.er-api.com |
| **Fuel & Gold** | Petrol, diesel, LPG, and 22K gold rates for Kerala (editable JSON) |
| **Headlines** | Merged RSS feeds from The Hindu Kerala and New Indian Express |
| **Upcoming festivals** | Public holidays and festivals with countdown |
| **Malayalam movies** | Current and upcoming releases with poster art |
| **Site header** | Malayalam calendar date (Kollam Era), live clock, and weather strip for 5 cities |

---

## Getting started

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
kerala-dashboard/
├── frontend/
│   ├── app/
│   │   ├── api/              # Server-side API routes
│   │   │   ├── aqi/          # Open-Meteo Air Quality
│   │   │   ├── earthquakes/  # USGS earthquake feed
│   │   │   ├── forex/        # Exchange rates
│   │   │   ├── markets/      # Yahoo Finance indices
│   │   │   ├── news/         # RSS feed aggregator
│   │   │   ├── retail-rates/ # Fuel & gold JSON
│   │   │   └── wiki-district/# Wikipedia district briefs
│   │   ├── page.tsx          # Main page layout
│   │   └── layout.tsx        # Root layout + fonts
│   ├── components/
│   │   ├── chrome/           # Header, nav, alert banner
│   │   ├── grafana/          # GrafanaPanel shell
│   │   ├── GrafanaDashRow    # Weather · AQI · Earthquakes row
│   │   ├── GrafanaDataRow    # Markets · Forex · Fuel · Seismic row
│   │   └── KeralaMapWeather  # Interactive district map
│   ├── config/
│   │   ├── kerala-cities.ts  # District coordinates
│   │   └── sources.ts        # YouTube channels + RSS feeds
│   ├── data/
│   │   ├── festivals.json    # Upcoming festivals (edit to update)
│   │   ├── movies.json       # Movie listings (edit to update)
│   │   └── retail-rates.json # Fuel & gold prices (edit to update)
│   └── public/
│       ├── kerala.geojson    # District boundary polygons
│       └── posters/          # Movie poster images
```

## Tech stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**
- **Tailwind CSS v4**
- **Leaflet + react-leaflet** — district map
- **rss-parser** — server-side RSS aggregation
- Open-Meteo, USGS, Yahoo Finance, open.er-api.com APIS
