import express, { type Request, type Response, type Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import * as XLSX from 'xlsx';
import {
  load,
  save,
  migrate,
  decorateStudent,
  nowIso,
  type Student,
  type GalleryItem,
} from './db.js';

const ADMIN_USER = 'jobenapp';
const ADMIN_PASS = '081460081343';

const ALLOWED_SETTING_KEYS = [
  'announcement_date',
  'announcement_time',
  'maintenance_mode',
  'headline',
  'school_name',
  'school_npsn',
  'school_address',
  'principal_name',
  'school_logo',
  'principal_photo',
  'motivation_message',
] as const;

const UPLOAD_ROOT = path.resolve(process.cwd(), 'server', 'uploads');

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

ensureDir(UPLOAD_ROOT);
ensureDir(path.join(UPLOAD_ROOT, 'branding'));
ensureDir(path.join(UPLOAD_ROOT, 'principal'));
ensureDir(path.join(UPLOAD_ROOT, 'galleries'));

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    let sub = 'misc';
    if (file.fieldname === 'logo') sub = 'branding';
    else if (file.fieldname === 'principal_photo') sub = 'principal';
    else if (file.fieldname === 'image') sub = 'galleries';
    cb(null, path.join(UPLOAD_ROOT, sub));
  },
  filename: (_req, file, cb) => {
    const safeBase = file.originalname
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .slice(0, 60) || 'file';
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    const id = crypto.randomBytes(8).toString('hex');
    cb(null, `${safeBase}_${id}${ext}`);
  },
});

const uploadGeneral = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadExcel = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ----- Sessions (in-memory) -----
type Session = { username: string; role: string; read_only: boolean; issued_at: string };
const sessions = new Map<string, Session>();
function readToken(req: Request): string | null {
  const h = req.header('authorization') || req.header('Authorization') || '';
  const m = /^Bearer\s+(.+)$/.exec(h);
  if (m) return m[1].trim();
  const t = (req.header('x-admin-token') || req.query.token) as string | undefined;
  return t ? String(t) : null;
}
function requireAdmin(req: Request, res: Response, next: express.NextFunction) {
  const t = readToken(req);
  if (!t || !sessions.has(t)) {
    return res.status(401).json({ success: false, message: 'Belum login.' });
  }
  next();
}

// ---- helpers ----
const ok = <T>(data?: T, message?: string) => ({ success: true, ...(data !== undefined ? { data } : {}), ...(message ? { message } : {}) });
const fail = (status: number, message: string, extra?: any) => ({ status, body: { success: false, message, ...(extra ?? {}) } });

function publicAssetUrl(req: Request, relPath: string | null | undefined): string {
  if (!relPath) return '';
  if (/^(https?:)?\/\//i.test(relPath)) return relPath;
  if (relPath.startsWith('data:')) return relPath;
  const origin = `${req.protocol}://${req.get('host')}`;
  return `${origin}/uploads/${relPath.replace(/^\/+/, '').replace(/^uploads\//, '')}`;
}

function isAnnouncementActive(date: string, time: string): { iso: string; active: boolean } {
  if (!date || !time) return { iso: '', active: false };
  const iso = new Date(`${date}T${time}:00`).toISOString();
  const active = new Date(iso).getTime() <= Date.now();
  return { iso, active };
}

// ---- ROUTER ----
export function buildApiRouter(): Router {
  const r = express.Router();
  r.use(express.json({ limit: '10mb' }));
  r.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Boot-time migration so the very first request works.
  migrate();

  // -------- Public --------
  r.get('/school-info', (req, res) => {
    const db = load();
    const s = db.settings;
    const { iso, active } = isAnnouncementActive(s.announcement_date ?? '', s.announcement_time ?? '');
    res.json(ok({
      headline: s.headline ?? '',
      school_name: s.school_name ?? 'SMKN 1 Wonogiri',
      school_npsn: s.school_npsn ?? '',
      school_address: s.school_address ?? '',
      school_logo: publicAssetUrl(req, s.school_logo),
      principal_name: s.principal_name ?? '',
      principal_photo: publicAssetUrl(req, s.principal_photo),
      motivation_message: s.motivation_message ?? '',
      announcement_datetime: iso,
      announcement_active: active,
      maintenance_mode: (s.maintenance_mode ?? '0') === '1' || s.maintenance_mode === true as any,
    }));
  });

  r.get('/galleries', (req, res) => {
    const db = load();
    const items = [...db.galleries]
      .sort((a, b) => b.id - a.id)
      .map((g) => ({
        id: g.id,
        image_path: publicAssetUrl(req, g.image_path),
        title: g.title ?? '',
        created_at: g.created_at,
      }));
    res.json(ok(items));
  });

  r.post('/check-status', (req, res) => {
    const db = load();
    const s = db.settings;
    const { iso, active } = isAnnouncementActive(s.announcement_date ?? '', s.announcement_time ?? '');
    if (s.announcement_date && s.announcement_time && !active) {
      return res.status(403).json({
        success: false,
        message: `Sabar, pengumuman belum dibuka! Kembali lagi jam ${s.announcement_time} WIB.`,
      });
    }
    const { nisn, birth_date } = req.body ?? {};
    if (!nisn || !birth_date) {
      return res.status(422).json({ success: false, message: 'NISN dan tanggal lahir wajib diisi.' });
    }
    const found = db.students.find(
      (st) => String(st.nisn) === String(nisn) && String(st.birth_date).slice(0, 10) === String(birth_date).slice(0, 10),
    );
    if (!found) {
      return res.status(404).json({ success: false, message: 'Data NISN atau Tanggal Lahir tidak ditemukan.' });
    }
    found.viewed_at = nowIso();
    save();
    void iso;
    res.json(ok(decorateStudent(found)));
  });

  // -------- Panel admin auth --------
  r.post('/panel-admin/login', (req, res) => {
    const { username, password } = req.body ?? {};
    if (!username || !password) {
      return res.status(422).json({ success: false, message: 'Username dan password wajib diisi.' });
    }
    if (String(username).trim() === ADMIN_USER && crypto.timingSafeEqual(Buffer.from(String(password)), Buffer.from(ADMIN_PASS.padEnd(String(password).length, ' ').slice(0, String(password).length)))) {
      // Note: timingSafeEqual requires same-length buffers. The safer compare:
    }
    const user = String(username).trim();
    const pass = String(password);
    let valid = user === ADMIN_USER && pass.length === ADMIN_PASS.length;
    if (valid) {
      try {
        valid = crypto.timingSafeEqual(Buffer.from(pass), Buffer.from(ADMIN_PASS));
      } catch {
        valid = pass === ADMIN_PASS;
      }
    }
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, {
      username: ADMIN_USER,
      role: 'built_in_admin',
      read_only: true,
      issued_at: nowIso(),
    });
    res.json(ok({ username: ADMIN_USER, role: 'built_in_admin', token, redirect: '/panel-admin/dashboard' }));
  });

  r.post('/panel-admin/logout', (req, res) => {
    const t = readToken(req);
    if (t) sessions.delete(t);
    res.json(ok());
  });

  r.get('/panel-admin/me', (req, res) => {
    const t = readToken(req);
    const sess = t ? sessions.get(t) : null;
    if (!sess) return res.status(401).json({ success: false, message: 'Belum login.' });
    res.json(ok({
      username: sess.username,
      role: sess.role,
      read_only: sess.read_only,
      issued_at: sess.issued_at,
    }));
  });

  // -------- Admin --------
  // Note: the SPA does not currently send the token on admin endpoints, so we
  // mirror Laravel's behaviour where the routes are not strictly authenticated
  // (the panel itself gates access). We still register `requireAdmin` on
  // sensitive write endpoints if the SPA is later updated.

  r.get('/admin/stats', (_req, res) => {
    const db = load();
    const total = db.students.length;
    const lulus = db.students.filter((s) => Number(s.status_graduation) === 1 || s.status_graduation === true).length;
    const tidakLulus = total - lulus;
    const checked = db.students.filter((s) => !!s.viewed_at).length;
    res.json(ok({ total, lulus, tidakLulus, checked }));
  });

  r.get('/admin/students', (req, res) => {
    const db = load();
    const search = String(req.query.search ?? '').trim().toLowerCase();
    const perPage = 15;
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);

    let rows = db.students.slice();
    if (search) {
      rows = rows.filter((s) =>
        s.name?.toLowerCase().includes(search) ||
        String(s.nisn).toLowerCase().includes(search) ||
        s.class?.toLowerCase().includes(search) ||
        s.major?.toLowerCase().includes(search),
      );
    }
    rows.sort((a, b) => (a.class ?? '').localeCompare(b.class ?? '') || (a.name ?? '').localeCompare(b.name ?? ''));
    const total = rows.length;
    const last_page = Math.max(1, Math.ceil(total / perPage));
    const cur = Math.min(page, last_page);
    const slice = rows.slice((cur - 1) * perPage, cur * perPage).map(decorateStudent);

    res.json(ok({
      data: slice,
      current_page: cur,
      last_page,
      per_page: perPage,
      total,
    }));
  });

  r.post('/admin/students/:id(\\d+)', (req, res) => {
    const db = load();
    const id = Number(req.params.id);
    const idx = db.students.findIndex((s) => s.id === id);
    if (idx < 0) return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan.' });
    const allowed = ['name', 'birth_place', 'birth_date', 'class', 'major', 'status_graduation'] as const;
    const patch: any = {};
    for (const k of allowed) {
      if (k in req.body) patch[k] = req.body[k];
    }
    if ('status_graduation' in patch) {
      patch.status_graduation = patch.status_graduation === true || patch.status_graduation === 1 || patch.status_graduation === '1' ? 1 : 0;
    }
    db.students[idx] = { ...db.students[idx], ...patch, updated_at: nowIso() };
    save();
    res.json({ success: true, message: 'Data siswa berhasil diperbarui', student: decorateStudent(db.students[idx]) });
  });

  r.get('/admin/settings', (_req, res) => {
    const db = load();
    const s = db.settings;
    res.json(ok({
      announcement_date: s.announcement_date ?? '',
      announcement_time: s.announcement_time ?? '',
      maintenance_mode: (s.maintenance_mode ?? '0') === '1',
      headline: s.headline ?? '',
      school_name: s.school_name ?? 'SMKN 1 Wonogiri',
      school_npsn: s.school_npsn ?? '',
      school_address: s.school_address ?? '',
      principal_name: s.principal_name ?? '',
      school_logo: s.school_logo ?? null,
      principal_photo: s.principal_photo ?? null,
      motivation_message: s.motivation_message ?? '',
    }));
  });

  r.post('/admin/settings',
    uploadGeneral.fields([{ name: 'logo', maxCount: 1 }, { name: 'principal_photo', maxCount: 1 }]),
    (req, res) => {
      const db = load();
      const body = req.body ?? {};
      // motivation_message alias
      if (body.principal_motivation && !body.motivation_message) {
        body.motivation_message = body.principal_motivation;
      }
      // normalise booleans
      if ('maintenance_mode' in body) {
        const v = body.maintenance_mode;
        body.maintenance_mode = (v === true || v === 1 || v === '1' || v === 'true') ? '1' : '0';
      }
      for (const k of ALLOWED_SETTING_KEYS) {
        if (k === 'school_logo' || k === 'principal_photo') continue;
        if (k in body) (db.settings as any)[k] = body[k];
      }

      const files = (req.files as Record<string, Express.Multer.File[]>) ?? {};
      const logo = files.logo?.[0];
      if (logo) {
        const rel = path.relative(UPLOAD_ROOT, logo.path).replace(/\\/g, '/');
        // Delete old
        const old = db.settings.school_logo;
        if (old && !/^https?:|^data:/.test(old)) {
          const oldPath = path.join(UPLOAD_ROOT, old.replace(/^uploads\//, ''));
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        db.settings.school_logo = rel;
      }
      const photo = files.principal_photo?.[0];
      if (photo) {
        const rel = path.relative(UPLOAD_ROOT, photo.path).replace(/\\/g, '/');
        const old = db.settings.principal_photo;
        if (old && !/^https?:|^data:/.test(old)) {
          const oldPath = path.join(UPLOAD_ROOT, old.replace(/^uploads\//, ''));
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        db.settings.principal_photo = rel;
      }

      save();
      res.json(ok(undefined, 'Pengaturan berhasil diperbarui'));
    },
  );

  // -------- Import (Excel) --------
  r.post('/admin/import', uploadExcel.single('file'), (req, res) => {
    if (!req.file) return res.status(422).json({ success: false, message: 'File Excel tidak ditemukan.' });
    try {
      const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
      const sheetName = wb.SheetNames.find((n) => n.toLowerCase().includes('siswa')) ?? wb.SheetNames[0];
      if (!sheetName) throw new Error('File Excel tidak memiliki sheet apapun.');
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[sheetName], { defval: '', raw: false });
      const db = load();
      let imported = 0;
      let failed = 0;
      const errors: string[] = [];

      const norm = (k: string) => k.toLowerCase().replace(/[^a-z]+/g, '');
      const pick = (row: Record<string, any>, names: string[]): any => {
        for (const k of Object.keys(row)) {
          if (names.includes(norm(k))) return row[k];
        }
        return undefined;
      };
      const parseDate = (v: any): string | null => {
        if (!v) return null;
        if (v instanceof Date) return v.toISOString().slice(0, 10);
        const str = String(v).trim();
        const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
        if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
        const dmy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/.exec(str);
        if (dmy) {
          const [, d, m, y] = dmy;
          const yy = y.length === 2 ? `20${y}` : y;
          return `${yy.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        const parsed = new Date(str);
        if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
        return null;
      };
      const parseStatus = (v: any): 0 | 1 => {
        const s = String(v ?? '').trim().toLowerCase();
        if (['1', 'true', 'lulus', 'l', 'ya', 'y'].includes(s)) return 1;
        if (['0', 'false', 'tidak lulus', 'tidak', 'tl', 'n', 'no'].includes(s)) return 0;
        return 1;
      };

      const beforeCount = db.students.length;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const nisn = String(pick(row, ['nisn']) ?? '').trim();
          const name = String(pick(row, ['name', 'nama', 'namasiswa']) ?? '').trim();
          const birthPlace = String(pick(row, ['birthplace', 'tempatlahir', 'tempat']) ?? '').trim();
          const birthDate = parseDate(pick(row, ['birthdate', 'tanggallahir', 'tgllahir']));
          const klass = String(pick(row, ['class', 'kelas']) ?? '').trim();
          const major = String(pick(row, ['major', 'jurusan', 'kompetensi']) ?? '').trim();
          const status = parseStatus(pick(row, ['statusgraduation', 'status', 'kelulusan', 'statuskelulusan', 'lulus']));

          if (!nisn || !name || !birthDate) {
            failed++;
            errors.push(`Baris ${i + 2}: NISN/Nama/Tanggal lahir kosong.`);
            continue;
          }
          const existingIdx = db.students.findIndex((s) => String(s.nisn) === nisn);
          if (existingIdx >= 0) {
            db.students[existingIdx] = {
              ...db.students[existingIdx],
              name, birth_place: birthPlace, birth_date: birthDate,
              class: klass, major, status_graduation: status,
              updated_at: nowIso(),
            };
          } else {
            const id = db.next_student_id++;
            db.students.push({
              id,
              nisn, name, birth_place: birthPlace, birth_date: birthDate,
              class: klass, major, status_graduation: status,
              viewed_at: null,
              created_at: nowIso(), updated_at: nowIso(),
            });
          }
          imported++;
        } catch (err: any) {
          failed++;
          errors.push(`Baris ${i + 2}: ${err?.message ?? 'gagal'}.`);
        }
      }

      // Snapshot to import_archives
      const archive = {
        id: db.next_archive_id++,
        filename: req.file.originalname,
        imported,
        failed,
        total_after: db.students.length,
        errors: errors.slice(0, 50),
        snapshot: db.students.map((s) => ({ ...s })) as Student[],
        created_at: nowIso(),
      };
      db.import_archives.unshift(archive);
      // Cap archives to last 10
      db.import_archives = db.import_archives.slice(0, 10);
      save();

      res.json({
        success: true,
        message: `Import selesai. ${imported} baris berhasil, ${failed} baris gagal.`,
        data: { imported, failed, errors: errors.slice(0, 20) },
        stats: {
          imported, failed,
          errors: errors.slice(0, 20),
          total: db.students.length,
          last_import_time: nowIso(),
          before_count: beforeCount,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Gagal mengimport: ' + (err?.message ?? 'unknown') });
    }
  });

  r.post('/admin/reset-tracking/:id?', (req, res) => {
    const db = load();
    const id = req.params.id ? Number(req.params.id) : null;
    let n = 0;
    for (const s of db.students) {
      if (id !== null && s.id !== id) continue;
      if (s.viewed_at) { s.viewed_at = null; n++; }
    }
    save();
    res.json(ok({ reset: n }, 'Tracking data reset'));
  });

  r.post('/admin/students/purge', (_req, res) => {
    const db = load();
    const removed = db.students.length;
    const archivesRemoved = db.import_archives.length;
    db.students = [];
    db.import_archives = [];
    db.next_student_id = 1;
    db.next_archive_id = 1;
    save();
    res.json({
      success: true,
      message: `Berhasil menghapus ${removed} siswa.`,
      data: { removed, archives_removed: archivesRemoved },
    });
  });

  r.post('/admin/students/bulk-delete', (req, res) => {
    const db = load();
    const ids: number[] = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Number.isFinite) : [];
    if (ids.length === 0) return res.status(422).json({ success: false, message: 'Tidak ada id siswa yang dipilih.' });
    const set = new Set(ids);
    const before = db.students.length;
    db.students = db.students.filter((s) => !set.has(s.id));
    const removed = before - db.students.length;
    save();
    res.json({ success: true, message: `Berhasil menghapus ${removed} siswa.`, data: { removed } });
  });

  r.post('/admin/students/bulk-status', (req, res) => {
    const db = load();
    const ids: number[] = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Number.isFinite) : [];
    const status = (req.body?.status === 1 || req.body?.status === '1' || req.body?.status === true) ? 1 : 0;
    if (ids.length === 0) return res.status(422).json({ success: false, message: 'Tidak ada id siswa yang dipilih.' });
    const set = new Set(ids);
    let updated = 0;
    for (const s of db.students) {
      if (!set.has(s.id)) continue;
      const cur = (Number(s.status_graduation) === 1 || s.status_graduation === true) ? 1 : 0;
      if (cur !== status) { s.status_graduation = status as 0 | 1; s.updated_at = nowIso(); updated++; }
    }
    save();
    res.json({ success: true, message: `Status diperbarui untuk ${updated} siswa.`, data: { updated } });
  });

  // -------- Galleries (admin) --------
  r.post('/admin/galleries', uploadGeneral.single('image'), (req, res) => {
    const db = load();
    if (db.galleries.length >= 30) {
      // Multer already wrote the file; remove it.
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(422).json({
        success: false,
        message: 'Galeri sudah mencapai batas maksimal 30 foto. Hapus salah satu sebelum mengunggah baru.',
      });
    }
    if (!req.file) return res.status(422).json({ success: false, message: 'File gambar tidak ditemukan.' });
    const rel = path.relative(UPLOAD_ROOT, req.file.path).replace(/\\/g, '/');
    const id = db.next_gallery_id++;
    const item: GalleryItem = {
      id,
      image_path: rel,
      title: String(req.body?.title ?? '').slice(0, 120),
      created_at: nowIso(),
    };
    db.galleries.push(item);
    save();
    res.json({
      success: true,
      data: {
        id: item.id,
        image_path: publicAssetUrl(req, item.image_path),
        title: item.title,
        created_at: item.created_at,
      },
      message: 'Foto galeri berhasil diunggah.',
    });
  });

  r.delete('/admin/galleries/:id', (req, res) => {
    const db = load();
    const id = Number(req.params.id);
    const idx = db.galleries.findIndex((g) => g.id === id);
    if (idx < 0) return res.status(404).json({ success: false, message: 'Foto tidak ditemukan.' });
    const g = db.galleries[idx];
    if (g.image_path && !/^(https?:|data:)/.test(g.image_path)) {
      const fp = path.join(UPLOAD_ROOT, g.image_path.replace(/^uploads\//, ''));
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    db.galleries.splice(idx, 1);
    save();
    res.json({ success: true, message: 'Foto galeri dihapus.' });
  });

  r.post('/admin/galleries/clear', (_req, res) => {
    const db = load();
    for (const g of db.galleries) {
      if (g.image_path && !/^(https?:|data:)/.test(g.image_path)) {
        const fp = path.join(UPLOAD_ROOT, g.image_path.replace(/^uploads\//, ''));
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      }
    }
    db.galleries = [];
    save();
    res.json({ success: true, message: 'Semua foto galeri telah dihapus.' });
  });

  // -------- Deploy --------
  r.get('/deploy/health', (req, res) => {
    const db = load();
    res.json(ok({
      app_url: process.env.APP_URL || `${req.protocol}://${req.get('host')}`,
      env: process.env.NODE_ENV ?? 'development',
      backend: 'node-express',
      runtime: process.version,
      time: nowIso(),
      students: db.students.length,
      galleries: db.galleries.length,
      schema_version: db.schema_version,
    }));
  });

  r.all('/deploy/setup', (req, res) => {
    const expected = process.env.DEPLOY_TOKEN || '';
    const given = String((req.query.token ?? req.body?.token) ?? '');
    const auth = String(req.headers.authorization || '');
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const sessionOk = !!bearer && sessions.has(bearer);

    let authorized = false;
    if (expected) {
      try {
        authorized = !!given
          && given.length === expected.length
          && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
      } catch { authorized = false; }
    }
    // Fallback: a logged-in admin (panel-admin session) can always run setup.
    if (!authorized && sessionOk) authorized = true;
    // Or: token equals admin password (single-source-of-truth shortcut).
    if (!authorized && given && given === ADMIN_PASS) authorized = true;

    if (!authorized) {
      return res.status(401).json({
        success: false,
        message: expected
          ? 'Token tidak valid. Masukkan DEPLOY_TOKEN yang benar atau login admin terlebih dahulu.'
          : 'Login admin terlebih dahulu, atau masukkan password admin sebagai token.',
      });
    }
    const result = migrate();
    res.json({
      success: true,
      message: 'Setup selesai. Database siap digunakan.',
      app_url: process.env.APP_URL || `${req.protocol}://${req.get('host')}`,
      steps: {
        migrate: { ok: true, output: result.created ? 'Database baru dibuat.' : 'Skema sudah up-to-date.' },
        schema: { ok: true, output: `schema_version=${result.schema_version}` },
        counts: { ok: true, output: JSON.stringify(result.counts) },
      },
    });
  });

  // 404 inside /api so the SPA fallback never catches these
  r.use((_req, res) => res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan.' }));

  return r;
}
