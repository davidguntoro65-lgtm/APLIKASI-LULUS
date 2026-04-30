/**
 * @license
 * Developed by: TIM IT SKANSAGIRI
 * Powered by: Joben Enterprise
 *
 * Self-contained client-side persistence layer.
 *
 * Why this exists:
 *   The portal ships with a reference Laravel backend (`laravel/`) but the
 *   project also runs as a pure-frontend SPA (Replit dev server, GitHub Pages,
 *   any static host). When the backend is not reachable, every admin operation
 *   (import, edit, save, reset, etc.) needs to keep working — otherwise demo /
 *   training scenarios would silently fail with "Terjadi kesalahan koneksi".
 *
 *   This module is a transparent fallback: each `apiCall` helper first tries
 *   the real API, and on any failure (network error, 4xx, 5xx, non-JSON HTML,
 *   …) it falls back to the localStorage-backed store defined here. The UI is
 *   unaware of the difference — every operation returns the same shape the
 *   real Laravel controllers produce.
 *
 * Storage namespace: everything is prefixed with `skansagiri.` to avoid
 * colliding with other apps on the same origin.
 */

const NS = 'skansagiri';
const K = {
  students:  `${NS}.students.v1`,
  settings:  `${NS}.settings.v1`,
  archives:  `${NS}.import_archives.v1`,
  audit:     `${NS}.audit_log.v1`,
  seeded:    `${NS}.seeded.v1`,
};

export type Student = {
  id: number;
  nisn: string;
  name: string;
  birth_place: string;
  birth_date: string;            // YYYY-MM-DD
  class: string;
  major: string;
  status_graduation: 0 | 1;
  viewed_at: string | null;      // ISO timestamp when first opened by the public form
  created_at: string;
  updated_at: string;
};

export type Settings = {
  announcement_date: string;
  announcement_time: string;
  maintenance_mode: boolean;
  headline: string;                  // landing-page headline (dynamic, admin-editable)
  school_name: string;
  school_npsn: string;
  school_address: string;
  principal_name: string;
  school_logo: string | null;        // base64 data URL OR relative path
  principal_photo: string | null;    // base64 data URL OR relative path
  motivation_message: string;
};

export type ImportArchive = {
  id: number;
  filename: string;
  imported: number;
  failed: number;
  total_after: number;
  created_at: string;             // ISO
  errors: string[];
  /** Compact snapshot so a future "restore" can repopulate the table. */
  snapshot: Student[];
};

export type AuditEntry = {
  id: number;
  at: string;
  actor: 'admin' | 'public' | 'system';
  action: string;
  target?: string | number;
  meta?: Record<string, unknown>;
};

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — silently drop */
  }
}

const nowIso = () => new Date().toISOString();

/* ------------------------------------------------------------------ *
 *  Audit log
 * ------------------------------------------------------------------ */

export const audit = {
  list(): AuditEntry[] {
    return readJSON<AuditEntry[]>(K.audit, []);
  },
  log(entry: Omit<AuditEntry, 'id' | 'at'>): AuditEntry {
    const all = audit.list();
    const next: AuditEntry = {
      id: (all[0]?.id ?? 0) + 1,
      at: nowIso(),
      ...entry,
    };
    // newest first, cap at 200 entries
    const trimmed = [next, ...all].slice(0, 200);
    writeJSON(K.audit, trimmed);
    return next;
  },
  clear(): void {
    writeJSON(K.audit, []);
  },
};

/* ------------------------------------------------------------------ *
 *  Settings
 * ------------------------------------------------------------------ */

/**
 * Realwork Mode — production defaults.
 *
 * Only the basic school identity (name) and an empty logo slot are kept.
 * Every other field starts blank so the admin must enter real, current data
 * from the Pengaturan tab before the portal is operational.
 */
const DEFAULT_SETTINGS: Settings = {
  announcement_date: '',
  announcement_time: '',
  maintenance_mode: false,
  headline: '',
  school_name: 'SMKN 1 Wonogiri',
  school_npsn: '',
  school_address: '',
  principal_name: '',
  school_logo: null,
  principal_photo: null,
  motivation_message: '',
};

export const settingsStore = {
  get(): Settings {
    return { ...DEFAULT_SETTINGS, ...readJSON<Partial<Settings>>(K.settings, {}) };
  },
  patch(patch: Partial<Settings>): Settings {
    const current = settingsStore.get();
    const next = { ...current, ...patch };
    writeJSON(K.settings, next);
    audit.log({ actor: 'admin', action: 'settings.update', meta: { keys: Object.keys(patch) } });
    return next;
  },
  reset(): Settings {
    writeJSON(K.settings, DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  },
};

/* ------------------------------------------------------------------ *
 *  Students CRUD
 * ------------------------------------------------------------------ */

/**
 * Realwork Mode — no dummy seed.
 *
 * The students table starts empty in production. Real data is loaded by the
 * admin via the Import Center (Excel upload). Any pre-existing local seed
 * from earlier dev/demo runs is purged automatically on first boot below.
 */
const SEED_STUDENTS: Omit<Student, 'id' | 'viewed_at' | 'created_at' | 'updated_at'>[] = [];

function seedIfEmpty(): void {
  if (!isBrowser) return;
  // One-time purge: if the legacy seed flag is still set, wipe any leftover
  // dummy records from earlier builds so the live portal starts clean.
  const purgeFlag = `${NS}.realwork_purged.v1`;
  if (window.localStorage.getItem(purgeFlag) !== '1') {
    window.localStorage.removeItem(K.students);
    window.localStorage.removeItem(K.seeded);
    window.localStorage.setItem(purgeFlag, '1');
    audit.log({ actor: 'system', action: 'students.realwork_purge' });
  }
  // Mark as "seeded" so subsequent loads skip this block entirely.
  if (window.localStorage.getItem(K.seeded) !== '1') {
    window.localStorage.setItem(K.seeded, '1');
  }
}

export const studentStore = {
  list(search = ''): Student[] {
    seedIfEmpty();
    const all = readJSON<Student[]>(K.students, []);
    if (!search) return all;
    const q = search.trim().toLowerCase();
    return all.filter((s) =>
      s.nisn.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.class.toLowerCase().includes(q) ||
      s.major.toLowerCase().includes(q),
    );
  },

  findByCredentials(nisn: string, birth_date: string): Student | null {
    seedIfEmpty();
    const all = readJSON<Student[]>(K.students, []);
    const match = all.find(
      (s) => s.nisn.trim() === nisn.trim() && s.birth_date === birth_date,
    );
    if (!match) return null;
    // Mark as viewed (one-time)
    if (!match.viewed_at) {
      match.viewed_at = nowIso();
      const next = all.map((s) => (s.id === match.id ? match : s));
      writeJSON(K.students, next);
      audit.log({ actor: 'public', action: 'student.viewed', target: match.nisn });
    }
    return match;
  },

  update(id: number, patch: Partial<Student>): Student | null {
    seedIfEmpty();
    const all = readJSON<Student[]>(K.students, []);
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    const updated: Student = {
      ...all[idx],
      ...patch,
      id: all[idx].id,
      status_graduation: ((patch.status_graduation ?? all[idx].status_graduation) ? 1 : 0) as 0 | 1,
      updated_at: nowIso(),
    };
    all[idx] = updated;
    writeJSON(K.students, all);
    audit.log({ actor: 'admin', action: 'student.update', target: updated.nisn });
    return updated;
  },

  remove(id: number): boolean {
    const all = readJSON<Student[]>(K.students, []);
    const next = all.filter((s) => s.id !== id);
    if (next.length === all.length) return false;
    writeJSON(K.students, next);
    audit.log({ actor: 'admin', action: 'student.remove', target: id });
    return true;
  },

  /**
   * Bulk upsert from an Excel import. Rows whose NISN already exists are
   * updated in-place; new NISNs are appended. Returns counts + a snapshot
   * suitable for stashing in the import archive.
   */
  bulkUpsert(rows: Array<Partial<Student> & { nisn?: string; name?: string }>): {
    imported: number;
    failed: number;
    errors: string[];
    snapshot: Student[];
  } {
    seedIfEmpty();
    const all = readJSON<Student[]>(K.students, []);
    const byNisn = new Map(all.map((s) => [s.nisn, s]));
    let nextId = (all.reduce((max, s) => Math.max(max, s.id), 0) || 0) + 1;
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    rows.forEach((row, i) => {
      const nisn = String(row.nisn ?? '').trim();
      const name = String(row.name ?? '').trim();
      if (!nisn || !name) {
        failed++;
        errors.push(`Baris ${i + 2}: NISN / Nama wajib diisi.`);
        return;
      }
      const status = Number(row.status_graduation ?? (row as any).status ?? 0) ? 1 : 0;
      const existing = byNisn.get(nisn);
      if (existing) {
        const merged: Student = {
          ...existing,
          name,
          birth_place: String(row.birth_place ?? existing.birth_place ?? '').trim(),
          birth_date:  normaliseDate(row.birth_date) ?? existing.birth_date,
          class:       String(row.class ?? existing.class ?? '').trim(),
          major:       String(row.major ?? existing.major ?? '').trim(),
          status_graduation: status as 0 | 1,
          updated_at: nowIso(),
        };
        byNisn.set(nisn, merged);
      } else {
        const created: Student = {
          id: nextId++,
          nisn,
          name,
          birth_place: String(row.birth_place ?? '').trim(),
          birth_date:  normaliseDate(row.birth_date) ?? '',
          class:       String(row.class ?? '').trim(),
          major:       String(row.major ?? '').trim(),
          status_graduation: status as 0 | 1,
          viewed_at: null,
          created_at: nowIso(),
          updated_at: nowIso(),
        };
        byNisn.set(nisn, created);
      }
      imported++;
    });

    const snapshot = Array.from(byNisn.values());
    writeJSON(K.students, snapshot);
    audit.log({ actor: 'admin', action: 'students.import', meta: { imported, failed } });

    return { imported, failed, errors, snapshot };
  },

  resetTracking(id?: number): void {
    const all = readJSON<Student[]>(K.students, []);
    const next = all.map((s) =>
      id == null || s.id === id ? { ...s, viewed_at: null, updated_at: nowIso() } : s,
    );
    writeJSON(K.students, next);
    audit.log({ actor: 'admin', action: 'students.reset_tracking', target: id ?? 'all' });
  },

  stats(): { total: number; lulus: number; tidakLulus: number; checked: number } {
    const all = studentStore.list();
    return {
      total: all.length,
      lulus: all.filter((s) => s.status_graduation === 1).length,
      tidakLulus: all.filter((s) => s.status_graduation === 0).length,
      checked: all.filter((s) => s.viewed_at).length,
    };
  },

  clear(): void {
    writeJSON(K.students, []);
    if (isBrowser) window.localStorage.removeItem(K.seeded);
    audit.log({ actor: 'admin', action: 'students.clear' });
  },
};

/* ------------------------------------------------------------------ *
 *  Import archives
 * ------------------------------------------------------------------ */

export const archiveStore = {
  list(): ImportArchive[] {
    return readJSON<ImportArchive[]>(K.archives, []);
  },
  add(entry: Omit<ImportArchive, 'id' | 'created_at'>): ImportArchive {
    const all = archiveStore.list();
    const next: ImportArchive = {
      ...entry,
      id: (all[0]?.id ?? 0) + 1,
      created_at: nowIso(),
    };
    // newest first, cap at 20 archives
    writeJSON(K.archives, [next, ...all].slice(0, 20));
    return next;
  },
  remove(id: number): void {
    writeJSON(K.archives, archiveStore.list().filter((a) => a.id !== id));
    audit.log({ actor: 'admin', action: 'archive.remove', target: id });
  },
  restore(id: number): boolean {
    const target = archiveStore.list().find((a) => a.id === id);
    if (!target) return false;
    writeJSON(K.students, target.snapshot);
    audit.log({ actor: 'admin', action: 'archive.restore', target: id });
    return true;
  },
  clearAll(): void {
    writeJSON(K.archives, []);
  },
};

/* ------------------------------------------------------------------ *
 *  Helpers
 * ------------------------------------------------------------------ */

/**
 * Try to coerce whatever the Excel cell sent us into a strict YYYY-MM-DD.
 * Accepts: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, JS Date, Excel serial number,
 * and the long Indonesian form ("26 Mei 2008").
 */
function normaliseDate(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    // Excel serial: days since 1899-12-30
    const ms = Math.round((value - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const slash = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (slash) {
    const [, d, m, y] = slash;
    const yy = y.length === 2 ? `20${y}` : y;
    return `${yy.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const months = [
    'januari','februari','maret','april','mei','juni',
    'juli','agustus','september','oktober','november','desember',
  ];
  const long = str.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (long) {
    const [, d, mName, y] = long;
    const m = months.indexOf(mName.toLowerCase()) + 1;
    if (m > 0) return `${y}-${String(m).padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

/* ------------------------------------------------------------------ *
 *  apiCall — the single entry point the UI uses
 * ------------------------------------------------------------------ */

/**
 * Resolve a URL against the **current window origin** so the SPA stays
 * domain-agnostic — the same build works on Replit, on any cPanel host, or
 * behind a custom domain without source edits. Absolute URLs (http://, https://,
 * //…) are returned unchanged so the helper never overrides explicit hosts.
 */
export function resolveApiUrl(path: string): string {
  if (/^(https?:)?\/\//i.test(path)) return path;
  if (!isBrowser) return path;
  const origin = window.location.origin.replace(/\/+$/, '');
  return origin + (path.startsWith('/') ? path : '/' + path);
}

/**
 * Fetch wrapper that **gracefully** falls back to the local store if the API
 * isn't reachable / returns a non-JSON response (e.g. the dev server's HTML
 * 404 page) / returns an HTTP error.
 *
 * `localFallback` is invoked only when the real API failed. The UI sees the
 * same JSON envelope `{ success, data?, message? }` regardless of which
 * branch executed, so it doesn't need any conditional logic.
 */
export async function apiCall<T = any>(
  url: string,
  init: RequestInit = {},
  localFallback?: () => { success: boolean; data?: T; message?: string },
): Promise<{ success: boolean; data?: T; message?: string; _fromLocal?: boolean }> {
  try {
    const resp = await fetch(resolveApiUrl(url), init);
    const ct = resp.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) throw new Error('non-json');
    const json = await resp.json();
    if (!resp.ok) throw Object.assign(new Error('api'), { json });
    return json;
  } catch {
    if (!localFallback) {
      return { success: false, message: 'API tidak tersedia.' };
    }
    const local = localFallback();
    return { ...local, _fromLocal: true };
  }
}

/** Quick utility — figure out how much localStorage we're using (KB). */
export function localStoreFootprint(): { keys: { key: string; size: number }[]; totalKB: number } {
  if (!isBrowser) return { keys: [], totalKB: 0 };
  const keys: { key: string; size: number }[] = [];
  let total = 0;
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i)!;
    if (!k.startsWith(NS)) continue;
    const v = window.localStorage.getItem(k) ?? '';
    const size = (k.length + v.length) * 2; // UTF-16
    keys.push({ key: k, size });
    total += size;
  }
  return { keys, totalKB: Math.round((total / 1024) * 10) / 10 };
}

/** Wipe every namespaced key — used by the "factory reset" button. */
export function clearAllLocal(): void {
  if (!isBrowser) return;
  const toDel: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i)!;
    if (k.startsWith(NS)) toDel.push(k);
  }
  toDel.forEach((k) => window.localStorage.removeItem(k));
}

/** Export all local state as a single JSON blob (download / share / backup). */
export function exportLocalSnapshot(): string {
  return JSON.stringify(
    {
      exported_at: nowIso(),
      students: studentStore.list(),
      settings: settingsStore.get(),
      archives: archiveStore.list(),
      audit: audit.list(),
    },
    null,
    2,
  );
}
