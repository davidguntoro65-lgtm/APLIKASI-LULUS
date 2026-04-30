import fs from 'fs';
import path from 'path';

export type Student = {
  id: number;
  nisn: string;
  name: string;
  birth_place: string;
  birth_date: string;
  class: string;
  major: string;
  status_graduation: 0 | 1 | boolean;
  viewed_at: string | null;
  formatted_birth_date?: string;
  inline_birth?: string;
  created_at?: string;
  updated_at?: string;
};

export type GalleryItem = {
  id: number;
  image_path: string;
  title: string;
  created_at: string;
};

export type ImportArchive = {
  id: number;
  filename: string;
  imported: number;
  failed: number;
  total_after: number;
  errors: string[];
  snapshot: Student[];
  created_at: string;
};

export type Settings = {
  announcement_date: string;
  announcement_time: string;
  maintenance_mode: string;
  headline: string;
  school_name: string;
  school_npsn: string;
  school_address: string;
  principal_name: string;
  school_logo: string;
  principal_photo: string;
  motivation_message: string;
};

export type DB = {
  students: Student[];
  next_student_id: number;
  galleries: GalleryItem[];
  next_gallery_id: number;
  import_archives: ImportArchive[];
  next_archive_id: number;
  settings: Partial<Settings>;
  schema_version: number;
};

const DATA_FILE = path.resolve(process.cwd(), 'server', 'data.json');
const SCHEMA_VERSION = 1;

const DEFAULT_SETTINGS: Partial<Settings> = {
  school_name: 'SMKN 1 Wonogiri',
};

function emptyDB(): DB {
  return {
    students: [],
    next_student_id: 1,
    galleries: [],
    next_gallery_id: 1,
    import_archives: [],
    next_archive_id: 1,
    settings: { ...DEFAULT_SETTINGS },
    schema_version: SCHEMA_VERSION,
  };
}

let cache: DB | null = null;

export function load(): DB {
  if (cache) return cache;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as DB;
      // Auto-migrate: ensure all keys exist
      cache = {
        ...emptyDB(),
        ...parsed,
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
        schema_version: SCHEMA_VERSION,
      };
      return cache;
    }
  } catch (err) {
    console.error('[db] failed to load data.json, starting fresh:', err);
  }
  cache = emptyDB();
  save();
  return cache;
}

export function save(): void {
  if (!cache) return;
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(cache, null, 2));
}

export function migrate(): { created: boolean; schema_version: number; counts: Record<string, number> } {
  const fresh = !fs.existsSync(DATA_FILE);
  const db = load();
  save();
  return {
    created: fresh,
    schema_version: db.schema_version,
    counts: {
      students: db.students.length,
      galleries: db.galleries.length,
      import_archives: db.import_archives.length,
    },
  };
}

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function formatBirthDateID(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso ?? '';
  const [, y, mo, d] = m;
  const month = MONTHS_ID[parseInt(mo, 10) - 1] ?? mo;
  return `${parseInt(d, 10)} ${month} ${y}`;
}

export function decorateStudent(s: Student): Student {
  const formatted = formatBirthDateID(s.birth_date);
  return {
    ...s,
    status_graduation: typeof s.status_graduation === 'boolean'
      ? (s.status_graduation ? 1 : 0)
      : (Number(s.status_graduation) === 1 ? 1 : 0),
    formatted_birth_date: formatted,
    inline_birth: s.birth_place ? `${s.birth_place}, ${formatted}` : formatted,
  };
}

export function nowIso(): string {
  return new Date().toISOString();
}
