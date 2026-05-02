import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { buildApiRouter } from './routes.js';

const PORT = Number(process.env.PORT ?? 5000);
const HOST = '0.0.0.0';
const isDev = process.env.NODE_ENV !== 'production';

// ── Production security check ────────────────────────────────────────────────
// Warn loudly if DEPLOY_TOKEN is unset in production. Without it, the
// /api/deploy/setup endpoint falls back to the admin password — functional
// but less secure. Set DEPLOY_TOKEN in Replit Secrets or your .env file.
if (!isDev && !process.env.DEPLOY_TOKEN) {
  console.warn(
    '\n⚠️  [security] DEPLOY_TOKEN is not set.' +
    '\n   The /api/deploy/setup endpoint will accept the admin password as a token.' +
    '\n   Set DEPLOY_TOKEN in Replit Secrets (or .env) for dedicated production security.\n',
  );
}
// ────────────────────────────────────────────────────────────────────────────

async function start() {
  const app = express();

  // Serve uploaded files (logos, principal photos, gallery photos).
  // The API returns relative paths like "branding/foo.png" → exposed at /uploads/branding/foo.png
  const uploadRoot = path.resolve(process.cwd(), 'server', 'uploads');
  if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });
  app.use('/uploads', express.static(uploadRoot, { maxAge: '7d' }));

  // Mount the entire JSON API.
  app.use('/api', buildApiRouter());

  const httpServer = http.createServer(app);

  if (isDev) {
    // Vite in middleware mode — single port, single process, full HMR.
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
        allowedHosts: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const dist = path.resolve(process.cwd(), 'dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  httpServer.listen(PORT, HOST, () => {
    const appUrl = process.env.APP_URL || `http://${HOST}:${PORT}`;
    console.log(`[server] ready on http://${HOST}:${PORT} (APP_URL=${appUrl})`);
  });
}

start().catch((err) => {
  console.error('[server] fatal startup error:', err);
  process.exit(1);
});
