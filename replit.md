# Aplikasi Kelulusan SMKN 1 Wonogiri 2026

Sistem informasi pengumuman kelulusan siswa SMKN 1 Wonogiri Tahun Pelajaran 2025/2026.

## Project Type

Frontend-only React + TypeScript single-page app built with Vite and Tailwind CSS v4. The repository also contains a `laravel/` directory with reference PHP controllers, models, migrations, and routes that document the intended backend API shape, but no Laravel runtime is installed or wired up.

The app is **fully functional standalone**: a localStorage-backed store (`src/lib/localStore.ts`) transparently substitutes for the API whenever requests fail, so every admin operation — input, edit, save, import (Excel), archive, restore, reporting — works without a backend. When the Laravel API is reachable (e.g. on cPanel), `apiCall()` uses the real endpoint instead. The UI is identical in both modes; an amber banner appears when the local fallback is active.

## Realwork Mode (Production Sanitization)

The repo ships in **Realwork Mode** — no dummy data, no placeholder content:

- **Students table starts empty.** The previous demo seed of 8 fictional students has been removed (`SEED_STUDENTS` is now `[]` in `src/lib/localStore.ts`). On first boot a one-time migration flag (`skansagiri.realwork_purged.v1`) wipes any leftover demo records from earlier builds so existing browsers also start clean.
- **Settings start blank.** `DEFAULT_SETTINGS` in `src/lib/localStore.ts` keeps only `school_name: 'SMKN 1 Wonogiri'`; every other field (NPSN, address, principal name, principal photo, motivation message, announcement date/time, headline) is empty. The Laravel reference seeder (`laravel/database/seeders/AppSettingsSeeder.php`) mirrors this.
- **Dynamic headline.** The landing-page H1 reads `schoolInfo?.headline ?? "Portal Kelulusan Online <school_name> TA 2025/2026"` — there is an editable "Headline Halaman Depan" input in the Pengaturan tab. The `headline` field is whitelisted in `Setting::ALLOWED_KEYS` and validated by `AdminController::updateSettings`.
- **Conditional motivation section.** The "Sambutan Kepala Sekolah" block on the landing page only renders when `motivationMessage` is non-empty. Combined with the empty default, the section is fully hidden until an admin enters a real message.
- **MOCK_STUDENTS removed.** What used to be a hardcoded array of two fictional students is now a pure TypeScript type alias (`StudentResult`) so the production bundle ships zero placeholder records while preserving compile-time type checks.
- **Production env defaults.** `laravel/.env.example` already ships with `APP_ENV=production` and `APP_DEBUG=false`. The PublicController returns empty strings (instead of dummy demo strings) when settings rows are missing, so the React fallbacks decide what to render.
- **Storage symlink is automated.** `App\Providers\AppServiceProvider::ensureStorageSymlink()` creates `public/storage` on every boot (with a recursive-copy fallback when the host forbids `symlink()`); the admin Setup tab also exposes the token-protected `/api/deploy/setup` endpoint that runs `migrate --force` + `storage:link` + cache clears in one click.

## Multi-Domain / Portability

The app is deliberately built to be **drop-in portable** between Replit, cPanel shared hosting, and custom domains — no source edits required when migrating.

- **Frontend**: every API call goes through `apiCall()` → `resolveApiUrl()` (in `src/lib/localStore.ts`), which prefixes the path with `window.location.origin`. The same build therefore targets whatever host the user opened the page from. Asset URLs from the backend are normalised through `resolveAssetUrl()` (in `src/App.tsx`) which accepts either an absolute URL (when the backend already wrapped it via `Storage::url()`) or a raw relative path — preventing the classic `/storage/https://...` double-prefix bug.
- **Backend** (`laravel/`): all asset URLs are produced via `Setting::publicUrl()` → `Storage::disk('public')->url()`, which derives its host from `APP_URL` in `.env`. `config/cors.php` allows requests from any origin. `App\Providers\AppServiceProvider` (1) auto-creates `public/storage` on boot — falling back to a recursive copy if the host forbids `symlink()` — and (2) calls `URL::forceScheme('https')` whenever `APP_URL` is HTTPS so Cloudflare-proxied cPanel installs keep absolute scheme-correct URLs.
- **One-click deploy**: `GET /api/deploy/setup?token=<DEPLOY_TOKEN>` runs `migrate --force`, `storage:link`, `config:clear`, and `route:clear` in a single request — so a fresh cPanel install does not require terminal access. See `laravel/DEPLOYMENT.md` for the full runbook.

## Built-in Administrator (Permanent / Read-Only)

The portal ships with a single permanent admin account that **cannot** be edited or deleted from the UI or the database:

| Field    | Value                                     |
| -------- | ----------------------------------------- |
| URL      | `/panel-admin` (login) → `/panel-admin/dashboard` (after success) |
| Username | `jobenapp`                                |
| Password | `081460081343`                            |

Implementation:
- **Frontend** — `ADMIN_USER` / `ADMIN_PASS` constants in `src/App.tsx` validate credentials directly. On success, an `skansagiri.adminAuth.v1` flag is written to `sessionStorage` (so closing the tab logs out) and the SPA pushes `/panel-admin/dashboard` via `history.pushState`. Every page reload re-derives the active view from `window.location.pathname`, so deep-linking works.
- **Backend** — `App\Http\Controllers\LoginController` short-circuits the auth flow when the username matches `jobenapp`, validating the password with `hash_equals()` and skipping the `users` table lookup entirely. Routes live under `/api/panel-admin/{login,logout,me}` and the login route is rate-limited (`throttle:6,1`).

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
- `src/App.tsx` — All UI (countdown landing, student lookup, admin dashboard with 5 tabs)
- `src/index.css` — Tailwind styles
- `src/lib/utils.ts` — Helpers (`cn`)
- `src/lib/localStore.ts` — Self-contained client-side persistence layer (students CRUD, settings, archives, audit log) + transparent `apiCall()` wrapper
- `vite.config.ts` — Vite config (host `0.0.0.0`, port `5000`, `allowedHosts: true` for the Replit proxy)
- `laravel/` — Reference-only PHP backend code (not executed). Includes `DEPLOYMENT.md`, hardened controllers, and `DeployController` for one-click setup.

## Key Features

- **Integrity Pact (Pakta Integritas) Modal** — Spring-animated gatekeeper pop-up shown on first visit to the public landing. Displays the official announcement title + a red "HIMBAUAN PASCA PENGUMUMAN" list. Persisted in `localStorage` under `skansagiri.integrityPact.agreed.v1`. Can be reset from the **Setup & Maintenance** tab.
- **Admin Dashboard** — 5 tabs, all fully wired end-to-end:
  1. **Ringkasan Stat** — live KPI cards + passing-rate donut chart (driven by local stats).
  2. **Data Siswa** — searchable list with edit modal, export-to-Excel report (with summary sheet), and reset-tracking action. Empty-state CTA links to Import Center.
  3. **Import Center** — Excel `.xlsx`/`.xls` parser (client-side via `xlsx`), live status feedback (busy / done / error), per-row error report, automatic snapshot **archive** with one-click restore, plus template download.
  4. **Pengaturan** — school identity, principal photo + motivation message, schedule, maintenance toggle, branded "Simpan Semua Perubahan" CTA. Images are persisted as base64 dataURLs in localStorage when offline.
  5. **Setup & Maintenance** — health card (active domain, backend status, local data + storage usage), one-click deploy form (token-protected `/api/deploy/setup`), backup download, reset Integrity Pact, full localStorage wipe, and a 200-entry audit log of every admin/public action.
- **Toast notifications** — non-blocking success/error/info messages replace native `alert()` across all admin actions.
- **Offline banner** — automatically appears at the top of every admin tab when the backend is unreachable, explaining that data is being persisted locally.

## Replit Setup

- **Workflow**: `Start application` runs `npm run dev` and serves the Vite dev server on port `5000` with `webview` output.
- **Vite config**: bound to `0.0.0.0:5000` with `allowedHosts: true` so the Replit iframe proxy can reach it.
- **Deployment**: configured as a `static` deployment — `npm run build` outputs to `dist/`.

## Environment Variables

- `GEMINI_API_KEY` (optional) — passed through `vite.config.ts` into `process.env.GEMINI_API_KEY` for the bundled client. Not required for the app to render.
