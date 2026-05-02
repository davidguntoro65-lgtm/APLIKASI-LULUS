# Aplikasi Kelulusan SMKN 1 Wonogiri 2026

## Overview

This project is a comprehensive online graduation announcement system for SMKN 1 Wonogiri for the 2025/2026 academic year. It's designed to be a full-stack application providing a robust platform for students to check their graduation status and for administrators to manage student data, settings, and announcements efficiently. The system aims to streamline the graduation announcement process, offer an intuitive user experience, and provide secure data management.

## User Preferences

- I want iterative development.
- I prefer detailed explanations.
- Ask before making major changes.
- Do not make changes to the `laravel/` directory.

## System Architecture

The application is a full-stack system comprising a React + TypeScript SPA (Vite, Tailwind v4) for the frontend and an Express + `tsx` backend. The backend runs on port 5000, providing a JSON API. Data persistence is handled by Replit PostgreSQL via Drizzle ORM.

**Frontend (SPA):**
- Built with React 19 + TypeScript, Vite 6, and Tailwind CSS v4.
- Uses Framer Motion, Recharts, lucide-react, and canvas-confetti for UI/UX enhancements.
- `apiCall()` wrapper handles all API interactions, resolving API URLs dynamically to support multi-domain portability.
- Client-side persistence for settings, archives, and audit logs is managed by `src/lib/localStore.ts`.
- Features an integrity pact modal, result card with share/download options (PDF via `window.print()`, WhatsApp), and a comprehensive admin dashboard.
- The admin dashboard includes:
    - **Ringkasan Stat:** Live KPIs and a passing-rate donut chart.
    - **Data Siswa:** Searchable student list, Excel export, and tracking reset.
    - **Import Center:** Client-side Excel (`.xlsx`/`.xls`) parser with error reporting, automatic archiving, and one-click restore.
    - **Pengaturan:** School identity management, principal photo/motivation message, and **Sekolah Gallery** (multi-file uploader with image processing and backend sync).
    - **Setup & Maintenance:** Health card, one-click deploy, backup download, integrity pact reset, full localStorage wipe, and an audit log.
- Public facing pages include a dynamic headline and a conditional motivation section.
- A gallery marquee displays school activity photos with an infinite loop effect.
- Toast notifications are used for feedback, and an offline banner appears when the backend is unreachable.

**Backend (Node/Express):**
- Developed with Express and TypeScript, using `tsx` for execution.
- Integrates with Replit PostgreSQL via Drizzle ORM for database operations.
- `server/schema.ts` defines Drizzle table schemas for `students`, `settings`, `galleries`, and `import_archives`.
- `server/db.ts` manages database connections, Drizzle instances, migrations, and legacy JSON data imports.
- `server/routes.ts` contains API handlers for all data operations, ensuring async and transactional integrity.
- The API router triggers database migration and legacy data import on the first request.
- Implements a "Realwork Mode" with empty student and setting defaults for production readiness.
- Supports multi-domain portability by deriving `APP_URL` at runtime.
- Includes a built-in, uneditable administrator account (`jobenapp`/`081460081343`) with a stealth admin route (`/panel-admin`).

**Deployment & Environment:**
- Configured for **VM deployment** on Replit to ensure the Express server remains online and data persists.
- Build command: `npm run build` (Vite static bundle into `dist/`).
- Run command: `npm run start` (uses `cross-env NODE_ENV=production tsx server/index.ts` — works on Windows and Linux).
- `npm run clean` uses `rimraf dist` — cross-platform safe.
- In production, the server serves static files from `dist/` and uses an SPA fallback.
- Environment variables:
  - `DATABASE_URL` — **Required.** Provided automatically by Replit PostgreSQL.
  - `PORT` — Optional. Defaults to `5000`.
  - `APP_URL` — Optional. Derived from request host at runtime.
  - `DEPLOY_TOKEN` — **Recommended for production.** Set in Replit Secrets (or `.env`). Without it, `/api/deploy/setup` falls back to the admin password as the token. The server prints a ⚠️ warning on startup if this is unset in production mode.

**To set DEPLOY_TOKEN on Replit:** Go to the Secrets tab → add key `DEPLOY_TOKEN` → set a strong random value (e.g. 32+ hex chars). On a VPS, add it to your `.env` file.

**UI/UX and Visual Identity ("Premium Helpdesk"):**
- **Color Scheme:** Deep Navy (`#0F172A`), Royal Blue (`#1D4ED8`), Premium Gold (`#D4AF37`), Charcoal (`#1A1A1A`), Pure White (`#FFFFFF`), Slate (`#F8FAFC`).
- **Typography:** Playfair Display (serif) for headlines, Inter (sans) for body/navigation, Montserrat for accents.
- **Shape:** 12–16px rounded corners, gold hairlines.
- **Attribution:** "Created by: TIM IT Skansagiri | Powered by: Dave_Exe" consistently displayed.

## External Dependencies

- **Replit PostgreSQL:** The primary database for persistence.
- **Drizzle ORM:** Used for interacting with the PostgreSQL database.
- **`xlsx`:** Client-side library for parsing Excel files during student data import.
- **`pg`:** Node.js PostgreSQL client.
- **`cross-env`:** Ensures `NODE_ENV=production` works on both Windows and Linux in npm scripts.
- **`rimraf`:** Cross-platform `rm -rf` replacement for the `clean` script.
- **`crypto`:** Node.js built-in module used for secure credential comparison.

> Note: `@google/genai` and `drizzle-zod` were removed in the May 2026 audit — both were unused in the active codebase.