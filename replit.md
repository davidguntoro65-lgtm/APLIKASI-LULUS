# Aplikasi Kelulusan SMKN 1 Wonogiri 2026

Sistem informasi pengumuman kelulusan siswa SMKN 1 Wonogiri Tahun Pelajaran 2025/2026.

## Project Type

Frontend-only React + TypeScript single-page app built with Vite and Tailwind CSS v4. The repository also contains a `laravel/` directory with reference PHP controllers, models, migrations, and routes that document the intended backend API shape, but no Laravel runtime is installed or wired up. The frontend gracefully falls back to built-in mock data when the API endpoints (e.g. `/api/school-info`, `/api/admin/stats`) return errors, so the app works standalone.

## Multi-Domain / Portability

The app is deliberately built to be **drop-in portable** between Replit, cPanel shared hosting, and custom domains — no source edits required when migrating.

- **Frontend**: every `fetch()` call uses a relative path (`/api/...`), so it automatically targets `window.location.origin`. Asset URLs from the backend are normalised through `resolveAssetUrl()` (in `src/App.tsx`) which accepts either an absolute URL (when the backend already wrapped it via `Storage::url()`) or a raw relative path — preventing the classic `/storage/https://...` double-prefix bug.
- **Backend** (`laravel/`): all asset URLs are produced via `Setting::publicUrl()` → `Storage::disk('public')->url()`, which derives its host from `APP_URL` in `.env`. `config/cors.php` allows requests from any origin.
- **One-click deploy**: `GET /api/deploy/setup?token=<DEPLOY_TOKEN>` runs `migrate --force`, `storage:link`, `config:clear`, and `route:clear` in a single request — so a fresh cPanel install does not require terminal access. See `laravel/DEPLOYMENT.md` for the full runbook.

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- Framer Motion, Recharts, lucide-react, canvas-confetti
- `@google/genai` (Gemini API client) — uses `GEMINI_API_KEY` injected at build time via `vite.config.ts`

## Visual Identity — "Quantum Modern Blue"

- Primary: Royal Blue `#1D4ED8` (buttons, accents, active states)
- Background: Pure White `#FFFFFF` with Off-White `#F9FAFB` for section dividers
- Ink: `#111827` for headings, `#6B7280` for secondary text, `#9CA3AF` for placeholders
- Typography: Plus Jakarta Sans (display) + Inter fallback, extra-bold headlines
- Shape: 12–16px rounded corners, soft floating shadows
- Reusable Tailwind components live in `src/index.css`: `.quantum-card`, `.quantum-card-floating`, `.quantum-button`, `.quantum-button-ghost`, `.feature-badge`, `.quantum-input`, `.module-card-blue`

## Project Layout

- `index.html` — Vite entry
- `src/main.tsx` — React bootstrap
- `src/App.tsx` — All UI (countdown landing, student lookup, admin dashboard) and mock data
- `src/index.css` — Tailwind styles
- `src/lib/utils.ts` — Helpers
- `vite.config.ts` — Vite config (host `0.0.0.0`, port `5000`, `allowedHosts: true` for the Replit proxy)
- `laravel/` — Reference-only PHP backend code (not executed)

## Key Features

- **Integrity Pact (Pakta Integritas) Modal** — Spring-animated gatekeeper pop-up shown on first visit to the public landing. Displays the official announcement title + a red "HIMBAUAN PASCA PENGUMUMAN" list (no graffiti, no convoys, no crowds, no unlawful acts, uphold school name). Cannot be dismissed without checking the agreement and clicking "Saya Setuju & Lanjutkan". Persisted in `localStorage` under `skansagiri.integrityPact.agreed.v1` so a refresh in the same session does not re-prompt.

## Replit Setup

- **Workflow**: `Start application` runs `npm run dev` and serves the Vite dev server on port `5000` with `webview` output.
- **Vite config**: bound to `0.0.0.0:5000` with `allowedHosts: true` so the Replit iframe proxy can reach it.
- **Deployment**: configured as a `static` deployment — `npm run build` outputs to `dist/`.

## Environment Variables

- `GEMINI_API_KEY` (optional) — passed through `vite.config.ts` into `process.env.GEMINI_API_KEY` for the bundled client. Not required for the app to render.
