# Aplikasi Kelulusan SMKN 1 Wonogiri 2026

Sistem informasi pengumuman kelulusan siswa SMKN 1 Wonogiri Tahun Pelajaran 2025/2026.

## Project Type

Frontend-only React + TypeScript single-page app built with Vite and Tailwind CSS v4. The repository also contains a `laravel/` directory with reference PHP controllers, models, migrations, and routes that document the intended backend API shape, but no Laravel runtime is installed or wired up. The frontend gracefully falls back to built-in mock data when the API endpoints (e.g. `/api/school-info`, `/api/admin/stats`) return errors, so the app works standalone.

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- Framer Motion, Recharts, lucide-react, canvas-confetti
- `@google/genai` (Gemini API client) — uses `GEMINI_API_KEY` injected at build time via `vite.config.ts`

## Project Layout

- `index.html` — Vite entry
- `src/main.tsx` — React bootstrap
- `src/App.tsx` — All UI (countdown landing, student lookup, admin dashboard) and mock data
- `src/index.css` — Tailwind styles
- `src/lib/utils.ts` — Helpers
- `vite.config.ts` — Vite config (host `0.0.0.0`, port `5000`, `allowedHosts: true` for the Replit proxy)
- `laravel/` — Reference-only PHP backend code (not executed)

## Replit Setup

- **Workflow**: `Start application` runs `npm run dev` and serves the Vite dev server on port `5000` with `webview` output.
- **Vite config**: bound to `0.0.0.0:5000` with `allowedHosts: true` so the Replit iframe proxy can reach it.
- **Deployment**: configured as a `static` deployment — `npm run build` outputs to `dist/`.

## Environment Variables

- `GEMINI_API_KEY` (optional) — passed through `vite.config.ts` into `process.env.GEMINI_API_KEY` for the bundled client. Not required for the app to render.
