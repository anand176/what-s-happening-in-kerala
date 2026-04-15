# Kerala dashboard

The Next.js UI lives in **`frontend/`**.

```bash
cd frontend
npm install
npm run dev
```

Build for production:

```bash
cd frontend
npm run build
npm start
```

Poster images: place files in `frontend/posters/`; `predev` / `prebuild` runs `npm run sync-posters` to copy them into `frontend/public/posters/`.

**Vercel / CI:** set the app **root directory** to `frontend` (or run all commands from `frontend/`).
