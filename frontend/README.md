# Kerala Monitor

A **single-page “command center” dashboard** for Kerala, India. It uses a dark, Grafana-inspired layout to surface everyday information in one place: an **interactive district map** (boundaries and main city markers), **live YouTube embeds** you configure, **merged English RSS headlines** from major Kerala news feeds, **petrol, diesel, and 22K gold** reference rates (editable JSON), **upcoming public holidays / festivals**, and **Malayalam movie** listings with optional poster art. The header includes a **Malayalam calendar line** and a **weather strip** for key cities via Open-Meteo.

Built with **Next.js** (App Router), **React**, **Tailwind CSS**, **Leaflet** for the map, and server routes for news and retail-rate JSON.

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).
