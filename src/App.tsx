/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, GraduationCap, CheckCircle, XCircle, FileText, User, Calendar, BookOpen, Building2, LayoutDashboard, Database, Settings, LogOut, ArrowRight, TrendingUp, Download, Lock, ShieldCheck, Activity, Sparkles, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import * as XLSX from 'xlsx';

// Mock Data + Admin Stats
const MOCK_STATS = {
  total: 450,
  lulus: 442,
  tidakLulus: 8,
  checked: 312
};

const CHART_DATA = [
  { name: 'Lulus', value: MOCK_STATS.lulus, color: '#10b981' },
  { name: 'Belum Lulus', value: MOCK_STATS.tidakLulus, color: '#ef4444' },
];

const ID_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** Format an ISO date (YYYY-MM-DD) as "26 Mei 2008". */
const formatBirthDate = (iso?: string | null): string => {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${ID_MONTHS[m - 1] ?? m} ${y}`;
};

/** "Wonogiri, 26 Mei 2008" */
const formatInlineBirth = (place?: string | null, iso?: string | null): string => {
  const p = (place ?? '').trim();
  const dateStr = iso ? formatBirthDate(iso) : '';
  if (!p && !dateStr) return '-';
  if (!p) return dateStr;
  if (!dateStr) return p;
  return `${p}, ${dateStr}`;
};

/**
 * Generate the official student-import .xlsx template and trigger a download.
 *
 * Schema follows the StudentImport rules in laravel/app/Imports/StudentImport.php.
 * The 2 sample rows demonstrate the supported date formats:
 *   - YYYY-MM-DD          ("2008-05-26")
 *   - DD/MM/YYYY          ("20/08/2008")
 * The Carbon-based importer also accepts Excel serial numbers automatically
 * if the cell is formatted as a real date in Excel.
 */
const TEMPLATE_HEADERS = [
  'nisn',
  'name',
  'birth_place',
  'birth_date',
  'class',
  'major',
  'status',
] as const;

const TEMPLATE_SAMPLE_ROWS = [
  {
    nisn: '1234567890',
    name: 'Ahmad Saeful',
    birth_place: 'Wonogiri',
    birth_date: '2008-05-26',
    class: 'XII RPL 1',
    major: 'Rekayasa Perangkat Lunak',
    status: 1,
  },
  {
    nisn: '0987654321',
    name: 'Siti Rahmawati',
    birth_place: 'Sukoharjo',
    birth_date: '20/08/2008',
    class: 'XII TKJ 2',
    major: 'Teknik Komputer & Jaringan',
    status: 0,
  },
];

const downloadStudentTemplate = (): void => {
  const wb = XLSX.utils.book_new();

  // --- Sheet 1: Data Siswa (the actual import sheet) ---
  const ws = XLSX.utils.json_to_sheet(TEMPLATE_SAMPLE_ROWS, {
    header: TEMPLATE_HEADERS as unknown as string[],
  });

  // Friendly column widths
  ws['!cols'] = [
    { wch: 14 }, // nisn
    { wch: 28 }, // name
    { wch: 18 }, // birth_place
    { wch: 14 }, // birth_date
    { wch: 14 }, // class
    { wch: 32 }, // major
    { wch: 8 },  // status
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');

  // --- Sheet 2: Petunjuk (human-readable instructions) ---
  const instructions = [
    ['PETUNJUK PENGISIAN — Template Import Siswa SMKN 1 Wonogiri 2026'],
    [],
    ['Kolom Wajib', 'Keterangan'],
    ['nisn', 'Nomor Induk Siswa Nasional (10 digit, unik).'],
    ['name', 'Nama lengkap siswa (huruf kapital direkomendasikan).'],
    ['birth_place', 'Kota / Kabupaten kelahiran (contoh: Wonogiri).'],
    [
      'birth_date',
      'Format yang didukung: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, "26 Mei 2008", atau format tanggal Excel.',
    ],
    ['class', 'Kelas siswa (contoh: XII RPL 1).'],
    ['major', 'Konsentrasi Keahlian (contoh: Rekayasa Perangkat Lunak).'],
    ['status', '1 = LULUS, 0 = BELUM LULUS.'],
    [],
    ['Catatan:'],
    ['• Baris 1 (header) wajib persis seperti pada sheet "Data Siswa".'],
    ['• Data siswa baru dimulai dari baris 2.'],
    ['• Hapus baris contoh sebelum mengunggah file.'],
    ['• Disusun oleh TIM IT SKANSAGIRI — Powered by Joben Enterprise.'],
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(instructions);
  wsInfo['!cols'] = [{ wch: 18 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Petunjuk');

  XLSX.writeFile(wb, 'template_import_siswa_skansagiri_2026.xlsx', {
    bookType: 'xlsx',
  });
};

const MOCK_STUDENTS = [
  {
    id: 1,
    nisn: "1234567890",
    name: "Ahmad Saeful",
    birth_place: "Wonogiri",
    birth_date: "2008-05-26",
    class: "XII RPL 1",
    major: "Rekayasa Perangkat Lunak",
    status_graduation: true,
    grades: [
      { subject: "Bahasa Indonesia", score: 88 },
      { subject: "Matematika", score: 85 },
      { subject: "Bahasa Inggris", score: 90 },
      { subject: "Komptensi Keahlian", score: 92 },
      { subject: "PABP", score: 87 },
    ]
  },
  {
    id: 2,
    nisn: "0987654321",
    name: "Siti Rahmawati",
    birth_place: "Sukoharjo",
    birth_date: "2008-08-20",
    class: "XII TKJ 2",
    major: "Teknik Komputer & Jaringan",
    status_graduation: false,
    grades: [
      { subject: "Bahasa Indonesia", score: 70 },
      { subject: "Matematika", score: 45 },
      { subject: "Bahasa Inggris", score: 65 },
      { subject: "Komptensi Keahlian", score: 50 },
      { subject: "PABP", score: 75 },
    ]
  }
];

export default function App() {
  const [view, setView] = useState<'public' | 'admin'>('public');
  const [adminTab, setAdminTab] = useState<'overview' | 'students' | 'import' | 'settings'>('overview');

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [result, setResult] = useState<typeof MOCK_STUDENTS[0] | null>(null);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Admin Configuration State
  const [announcementDate, setAnnouncementDate] = useState("2026-05-15");
  const [announcementTime, setAnnouncementTime] = useState("16:00");
  const [schoolName, setSchoolName] = useState("SMKN 1 Wonogiri");
  const [schoolNpsn, setSchoolNpsn] = useState("");
  const [schoolAddress, setSchoolAddress] = useState("");
  const [principalName, setPrincipalName] = useState("");
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Principal photo + motivational message (Manajemen Konten)
  const [principalPhoto, setPrincipalPhoto] = useState<string | null>(null);
  const [principalPhotoFile, setPrincipalPhotoFile] = useState<File | null>(null);
  const [principalPhotoPreview, setPrincipalPhotoPreview] = useState<string | null>(null);
  const [motivationMessage, setMotivationMessage] = useState<string>(
    "Selamat kepada seluruh siswa-siswi SMKN 1 Wonogiri. Teruslah berkarya, berinovasi, dan menjadi generasi unggul yang membanggakan."
  );

  // Public Identity State
  const [schoolInfo, setSchoolInfo] = useState<any>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isReady, setIsReady] = useState(false);

  // Fetch Public Info
  const fetchPublicInfo = async () => {
    try {
      const resp = await fetch('/api/school-info');
      const json = await resp.json();
      if (json.success) {
        setSchoolInfo(json.data);
        setMaintenanceMode(json.data.maintenance_mode);
        setIsReady(json.data.announcement_active);
      }
    } catch (e) {
      console.error("Failed to fetch school info", e);
    }
  };

  // Countdown Interval Logic
  useEffect(() => {
    if (!schoolInfo?.announcement_datetime) return;

    const targetDate = new Date(schoolInfo.announcement_datetime).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setIsReady(true);
        clearInterval(interval);
        return;
      }

      setCountdown({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
      setIsReady(false);
    }, 1000);

    return () => clearInterval(interval);
  }, [schoolInfo]);

  useEffect(() => {
    fetchPublicInfo();
  }, []);

  useEffect(() => {
    if (result && result.status_graduation) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
      
      return () => clearInterval(interval);
    }
  }, [result]);

  // Admin Data State
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [statsData, setStatsData] = useState(MOCK_STATS);
  const [isLoading, setIsLoading] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  const [editStudent, setEditStudent] = useState<any | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Fetch Dashboard Stats
  const fetchStats = async () => {
    try {
      const resp = await fetch('/api/admin/stats');
      const json = await resp.json();
      if (json.success) setStatsData(json.data);
    } catch (e) {
      console.error("Failed to fetch stats", e);
    }
  };

  // Fetch Students List
  const fetchStudents = async (query = "") => {
    setIsLoading(true);
    try {
      const resp = await fetch(`/api/admin/students?search=${query}`);
      const json = await resp.json();
      if (json.success) setStudentsData(json.data.data);
    } catch (e) {
      console.error("Failed to fetch students", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial Load for Admin
  const fetchSettings = async () => {
    try {
      const resp = await fetch('/api/admin/settings');
      const json = await resp.json();
      if (json.success) {
        setAnnouncementDate(json.data.announcement_date);
        setAnnouncementTime(json.data.announcement_time);
        setMaintenanceMode(json.data.maintenance_mode);
        setSchoolName(json.data.school_name);
        setSchoolNpsn(json.data.school_npsn);
        setSchoolAddress(json.data.school_address);
        setPrincipalName(json.data.principal_name);
        setSchoolLogo(json.data.school_logo);
      }
    } catch (e) {
      console.error("Failed to fetch settings", e);
    }
  };

  useEffect(() => {
    if (view === 'admin') {
      fetchStats();
      fetchStudents(adminSearch);
      fetchSettings();
    }
  }, [view, adminSearch]);

  // Handle Individual Update
  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    
    try {
      const resp = await fetch(`/api/admin/students/${editStudent.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editStudent)
      });
      const json = await resp.json();
      if (json.success) {
        setEditStudent(null);
        fetchStudents(adminSearch);
        fetchStats();
      }
    } catch (e) {
      console.error("Failed to update student", e);
    }
  };

  // Handle Excel Import
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsLoading(true);
    try {
      const resp = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData
      });
      const json = await resp.json();
      alert(json.message);
      if (json.success) {
        fetchStats();
        setAdminTab('overview');
      }
    } catch (e) {
      alert("Gagal mengimport file.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Settings Save
  const handleSaveSettings = async () => {
     setIsLoading(true);
     try {
       const formData = new FormData();
       formData.append('announcement_date', announcementDate);
       formData.append('announcement_time', announcementTime);
       formData.append('maintenance_mode', maintenanceMode ? '1' : '0');
       formData.append('school_name', schoolName);
       formData.append('school_npsn', schoolNpsn);
       formData.append('school_address', schoolAddress);
       formData.append('principal_name', principalName);
       
       if (logoFile) {
         formData.append('logo', logoFile);
       }
       if (principalPhotoFile) {
         formData.append('principal_photo', principalPhotoFile);
       }
       formData.append('motivation_message', motivationMessage);

       const resp = await fetch('/api/admin/settings', {
         method: 'POST',
         body: formData
       });
       const json = await resp.json();
       alert(json.message || "Pengaturan disimpan!");
       fetchPublicInfo();
       if (view === 'admin') fetchSettings();
     } catch (e) {
       alert("Gagal menyimpan pengaturan.");
     } finally {
       setIsLoading(false);
     }
  };

  const handleSearchClick = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setError("");
    setResult(null);

    // If Maintenance Mode is Active
    if (maintenanceMode) {
      setTimeout(() => {
        setError("Sistem sedang dalam perawatan (Maintenance Mode). Silakan coba lagi nanti.");
        setIsSearching(false);
      }, 500);
      return;
    }

    // Real API Call
    fetch('/api/check-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nisn: searchQuery, birth_date: birthDate })
    })
    .then(r => r.json())
    .then(json => {
      if (json.success) {
        setResult(json.data);
      } else {
        setError(json.message || "Data tidak ditemukan.");
      }
    })
    .catch(() => setError("Terjadi kesalahan koneksi."))
    .finally(() => setIsSearching(false));
  };

  if (view === 'admin') {
    return (
      <div className="min-h-screen flex bg-slate-50 font-sans">
        {/* Sidebar */}
        <aside className="w-72 bg-[#111827] text-white flex flex-col no-print">
          <div className="p-7 border-b border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-[#1D4ED8] rounded-xl flex items-center justify-center shadow-[0_8px_20px_-8px_rgba(29,78,216,0.7)]">
                 <LayoutDashboard size={18} className="text-white" />
              </div>
              <h1 className="font-extrabold tracking-tight text-base">Portal Admin</h1>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">TIM IT SKANSAGIRI</p>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <div 
              onClick={() => setAdminTab('overview')}
              className={`admin-sidebar-item ${adminTab === 'overview' ? 'admin-sidebar-item-active' : ''}`}
            >
              <TrendingUp size={20} />
              <span>Ringkasan Stat</span>
            </div>
            <div 
              onClick={() => setAdminTab('students')}
              className={`admin-sidebar-item ${adminTab === 'students' ? 'admin-sidebar-item-active' : ''}`}
            >
              <User size={20} />
              <span>Data Siswa</span>
            </div>
            <div 
              onClick={() => setAdminTab('import')}
              className={`admin-sidebar-item ${adminTab === 'import' ? 'admin-sidebar-item-active' : ''}`}
            >
              <Database size={20} />
              <span>Import Center</span>
            </div>
            <div 
              onClick={() => setAdminTab('settings')}
              className={`admin-sidebar-item ${adminTab === 'settings' ? 'admin-sidebar-item-active' : ''}`}
            >
              <Settings size={20} />
              <span>Pengaturan</span>
            </div>
          </nav>

          <div className="p-6 border-t border-white/5 space-y-4">
             <div className="p-3 bg-white/5 rounded-xl text-[10px] text-slate-400 font-medium">
               <p className="mb-1">Versi Sistem: 2.0.26</p>
               <p>Joben Enterprise © 2026</p>
             </div>
             <button 
                onClick={() => setView('public')}
                className="w-full flex items-center justify-between px-4 py-3 bg-red-500/10 text-red-500 rounded-xl font-bold text-xs hover:bg-red-500/20 transition-all"
             >
               LOGOUT
               <LogOut size={16} />
             </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10">
          <header className="flex justify-between items-center mb-10">
            <div>
               <h2 className="text-3xl font-black text-slate-800 tracking-tight capitalize">
                 {adminTab === 'overview' ? 'Dashboard Overview' : 
                  adminTab === 'students' ? 'Manajemen Siswa' : 
                  adminTab === 'import' ? 'Update Data Massal' : 'Pengaturan Portal'}
               </h2>
               <p className="text-slate-400 font-medium text-sm">Selamat datang, Admin SKANSAGIRI</p>
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
               <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-slate-400">Status Server</p>
                  <p className="text-xs font-bold text-emerald-500 flex items-center justify-end gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Operational
                  </p>
               </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {adminTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Siswa', value: statsData.total, icon: User, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Siswa Lulus', value: statsData.lulus, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Belum Lulus', value: statsData.tidakLulus, icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
                    { label: 'Data Dicek', value: statsData.checked || 0, icon: Search, color: 'text-[#1D4ED8]', bg: 'bg-[#EFF4FF]' },
                  ].map((stat, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ y: -5 }}
                      className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 transition-all"
                    >
                      <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-inner`}>
                         <stat.icon size={28} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tighter">{stat.value}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm h-[440px]">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="font-black text-slate-800 tracking-tight text-xl">Profil Kelulusan 2026</h3>
                      <div className="flex gap-4">
                         <div className="flex items-center gap-2">
                           <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                           <span className="text-[10px] font-black text-slate-400">LULUS</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                           <span className="text-[10px] font-black text-slate-400">BELUM LULUS</span>
                         </div>
                      </div>
                    </div>
                    <div className="h-72 relative">
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie
                             data={[
                                { name: 'Lulus', value: statsData.lulus, color: '#10b981' },
                                { name: 'Belum Lulus', value: statsData.tidakLulus, color: '#ef4444' },
                             ]}
                             innerRadius={70}
                             outerRadius={120}
                             paddingAngle={8}
                             dataKey="value"
                             stroke="none"
                           >
                             {[
                                { name: 'Lulus', value: statsData.lulus, color: '#10b981' },
                                { name: 'Belum Lulus', value: statsData.tidakLulus, color: '#ef4444' },
                             ].map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} />
                             ))}
                           </Pie>
                           <Tooltip 
                             contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '16px' }}
                             itemStyle={{ fontWeight: '900', fontSize: '12px', textTransform: 'uppercase' }}
                           />
                         </PieChart>
                       </ResponsiveContainer>
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                          <p className="text-4xl font-black text-slate-800 tracking-tighter">98.2%</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Passing Rate</p>
                       </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                    <h3 className="font-black text-slate-800 tracking-tight text-xl mb-6">Waktu Pengumuman</h3>
                    <div className="space-y-6">
                       <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
                          <p className="text-[10px] font-bold uppercase text-[#1D4ED8] tracking-[0.2em] mb-4">Pengaturan Aktif</p>
                          <div className="space-y-4">
                             <div className="flex items-center gap-4 text-slate-700">
                                <Calendar size={18} className="text-slate-400" />
                                <span className="text-sm font-bold tracking-tight">{announcementDate}</span>
                             </div>
                             <div className="flex items-center gap-4 text-slate-700">
                                <Calendar size={18} className="text-slate-400 opacity-0" />
                                <span className="text-sm font-bold tracking-tight">{announcementTime} WIB</span>
                             </div>
                          </div>
                       </div>
                       <button 
                         onClick={() => setAdminTab('settings')}
                         className="w-full py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                       >
                         Ubah Jadwal
                         <ArrowRight size={14} />
                       </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {adminTab === 'students' && (
              <motion.div 
                key="students"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden"
              >
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">                    <div className="relative w-full md:w-96">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input 
                       type="text" 
                       placeholder="Cari Nama Siswa atau NISN..." 
                       className="w-full pl-14 pr-6 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl focus:border-[#1D4ED8] focus:ring-4 focus:ring-[#1D4ED8]/10 transition-all outline-none text-sm font-medium text-[#111827] placeholder:text-[#9CA3AF]"
                       value={adminSearch}
                       onChange={(e) => setAdminSearch(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={async () => {
                        if(confirm("Hapus semua riwayat pengecekan siswa?")) {
                            await fetch('/api/admin/reset-tracking', { method: 'POST' });
                            fetchStudents(adminSearch);
                        }
                    }}
                    className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-rose-100 transition-all border-b-4 border-rose-200"
                  >
                     Reset Status Pengecekan
                  </button>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full">
                      <thead>
                         <tr>
                            <th className="admin-table-header pl-8">NISN</th>
                            <th className="admin-table-header">Nama Lengkap</th>
                            <th className="admin-table-header">Kelas</th>
                            <th className="admin-table-header">Konsentrasi Keahlian</th>
                            <th className="admin-table-header text-center">Hasil</th>
                            <th className="admin-table-header text-right pr-8">Opsi</th>
                         </tr>
                      </thead>
                      <tbody>
                         {studentsData.map((student) => (
                            <tr key={student.id} className="admin-table-row group">
                               <td className="px-8 py-6 font-mono text-xs font-bold text-slate-500">{student.nisn}</td>
                               <td className="px-6 py-6 transition-all group-hover:pl-8">
                                  <p className="font-black text-slate-800 text-sm tracking-tight uppercase">{student.name}</p>
                                  <p className="text-[10px] text-slate-400 font-medium mt-1 italic">
                                    {formatInlineBirth(student.birth_place, student.birth_date)}
                                  </p>
                               </td>
                               <td className="px-6 py-6">
                                  <span className="inline-flex px-3 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                                    {student.class}
                                  </span>
                               </td>
                               <td className="px-6 py-6 max-w-[220px]">
                                  <p className="text-[11px] font-bold text-slate-700 leading-snug">{student.major}</p>
                               </td>
                               <td className="px-6 py-6 text-center">
                                  <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tighter ${
                                    student.status_graduation ? 'bg-emerald-100/50 text-emerald-600' : 'bg-rose-100/50 text-rose-600'
                                  }`}>
                                    {student.status_graduation ? 'LULUS' : 'BELUM LULUS'}
                                  </span>
                               </td>
                               <td className="px-8 py-6 text-right">
                                  <button
                                    onClick={() => setEditStudent(student)}
                                    className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm"
                                  >
                                     <Settings size={18} />
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>

                   </table>
                </div>
              </motion.div>
            )}

            {adminTab === 'import' && (
              <motion.div 
                key="import"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-3xl mx-auto"
              >
                <div className="quantum-card p-10 sm:p-12 text-center relative overflow-hidden">
                   {/* Background element */}
                   <div className="absolute top-0 right-0 w-64 h-64 bg-[#EFF4FF] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                   
                   <div className="relative z-10">
                      <div className="w-20 h-20 bg-[#1D4ED8] text-white rounded-2xl flex items-center justify-center mx-auto mb-7 shadow-[0_16px_36px_-12px_rgba(29,78,216,0.55)]">
                         <Database size={36} />
                      </div>
                      <h3 className="text-3xl font-extrabold text-[#111827] tracking-tight mb-2">Update Data Siswa</h3>
                      <p className="text-[#6B7280] text-sm font-normal mb-10 max-w-sm mx-auto">Import data massal dari Excel untuk memperbarui status kelulusan siswa secara akurat.</p>
                      
                      <div className="border-2 border-dashed border-[#DBEAFE] rounded-2xl p-12 mb-10 hover:border-[#1D4ED8] transition-all group cursor-pointer bg-[#F9FAFB] hover:bg-[#EFF4FF]/30 relative overflow-hidden">
                         <label className="cursor-pointer block">
                            <input type="file" className="hidden" onChange={handleImportFile} accept=".xlsx,.xls" />
                            <div className="relative z-10">
                               <FileText size={44} className="mx-auto text-[#9CA3AF] group-hover:text-[#1D4ED8] transition-all mb-3 group-hover:scale-110" />
                               <p className="text-base font-bold text-[#111827] transition-colors">Pilih File Excel</p>
                               <p className="text-[11px] text-[#6B7280] font-medium mt-1.5">Format: .xlsx, .xls (Maks: 10MB)</p>
                            </div>
                         </label>
                      </div>

                      <div className="bg-[#F9FAFB] rounded-2xl p-7 mb-8 text-left border border-[#E5E7EB]">
                         <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider mb-4 flex items-center gap-2">
                           <Database size={14} className="text-[#1D4ED8]" />
                           Struktur Kolom Excel (Wajib)
                         </h4>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {['nisn', 'name', 'birth_place', 'birth_date', 'class', 'major', 'status'].map((col) => (
                               <div key={col} className="bg-white px-3 py-2 rounded-lg border border-[#E5E7EB]">
                                  <code className="text-[10px] font-bold text-[#1D4ED8]">{col}</code>
                               </div>
                            ))}
                         </div>
                         <p className="mt-4 text-[11px] text-[#6B7280] font-normal leading-relaxed">
                           * birth_place: Kota / Kabupaten kelahiran (mis. Wonogiri).<br/>
                           * birth_date: YYYY-MM-DD, DD/MM/YYYY, "26 Mei 2008" atau format Excel Date.<br/>
                           * major: Konsentrasi Keahlian (mis. Rekayasa Perangkat Lunak).<br/>
                           * status: 1 (Lulus), 0 (Belum Lulus).
                         </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <button className="quantum-button w-full">
                           Mulai Proses Import
                         </button>
                         <button
                           type="button"
                           onClick={downloadStudentTemplate}
                           className="quantum-button-ghost w-full flex items-center justify-center gap-2"
                         >
                           <Download size={14} />
                           Download Template
                         </button>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {adminTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-4xl"
              >
                <div className="quantum-card p-8 md:p-10 space-y-10">
                   {/* School Identity */}
                   <div className="grid lg:grid-cols-12 gap-10">
                      <div className="lg:col-span-4 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="w-11 h-11 bg-[#EFF4FF] text-[#1D4ED8] rounded-xl flex items-center justify-center">
                              <Building2 size={22} />
                           </div>
                           <h3 className="text-lg font-extrabold text-[#111827] tracking-tight">Identitas Sekolah</h3>
                        </div>
                        
                        <div className="space-y-4">
                           <div className="relative group">
                              <div className="w-full h-48 bg-[#F9FAFB] border-2 border-dashed border-[#DBEAFE] rounded-2xl overflow-hidden flex flex-col items-center justify-center transition-all group-hover:border-[#1D4ED8] group-hover:bg-white relative">
                                 {(logoPreview || schoolLogo) ? (
                                    <img 
                                      src={logoPreview || `/storage/${schoolLogo}`} 
                                      className="w-full h-full object-contain p-4" 
                                      alt="Preview Logo" 
                                    />
                                 ) : (
                                    <>
                                       <FileText size={28} className="text-[#9CA3AF] mb-2" />
                                       <p className="text-[11px] font-semibold text-[#6B7280]">Logo Sekolah</p>
                                    </>
                                 )}
                                 <input 
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    accept="image/*"
                                    onChange={(e) => {
                                       const file = e.target.files?.[0];
                                       if (file) {
                                          setLogoFile(file);
                                          setLogoPreview(URL.createObjectURL(file));
                                       }
                                    }}
                                 />
                              </div>
                              <p className="text-[11px] text-[#6B7280] font-medium mt-2 text-center">Klik untuk ganti logo</p>
                           </div>
                        </div>
                      </div>

                      <div className="lg:col-span-8 space-y-5">
                         <div className="grid sm:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                               <label className="text-[11px] font-semibold text-[#111827] px-1">Nama Sekolah</label>
                               <input 
                                 type="text"
                                 className="settings-input"
                                 value={schoolName}
                                 onChange={(e) => setSchoolName(e.target.value)}
                               />
                            </div>
                            <div className="space-y-1.5">
                               <label className="text-[11px] font-semibold text-[#111827] px-1">NPSN</label>
                               <input 
                                 type="text"
                                 className="settings-input"
                                 value={schoolNpsn}
                                 onChange={(e) => setSchoolNpsn(e.target.value)}
                               />
                            </div>
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-[#111827] px-1">Alamat Sekolah</label>
                            <textarea 
                              className="settings-input h-24 resize-none"
                              value={schoolAddress}
                              onChange={(e) => setSchoolAddress(e.target.value)}
                            />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-[#111827] px-1">Nama Kepala Sekolah</label>
                            <input 
                              type="text"
                              className="settings-input"
                              value={principalName}
                              onChange={(e) => setPrincipalName(e.target.value)}
                            />
                         </div>
                      </div>
                   </div>

                   {/* Manajemen Konten — Kepala Sekolah & Motivasi */}
                   <div className="pt-10 border-t border-[#E5E7EB]">
                      <div className="flex items-center gap-3 mb-6">
                         <div className="w-11 h-11 bg-[#EFF4FF] text-[#1D4ED8] rounded-xl flex items-center justify-center">
                            <Quote size={22} />
                         </div>
                         <div>
                            <h3 className="text-lg font-extrabold text-[#111827] tracking-tight">Manajemen Konten</h3>
                            <p className="text-[12px] text-[#6B7280] font-normal">Foto Kepala Sekolah & Pesan Motivasi</p>
                         </div>
                      </div>

                      <div className="grid lg:grid-cols-12 gap-6">
                         {/* Foto Kepala Sekolah — thin elegant blue border */}
                         <div className="lg:col-span-4 module-card-blue">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1D4ED8] mb-3">Foto Kepala Sekolah</p>
                            <div className="relative group">
                               <div className="w-full aspect-[3/4] bg-[#F9FAFB] border border-[#DBEAFE] rounded-xl overflow-hidden flex flex-col items-center justify-center transition-all group-hover:border-[#1D4ED8] relative">
                                 {(principalPhotoPreview || principalPhoto) ? (
                                    <img
                                       src={principalPhotoPreview || `/storage/${principalPhoto}`}
                                       className="w-full h-full object-cover"
                                       alt="Foto Kepala Sekolah"
                                    />
                                 ) : (
                                    <>
                                       <User size={32} className="text-[#9CA3AF] mb-2" strokeWidth={1.5} />
                                       <p className="text-[11px] font-semibold text-[#6B7280]">Unggah Foto</p>
                                    </>
                                 )}
                                 <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept="image/*"
                                    onChange={(e) => {
                                       const file = e.target.files?.[0];
                                       if (file) {
                                          setPrincipalPhotoFile(file);
                                          setPrincipalPhotoPreview(URL.createObjectURL(file));
                                       }
                                    }}
                                 />
                               </div>
                               <p className="text-[11px] text-[#6B7280] font-medium mt-2 text-center">Format JPG/PNG, rasio 3:4</p>
                            </div>
                         </div>

                         {/* Pesan Motivasi */}
                         <div className="lg:col-span-8 module-card-blue">
                            <div className="flex items-center justify-between mb-3">
                               <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1D4ED8]">Pesan Motivasi Kepala Sekolah</p>
                               <span className="text-[11px] font-medium text-[#6B7280]">{motivationMessage.length} karakter</span>
                            </div>
                            <textarea
                               className="settings-input h-44 resize-none leading-relaxed"
                               value={motivationMessage}
                               onChange={(e) => setMotivationMessage(e.target.value)}
                               placeholder="Tuliskan pesan motivasi atau sambutan yang akan ditampilkan kepada siswa di halaman utama..."
                            />
                            <p className="text-[11px] text-[#6B7280] font-normal mt-2">
                               Pesan ini akan tampil sebagai sambutan resmi di halaman publik.
                            </p>
                         </div>
                      </div>
                   </div>

                   {/* Schedule */}
                   <div className="pt-10 border-t border-[#E5E7EB]">
                      <div className="flex items-center gap-3 mb-6">
                         <div className="w-11 h-11 bg-[#EFF4FF] text-[#1D4ED8] rounded-xl flex items-center justify-center">
                            <Calendar size={22} />
                         </div>
                         <h3 className="text-lg font-extrabold text-[#111827] tracking-tight">Jadwal & Preferensi</h3>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-5 mb-6">
                         <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-[#111827] px-1">Tanggal Rilis</label>
                            <input 
                              type="date"
                              className="settings-input"
                              value={announcementDate}
                              onChange={(e) => setAnnouncementDate(e.target.value)}
                            />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-[#111827] px-1">Waktu (WIB)</label>
                            <input 
                              type="time"
                              className="settings-input"
                              value={announcementTime}
                              onChange={(e) => setAnnouncementTime(e.target.value)}
                            />
                         </div>
                      </div>
                       <div className="space-y-4">
                            <div className="flex items-center justify-between p-5 bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB]">
                              <div className="flex items-center gap-4">
                                 <div className={`w-8 h-8 rounded-full ${maintenanceMode ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 text-slate-400'} flex items-center justify-center`}>
                                    {maintenanceMode ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                 </div>
                                 <div className="pr-4">
                                    <p className="text-sm font-bold text-[#111827]">Mode Perawatan (Maintenance)</p>
                                    <p className="text-[12px] font-normal text-[#6B7280]">Nonaktifkan fitur pencarian untuk sementara.</p>
                                 </div>
                              </div>
                              <div 
                                onClick={() => setMaintenanceMode(!maintenanceMode)}
                                className={`w-12 h-6 ${maintenanceMode ? 'bg-[#1D4ED8]' : 'bg-slate-200'} rounded-full p-1 cursor-pointer transition-all flex items-center`}
                              >
                                 <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-all ${maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                              </div>
                           </div>
                      </div>
                   </div>

                   <button 
                    onClick={handleSaveSettings}
                    disabled={isLoading}
                    className="quantum-button w-full flex items-center justify-center gap-3"
                   >
                      {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                      Simpan Semua Perubahan
                   </button>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Edit Student Modal */}
          <AnimatePresence>
            {editStudent && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#111827]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
              >
                <motion.div 
                   initial={{ scale: 0.9, y: 20 }}
                   animate={{ scale: 1, y: 0 }}
                   className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden"
                >
                   <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Edit Status Siswa</h3>
                      <button onClick={() => setEditStudent(null)} className="p-2 hover:bg-slate-50 rounded-full">
                        <XCircle size={24} className="text-slate-300" />
                      </button>
                   </div>
                   <form onSubmit={handleUpdateStudent} className="p-8 space-y-6">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                         <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Identitas Siswa</p>
                         <p className="font-bold text-slate-800 text-lg">{editStudent.name}</p>
                         <p className="text-xs text-slate-500 font-mono">{editStudent.nisn}</p>
                      </div>

                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase text-slate-500 px-1">Hasil Kelulusan</label>
                         <div className="grid grid-cols-2 gap-4">
                            <div 
                               onClick={() => setEditStudent({...editStudent, status_graduation: 1})}
                               className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                                 editStudent.status_graduation == 1 ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100'
                               }`}
                            >
                               <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${editStudent.status_graduation == 1 ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                                  {editStudent.status_graduation == 1 && <div className="w-2 h-2 bg-white rounded-full" />}
                               </div>
                               <span className={`font-black text-xs uppercase tracking-widest ${editStudent.status_graduation == 1 ? 'text-emerald-700' : 'text-slate-400'}`}>Lulus</span>
                            </div>
                            <div 
                               onClick={() => setEditStudent({...editStudent, status_graduation: 0})}
                               className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                                 editStudent.status_graduation == 0 ? 'border-rose-500 bg-rose-50' : 'border-slate-100'
                               }`}
                            >
                               <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${editStudent.status_graduation == 0 ? 'border-rose-500 bg-rose-500' : 'border-slate-300'}`}>
                                  {editStudent.status_graduation == 0 && <div className="w-2 h-2 bg-white rounded-full" />}
                               </div>
                               <span className={`font-black text-xs uppercase tracking-widest ${editStudent.status_graduation == 0 ? 'text-rose-700' : 'text-slate-400'}`}>Belum Lulus</span>
                            </div>
                         </div>
                      </div>

                      <div className="pt-4 flex gap-4">
                         <button type="submit" className="quantum-button flex-1">Simpan Perubahan</button>
                         <button type="button" onClick={() => setEditStudent(null)} className="quantum-button-ghost px-6">Batal</button>
                      </div>
                   </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      {/* Clean Modern Header */}
      <header className="bg-white border-b border-[#E5E7EB] px-6 md:px-12 py-5 flex justify-between items-center no-print sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#1D4ED8] rounded-xl flex items-center justify-center overflow-hidden shadow-[0_8px_20px_-8px_rgba(29,78,216,0.6)]">
             {schoolInfo?.school_logo ? (
                <img src={schoolInfo.school_logo} className="w-full h-full object-contain p-1.5" alt="Logo" />
             ) : (
                <GraduationCap size={22} className="text-white" strokeWidth={2.5} />
             )}
          </div>
          <div className="leading-tight">
            <h1 className="text-[15px] font-extrabold text-[#111827] tracking-tight">
              {schoolInfo?.school_name || "SMKN 1 Wonogiri"}
            </h1>
            <p className="text-[10px] text-[#6B7280] font-medium tracking-wide">Quantum Graduation Portal · 2026</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full bg-[#F9FAFB] border border-[#E5E7EB]">
          <Calendar size={12} className="text-[#1D4ED8]" />
          <p className="text-[11px] font-semibold text-[#111827]">TA 2025 / 2026</p>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 md:px-12 py-10 md:py-16">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
            >
              {/* LEFT: Hero text */}
              <div className="space-y-7">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EFF4FF] border border-[#DBEAFE]">
                  <Sparkles size={12} className="text-[#1D4ED8]" />
                  <span className="text-[11px] font-semibold text-[#1D4ED8] tracking-wide">Sistem Pengumuman Resmi 2026</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#111827] leading-[1.05] tracking-tight">
                  Quantum Portal<br />Kelulusan untuk{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10 text-[#1D4ED8]">Siswa Modern</span>
                    <span className="absolute left-0 right-0 bottom-1 h-3 bg-[#DBEAFE] -z-0 rounded-sm"></span>
                  </span>
                </h1>

                <p className="text-[17px] leading-relaxed text-[#6B7280] max-w-lg font-normal">
                  Periksa status kelulusan Anda secara aman, cepat, dan akurat.
                  Cukup masukkan NISN dan tanggal lahir — hasil resmi tersedia
                  langsung dari basis data sekolah dengan enkripsi tingkat lembaga.
                </p>

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <div>
                    <p className="text-3xl font-extrabold text-[#111827] tracking-tight">{statsData.total || 450}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] mt-1">Total Siswa</p>
                  </div>
                  <div className="w-px h-10 bg-[#E5E7EB]" />
                  <div>
                    <p className="text-3xl font-extrabold text-[#1D4ED8] tracking-tight">98.2%</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] mt-1">Passing Rate</p>
                  </div>
                  <div className="w-px h-10 bg-[#E5E7EB]" />
                  <div>
                    <p className="text-3xl font-extrabold text-[#111827] tracking-tight">24/7</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280] mt-1">Akses Real-time</p>
                  </div>
                </div>
              </div>

              {/* RIGHT: Search / Countdown card */}
              <div className="relative">
                {/* Soft halo behind card */}
                <div className="absolute -inset-6 bg-gradient-to-tr from-[#DBEAFE]/60 via-white to-[#EFF4FF]/40 rounded-[32px] blur-2xl -z-10" />

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="quantum-card-floating p-7 sm:p-9"
                >
                  {!isReady && !maintenanceMode ? (
                    <div className="text-center">
                      <div className="inline-flex p-3 bg-[#EFF4FF] rounded-2xl text-[#1D4ED8] mb-5">
                        <Calendar size={28} />
                      </div>
                      <h2 className="text-2xl sm:text-[26px] font-extrabold text-[#111827] tracking-tight mb-1.5">Pengumuman Segera Dibuka</h2>
                      <p className="text-[#6B7280] text-sm mb-8">Silakan menunggu waktu rilis resmi.</p>

                      <div className="grid grid-cols-4 gap-2.5 mb-8">
                        {[
                          { label: 'HARI', value: countdown.days },
                          { label: 'JAM', value: countdown.hours },
                          { label: 'MENIT', value: countdown.minutes },
                          { label: 'DETIK', value: countdown.seconds },
                        ].map((item, i) => (
                          <div key={i} className="bg-[#F9FAFB] py-4 rounded-xl border border-[#E5E7EB]">
                            <p className="text-3xl sm:text-4xl font-extrabold text-[#111827] quantum-pulse tracking-tight">
                              {String(item.value).padStart(2, '0')}
                            </p>
                            <p className="text-[9px] font-semibold text-[#6B7280] tracking-[0.18em] mt-1.5">{item.label}</p>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-[#EFF4FF] rounded-xl border border-[#DBEAFE]">
                        <p className="text-[11px] font-medium text-[#1E40AF] leading-relaxed">
                          Formulir pencarian akan otomatis terbuka secara real-time
                          saat hitung mundur mencapai angka nol.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-7">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1D4ED8] mb-1.5">Cek Hasil Kelulusan</p>
                        <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Masukkan Data Anda</h2>
                        <p className="text-[#6B7280] text-sm mt-1.5">Pastikan NISN dan tanggal lahir sesuai kartu pelajar.</p>
                      </div>

                      <form onSubmit={handleSearchClick} className="space-y-4">
                        <div className={maintenanceMode ? 'opacity-50 pointer-events-none' : ''}>
                          <label htmlFor="search-input" className="block text-[11px] font-semibold text-[#111827] mb-1.5">
                            Nomor Induk Siswa Nasional
                          </label>
                          <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                            <input
                              type="text"
                              id="search-input"
                              className="quantum-input"
                              placeholder="00829180xx"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              required
                              disabled={maintenanceMode}
                            />
                          </div>
                        </div>

                        <div className={maintenanceMode ? 'opacity-50 pointer-events-none' : ''}>
                          <label htmlFor="birth-date" className="block text-[11px] font-semibold text-[#111827] mb-1.5">
                            Tanggal Lahir
                          </label>
                          <div className="relative">
                            <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                            <input
                              type="date"
                              id="birth-date"
                              className="quantum-input"
                              value={birthDate}
                              onChange={(e) => setBirthDate(e.target.value)}
                              required
                              disabled={maintenanceMode}
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSearching || maintenanceMode}
                          className="w-full quantum-button flex items-center justify-center gap-2.5 mt-2"
                        >
                          {isSearching ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Memproses...
                            </>
                          ) : (
                            <>
                              {maintenanceMode ? "Sistem Terkunci" : "Lihat Hasil Kelulusan"}
                              {!maintenanceMode && <ArrowRight size={16} />}
                            </>
                          )}
                        </button>

                        {/* Feature badges */}
                        <div className="flex flex-wrap gap-2 justify-center pt-3">
                          <span className="feature-badge">
                            <Lock size={10} /> AES-256 Enkripsi
                          </span>
                          <span className="feature-badge">
                            <ShieldCheck size={10} /> Data Valid
                          </span>
                          <span className="feature-badge">
                            <Activity size={10} /> 99.9% Uptime
                          </span>
                        </div>
                      </form>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-5 p-3.5 rounded-xl bg-red-50 text-red-700 border border-red-100 flex items-center gap-2.5 text-xs font-medium"
                        >
                          <XCircle size={14} />
                          {error}
                        </motion.div>
                      )}

                      {maintenanceMode && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-6 p-5 bg-[#111827] text-white rounded-2xl text-center"
                        >
                          <Settings size={22} className="mx-auto mb-2 text-[#1D4ED8]" />
                          <p className="text-[11px] font-bold uppercase tracking-widest text-[#60A5FA] mb-1.5">Maintenance Mode</p>
                          <p className="text-[11px] font-medium text-slate-300 leading-relaxed">Layanan sedang dalam pemeliharaan rutin oleh Tim IT Skansagiri.</p>
                        </motion.div>
                      )}
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>
          ) : (
              <motion.div
                key="result-display"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-3xl mx-auto space-y-6"
              >
                {/* ----------------------------------------------------------
                    Official "Prestige" Result Card — Quantum Modern Blue
                    ---------------------------------------------------------- */}
                <div className="bg-white border border-[#DBEAFE] rounded-2xl shadow-[0_24px_60px_-20px_rgba(29,78,216,0.18),0_8px_24px_-12px_rgba(17,24,39,0.10)] overflow-hidden relative font-display">
                   {/* SKANSAGIRI watermark */}
                   <div className="watermark-text">SKANSAGIRI</div>

                   {/* Document header bar */}
                   <div className="bg-[#111827] text-white px-6 md:px-10 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 relative z-10">
                      <div className="flex items-center gap-3">
                        {schoolLogo ? (
                          <img
                            src={`/storage/${schoolLogo}`}
                            alt="Logo Sekolah"
                            className="w-9 h-9 object-contain bg-white rounded-md p-1"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-md bg-[#1D4ED8] text-white flex items-center justify-center">
                            <GraduationCap size={20} strokeWidth={2.5} />
                          </div>
                        )}
                        <div className="leading-tight">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.32em] text-[#60A5FA]">
                            Surat Pengumuman Resmi
                          </p>
                          <p className="text-xs font-bold uppercase tracking-widest">
                            Hasil Kelulusan Siswa
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-300">
                        TP. 2025 / 2026
                      </span>
                   </div>

                   <div className="p-8 md:p-12 relative z-10">
                     {/* Header: identity + photo */}
                     <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
                        <div className="flex-1 space-y-5">
                           <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#1D4ED8] mb-1">
                                Nama Lengkap
                              </p>
                              <h3 className="font-display text-3xl md:text-4xl font-extrabold text-[#111827] leading-tight uppercase tracking-tight">
                                {result.name}
                              </h3>
                           </div>

                           <dl className="space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4">
                                 <dt className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400 sm:w-48 shrink-0">
                                   NISN
                                 </dt>
                                 <dd className="font-mono font-bold text-slate-700 tracking-tight text-base">
                                   {result.nisn}
                                 </dd>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4">
                                 <dt className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400 sm:w-48 shrink-0">
                                   Tempat, Tanggal Lahir
                                 </dt>
                                 <dd className="font-display font-bold text-slate-700 text-base">
                                   {formatInlineBirth(
                                     (result as any).birth_place,
                                     result.birth_date,
                                   )}
                                 </dd>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4">
                                 <dt className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400 sm:w-48 shrink-0">
                                   Kelas
                                 </dt>
                                 <dd className="font-display font-bold text-slate-700 text-base">
                                   {result.class}
                                 </dd>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4">
                                 <dt className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400 sm:w-48 shrink-0">
                                   Konsentrasi Keahlian
                                 </dt>
                                 <dd className="font-display font-bold text-slate-700 text-base">
                                   {result.major}
                                 </dd>
                              </div>
                           </dl>
                        </div>

                        <div className="w-28 h-36 bg-slate-50 border-2 border-slate-100 rounded-xl flex items-center justify-center text-slate-300 self-start">
                           <User size={48} strokeWidth={1} />
                        </div>
                     </div>

                     {/* Decision band with digital stamp on top of watermark */}
                     <div className={`relative overflow-hidden p-8 md:p-10 rounded-2xl border-4 shadow-inner ${
                        result.status_graduation
                          ? 'bg-emerald-50/60 border-emerald-500'
                          : 'bg-rose-50/60 border-rose-500'
                     }`}>
                        {/* Inner watermark for the decision band */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                          <span
                            className="font-display font-black text-[20vw] md:text-[14vw] text-slate-900 opacity-[0.04] -rotate-12"
                            style={{ letterSpacing: '-0.04em' }}
                          >
                            SKANSAGIRI
                          </span>
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                           <div className={`flex-1 text-center md:text-left ${
                             result.status_graduation ? 'text-emerald-800' : 'text-rose-800'
                           }`}>
                              <p className="text-[10px] font-black uppercase tracking-[0.32em] mb-3 opacity-80">
                                {result.status_graduation
                                  ? 'Pengumuman Resmi'
                                  : 'Status Kelulusan'}
                              </p>
                              <h4 className="font-display text-2xl md:text-3xl font-black uppercase leading-tight mb-3">
                                {result.status_graduation
                                  ? `Anda Dinyatakan LULUS dari ${schoolInfo?.school_name || 'SMKN 1 Wonogiri'}`
                                  : 'Anda Dinyatakan BELUM LULUS'}
                              </h4>
                              {!result.status_graduation && (
                                <p className="text-xs font-medium leading-relaxed opacity-90 max-w-md">
                                  Mohon maaf, silakan hubungi wali kelas atau admin sekolah
                                  untuk informasi lebih lanjut mengenai langkah berikutnya.
                                </p>
                              )}
                              <p className="text-[10px] font-bold opacity-60 uppercase tracking-[0.28em] mt-4">
                                {schoolInfo?.school_name || 'SMKN 1 Wonogiri'} • Mei 2026
                              </p>
                           </div>

                           {/* Official digital stamp */}
                           <div
                             className={`official-stamp shrink-0 ${
                               result.status_graduation ? '' : 'is-failed'
                             }`}
                             aria-label={result.status_graduation ? 'Stempel LULUS' : 'Stempel BELUM LULUS'}
                           >
                              <span className="stamp-eyebrow">
                                {result.status_graduation ? 'Pengumuman Resmi' : 'Status'}
                              </span>
                              <span className="stamp-headline">
                                {result.status_graduation ? 'LULUS' : 'TIDAK'}
                              </span>
                              <span className="stamp-meta">
                                SKANSAGIRI • 2026
                              </span>
                           </div>
                        </div>
                     </div>

                     <div className="mt-10 flex flex-col sm:flex-row gap-4 pt-8 border-t border-[#E5E7EB] items-center justify-between">
                        <div className="flex gap-3 w-full sm:w-auto order-2 sm:order-1">
                           <button className="flex-1 sm:flex-none quantum-button px-6 flex items-center justify-center gap-2">
                              <FileText size={16} />
                              Unduh SKL Digital
                           </button>
                           <button
                             onClick={() => setResult(null)}
                             className="px-6 quantum-button-ghost"
                           >
                             Kembali
                           </button>
                        </div>

                        <p className="text-[10px] font-medium text-slate-400 tracking-wide order-1 sm:order-2">
                          Created by: <span className="text-slate-500">TIM IT SKANSAGIRI</span>
                          <span className="mx-2 text-slate-300">|</span>
                          Powered by: <span className="text-[#1D4ED8] font-semibold">Joben Enterprise</span>
                        </p>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
      </main>

      {/* Motivational Section from Kepala Sekolah */}
      {motivationMessage && (
        <section className="px-4 sm:px-6 md:px-12 py-12 bg-[#F9FAFB] border-t border-[#E5E7EB] no-print">
          <div className="max-w-4xl mx-auto">
            <div className="module-card-blue p-8 sm:p-10 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              <div className="shrink-0 relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-[#DBEAFE] bg-white overflow-hidden flex items-center justify-center">
                  {(principalPhotoPreview || principalPhoto) ? (
                    <img
                      src={principalPhotoPreview || `/storage/${principalPhoto}`}
                      alt={principalName || 'Kepala Sekolah'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={36} className="text-[#9CA3AF]" strokeWidth={1.5} />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#1D4ED8] rounded-full flex items-center justify-center shadow-[0_8px_20px_-8px_rgba(29,78,216,0.6)]">
                  <Quote size={14} className="text-white" />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1D4ED8] mb-2">Sambutan Kepala Sekolah</p>
                <p className="text-[15px] sm:text-[16px] leading-relaxed text-[#111827] font-medium italic">
                  &ldquo;{motivationMessage}&rdquo;
                </p>
                {principalName && (
                  <p className="text-sm font-semibold text-[#111827] mt-4">— {principalName}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Clean Modern Footer */}
      <footer className="px-6 md:px-12 py-8 bg-white border-t border-[#E5E7EB] flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
        <div className="flex items-center gap-4">
          <p className="text-xs font-semibold text-[#111827]">
            © 2026 {schoolInfo?.school_name || "SMKN 1 Wonogiri"}
          </p>
          <button
            onClick={() => setView('admin')}
            className="text-[11px] font-medium text-[#6B7280] hover:text-[#1D4ED8] transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E5E7EB] hover:border-[#DBEAFE] hover:bg-[#EFF4FF]"
          >
            <LayoutDashboard size={11} />
            Portal Admin
          </button>
        </div>
        <p className="text-[11px] text-slate-400 font-medium">
          Created by: <span className="text-slate-500 font-semibold">TIM IT SKANSAGIRI</span>
          <span className="mx-2 text-slate-300">|</span>
          Powered by: <span className="text-slate-500 font-semibold">Joben Enterprise</span>
        </p>
      </footer>
    </div>
  );
}
