# Aplikasi Kelulusan SMKN 1 Wonogiri 2026

Sistem informasi pengumuman kelulusan siswa SMKN 1 Wonogiri Tahun Pelajaran 2025/2026.

## Project Type

Full-stack app: React + TypeScript SPA (Vite, Tailwind v4) on the frontend and an **Express + tsx backend** on the same port (5000) for the JSON API. The original `laravel/` directory remains as the reference / cPanel-portable backend, but the active runtime in Replit is the Node/Express server in `server/`.

### Replit Deployment (Publish)

Configured for **VM** deployment so the Express server stays online and the JSON datastore persists between requests:

- **Build command**: `npm run build` (Vite static bundle into `dist/`)
- **Run command**: `npm run start` (`NODE_ENV=production npx tsx server/index.ts`)
- In production the server skips Vite middleware and serves `dist/` via `express.static` plus an SPA fallback that returns `dist/index.html` for unknown routes; `/api/*` is unaffected.
- `APP_URL` is auto-derived from the incoming request host. Override only if needed (Secrets tab).
- Optional `DEPLOY_TOKEN` secret — if set, `/api/deploy/setup?token=…` is gated by it. If unset, the same endpoint accepts a logged-in admin Bearer token, so the in-dashboard "Force Migrate" button always works.
- Persistence note: `server/data.json` and `server/uploads/` live on the VM disk, so they survive runtime restarts but reset on redeploy. For permanent persistence, swap to Replit DB or PostgreSQL.

### Mode Online Total (current default)

`src/lib/localStore.ts` exports a `ONLINE_ONLY` flag that **disables the localStorage fallback** in `apiCall()`. The SPA only accepts data from the backend; if the API is unreachable the call resolves with `{ success:false, _fromLocal:true }` and the UI surfaces an error instead of silently writing to localStorage. The "Status Backend" health card in the Setup tab therefore shows **Terhubung (Online)** as long as the Express server is up, and **Tidak Terhubung (Mode Lokal)** if it is not.

Flip `ONLINE_ONLY` back to `false` if you want to re-enable the offline-first cPanel fallback path.

## Realwork Mode (Production Sanitization)

The repo ships in **Realwork Mode** — no dummy data, no placeholder content:

- **Students table starts empty.** The previous demo seed of 8 fictional students has been removed (`SEED_STUDENTS` is now `[]` in `src/lib/localStore.ts`). On first boot a one-time migration flag (`skansagiri.realwork_purged.v1`) wipes any leftover demo records from earlier builds so existing browsers also start clean.
- **Settings start blank.** `DEFAULT_SETTINGS` in `src/lib/localStore.ts` keeps only `school_name: 'SMKN 1 Wonogiri'`; every other field (NPSN, address, principal name, principal photo, motivation message, announcement date/time, headline) is empty. The Laravel reference seeder (`laravel/database/seeders/AppSettingsSeeder.php`) mirrors this.
- **Dynamic headline.** The landing-page H1 reads `schoolInfo?.headline ?? "Portal Kelulusan Online <school_name> TA 2025/2026"` — there is an editable "Headline Halaman Depan" input in the Pengaturan tab. The `headline` field is whitelisted in `Setting::ALLOWED_KEYS` and validated by `AdminController::updateSettings`.
- **Conditional motivation section.** The "Sambutan Kepala Sekolah" block on the landing page only renders when `motivationMessage` is non-empty. Combined with the empty default, the section is fully hidden until an admin enters a real message.
- **MOCK_STUDENTS removed.** What used to be a hardcoded array of two fictional students is now a pure TypeScript type alias (`StudentResult`) so the production bundle ships zero placeholder records while preserving compile-time type checks.
- **Production env defaults.** `laravel/.env.example` already ships with `APP_ENV=production` and `APP_DEBUG=false`. The PublicController returns empty strings (instead of dummy demo strings) when settings rows are missing, so the React fallbacks decide what to render.
- **Storage symlink is automated.** `App\Providers\AppServiceProvider::ensureStorageSymlink()` creates `public/storage` on every boot (with a recursive-copy fallback when the host forbids `symlink()`); the admin Setup tab also exposes the token-protected `/api/deploy/setup` endpoint that runs `migrate --force` + `storage:link` + cache clears in one click.
- **One-click "Hapus Semua Data Siswa".** The Setup & Maintenance tab has a dedicated "Zona Berbahaya" panel that calls `studentStore.purgeAll()` (frontend) / `AdminController::purgeStudents` (Laravel reference). It wipes the students table **and** the import_archives snapshots (otherwise a "restore" would re-introduce dummy rows) but intentionally preserves portal settings, audit log, and the integrity pact. The action is gated by a reusable `<ConfirmModal>` that requires typing the phrase `HAPUS SISWA` before the button activates. The same modal also gates "Hapus Semua Lokal" (phrase `HAPUS SEMUA`), restore/delete archive, reset tracking, and clear audit log — replacing every native `window.confirm()` call so the UX is consistent and on-brand.
- **Bulk-action toolbar in Data Siswa.** The students table has a checkbox column with a tri-state "select all" header and a per-row delete button. Selecting one or more rows reveals a sticky toolbar at the top of the table with three actions: **Tandai Lulus**, **Tandai Belum Lulus**, and **Hapus Terpilih**. All three resolve through `apiCall()` with localStore fallbacks (`studentStore.bulkRemove()` / `studentStore.bulkSetStatus()`) and matching Laravel reference endpoints (`AdminController::bulkDeleteStudents` / `bulkSetStatus`). Deleting 10 or more rows at once additionally requires typing `HAPUS TERPILIH` in the confirmation modal.

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

## Visual Identity — "Premium Helpdesk" (JatengProv-inspired)

The portal was rebranded from "Quantum Modern Blue" to a darker, more authoritative "Premium Helpdesk" identity:

- **Deep Navy** `#0F172A` — navbar, footer, hero gradient base, countdown band, modal headers
- **Royal Blue** `#1D4ED8` — primary CTA, hyperlinks, accent gradient stop in hero
- **Premium Gold** `#D4AF37` — eyebrows, countdown numbers, hairline accents under navy headers, attribution highlight
- **Charcoal** `#1A1A1A` — body ink for max legibility on white surfaces
- **Backgrounds**: Pure White `#FFFFFF` for content, Slate `#F8FAFC` for subtle section dividers
- **Typography**:
  - **Playfair Display** (serif) — display headlines, hero H1, modal titles, principal quote (`.font-serif-display`)
  - **Inter** (sans) — body, navigation, controls
  - **Montserrat** — secondary UI accents
- **Shape**: 12–16px rounded corners, gold hairlines (`border-[#D4AF37]/30`) under navy bars
- **Reusable Tailwind components** in `src/index.css`:
  - Legacy (auto-rebranded by token swap): `.quantum-card`, `.quantum-button`, `.quantum-input`, `.module-card-blue`
  - New theme primitives: `.premium-hero` (navy gradient + geometric grid), `.premium-nav`, `.premium-countdown`, `.gold-pill`, `.gold-number`, `.ghost-on-dark`, `.font-serif-display`
- **Attribution**: Public footer, login footer, admin sidebar, result-card footer, XLSX export sheets, and template download all read **"Created by: TIM IT Skansagiri | Powered by: Dave_Exe"** (changed from "Joben Enterprise"). The hardcoded admin credentials (`jobenapp` / `081460081343`) are preserved as-is.

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
- **Share & Download (Result Card)** — After a successful lookup, the result card exposes three actions: **Unduh SKL (PDF)** triggers `window.print()` so the student can use the browser's native "Save as PDF" — the print stylesheet in `src/index.css` strips the navy hero, sticky navbar, motivation section, countdown band, and footer so only the result card prints on A4 portrait with `break-inside: avoid`. **Bagikan WhatsApp** opens `https://wa.me/?text=...` with a pre-formatted bold message (school name, NISN, class, major, status, portal URL) so the student can forward it to family in one tap. **Kembali** returns to the search form. Both share/print actions emit a toast for feedback.
- **Admin Dashboard** — 5 tabs, all fully wired end-to-end:
  1. **Ringkasan Stat** — live KPI cards + passing-rate donut chart (driven by local stats).
  2. **Data Siswa** — searchable list with edit modal, export-to-Excel report (with summary sheet), and reset-tracking action. Empty-state CTA links to Import Center.
  3. **Import Center** — Excel `.xlsx`/`.xls` parser (client-side via `xlsx`), live status feedback (busy / done / error), per-row error report, automatic snapshot **archive** with one-click restore, plus template download.
  4. **Pengaturan** — school identity, principal photo + motivation message, **Galeri Sekolah** (multi-file uploader that center-crops every photo to 600×400 JPEG via a hidden canvas before saving — capped at 30 items, syncs to `POST/DELETE /api/admin/galleries` with `galleryStore` fallback), schedule, maintenance toggle, branded "Simpan Semua Perubahan" CTA. Images are persisted as base64 dataURLs in localStorage when offline.
  5. **Setup & Maintenance** — health card (active domain, backend status, local data + storage usage), one-click deploy form (token-protected `/api/deploy/setup`), backup download, reset Integrity Pact, full localStorage wipe, and a 200-entry audit log of every admin/public action.
- **Momen & Kegiatan SKANSAGIRI (Gallery Marquee)** — Bottom of the public landing renders a single-row, edge-faded infinite marquee of school activity photos. Cards are rounded-xl 3:2 with a gold hover glow + scale-1.04 effect; the loop pauses on hover and respects `prefers-reduced-motion`. Items are doubled in the DOM so `translateX(-50%)` produces a seamless loop. When the gallery is empty, an elegant "Gallery SMKN 1 Wonogiri" placeholder is shown instead. Fed from `GET /api/galleries` (Laravel `GalleryController` using Intervention Image v3 `Image::read()->cover(600,400)->toJpeg(82)`) with `galleryStore` localStorage fallback. Replaces the previously-redundant bottom navy countdown band — countdown remains in the hero section.
- **Toast notifications** — non-blocking success/error/info messages replace native `alert()` across all admin actions.
- **Offline banner** — automatically appears at the top of every admin tab when the backend is unreachable, explaining that data is being persisted locally.

## Replit Setup

- **Workflow**: `Start application` runs `npm run dev` which executes `tsx server/index.ts`. The Express server boots on `0.0.0.0:5000`, mounts `/api/*` for the backend, mounts `/uploads/*` for static file uploads (logos, principal photos, gallery photos), then attaches Vite in **middleware mode** so the SPA + HMR are served on the same port. One process, one port — no proxy.
- **Backend layout**: `server/index.ts` (entry), `server/routes.ts` (all `/api/*` handlers), `server/db.ts` (JSON-file persistence at `server/data.json` with auto-migrate on boot).
- **API contract**: matches the Laravel reference 1:1 — `{ success, data?, message? }` envelope, same routes, same field names.
- **Built-in admin (unchanged)**: `jobenapp` / `081460081343`. Verified via `crypto.timingSafeEqual` in `LoginController` equivalent inside `server/routes.ts`. Mirror constants live in `src/App.tsx`.
- **Stealth admin route**: `/panel-admin` is reachable by typing the URL directly. The public navbar and footer expose **no visible link or button** to the admin login — that was an explicit security requirement (April 2026).
- **APP_URL**: derived at runtime from the incoming request host inside `/api/deploy/health`, so the same build works on Replit dev, Replit deploy, cPanel, or a custom domain. Override with `APP_URL=...` in environment variables when an absolute URL is required for server-rendered responses.
- **Deployment**: previously configured as `static`. Should now be reconfigured as a `vm`/server deployment so the Express backend runs in production. Build: `npm run build`. Start: `NODE_ENV=production npm run start`.

## Environment Variables

- `PORT` (optional, default `5000`).
- `APP_URL` (optional). When unset, server responses use the request host.
- `DEPLOY_TOKEN` (optional). Token gating `/api/deploy/setup`. Leave unset to disable that endpoint.
- `GEMINI_API_KEY` (optional, unused at runtime today). Passed through `vite.config.ts` into `process.env.GEMINI_API_KEY` for the bundled client.
