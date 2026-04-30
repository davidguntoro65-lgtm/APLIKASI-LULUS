/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, GraduationCap, CheckCircle, XCircle, FileText, User, Calendar, BookOpen, Building2, LayoutDashboard, Database, Settings, LogOut, ArrowRight, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

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
        <aside className="w-72 bg-[#0f172a] text-white flex flex-col no-print">
          <div className="p-8 border-b border-white/5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
                 <LayoutDashboard size={18} className="text-[#0f172a]" />
              </div>
              <h1 className="font-black tracking-tighter text-lg">PORTAL ADMIN</h1>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">TIM IT SKANSAGIRI</p>
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
                    { label: 'Data Dicek', value: statsData.checked || 0, icon: Search, color: 'text-amber-500', bg: 'bg-amber-50' },
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
                          <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] mb-4">Pengaturan Aktif</p>
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
                       className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-amber-400 transition-all outline-none text-sm font-bold text-slate-800 placeholder:text-slate-300 shadow-inner"
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
                <div className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-2xl text-center relative overflow-hidden">
                   {/* Background element */}
                   <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                   
                   <div className="relative z-10">
                      <div className="w-24 h-24 bg-blue-600 text-white rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-200 rotate-6 transform transition-transform hover:rotate-0 cursor-default">
                         <Database size={44} />
                      </div>
                      <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-3">Update Data Siswa</h3>
                      <p className="text-slate-400 text-sm font-medium mb-12 max-w-sm mx-auto">Import data massal dari Excel untuk memperbarui status kelulusan siswa secara akurat.</p>
                      
                      <div className="border-4 border-dashed border-slate-100 rounded-[48px] p-12 mb-10 hover:border-amber-400 transition-all group cursor-pointer bg-slate-50/50 hover:bg-white relative overflow-hidden">
                         <label className="cursor-pointer block">
                            <input type="file" className="hidden" onChange={handleImportFile} accept=".xlsx,.xls" />
                            <div className="relative z-10">
                               <FileText size={48} className="mx-auto text-slate-200 group-hover:text-amber-400 transition-all mb-4 group-hover:scale-110" />
                               <p className="text-lg font-black text-slate-400 group-hover:text-slate-800 transition-colors uppercase tracking-widest leading-none">Pilih File Excel</p>
                               <p className="text-[10px] text-slate-300 font-bold mt-2 uppercase tracking-wide">Format: .xlsx, .xls (Maks: 10MB)</p>
                            </div>
                         </label>
                      </div>

                      <div className="bg-slate-50 rounded-3xl p-8 mb-10 text-left border border-slate-100">
                         <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <Database size={14} className="text-amber-500" />
                           Struktur Kolom Excel (Wajib):
                         </h4>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {['nisn', 'name', 'birth_place', 'birth_date', 'class', 'major', 'status'].map((col) => (
                               <div key={col} className="bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                                  <code className="text-[10px] font-black text-blue-600">{col}</code>
                               </div>
                            ))}
                         </div>
                         <p className="mt-4 text-[10px] text-slate-400 font-medium leading-relaxed italic">
                           * birth_place: Kota / Kabupaten kelahiran (mis. Wonogiri).<br/>
                           * birth_date: YYYY-MM-DD, DD/MM/YYYY, "26 Mei 2008" atau format Excel Date.<br/>
                           * major: Konsentrasi Keahlian (mis. Rekayasa Perangkat Lunak).<br/>
                           * status: 1 (Lulus), 0 (Belum Lulus).
                         </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <button className="gold-button w-full shadow-2xl shadow-slate-900/10">
                           MULAI PROSES IMPORT
                         </button>
                         <button className="w-full py-4 bg-slate-100 text-slate-500 rounded-[20px] font-black text-xs tracking-widest uppercase hover:bg-slate-200 transition-all border-b-4 border-slate-200 active:border-b-0">
                           DOWNLOAD TEMPLATE
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
                <div className="bg-white p-10 md:p-12 rounded-[40px] border border-slate-100 shadow-sm space-y-12">
                   {/* School Identity */}
                   <div className="grid lg:grid-cols-12 gap-12">
                      <div className="lg:col-span-4 space-y-6">
                        <div className="flex items-center gap-4 mb-4">
                           <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                              <Building2 size={24} />
                           </div>
                           <h3 className="text-xl font-black text-slate-800 tracking-tight">Identitas Sekolah</h3>
                        </div>
                        
                        <div className="space-y-4">
                           <div className="relative group">
                              <div className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden flex flex-col items-center justify-center transition-all group-hover:border-amber-400 group-hover:bg-white relative">
                                 {(logoPreview || schoolLogo) ? (
                                    <img 
                                      src={logoPreview || `/storage/${schoolLogo}`} 
                                      className="w-full h-full object-contain p-4" 
                                      alt="Preview Logo" 
                                    />
                                 ) : (
                                    <>
                                       <FileText size={32} className="text-slate-200 mb-2" />
                                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo Sekolah</p>
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
                              <p className="text-[9px] text-slate-400 font-bold mt-2 text-center uppercase tracking-widest">Klik untuk ganti logo</p>
                           </div>
                        </div>
                      </div>

                      <div className="lg:col-span-8 space-y-6">
                         <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Nama Sekolah</label>
                               <input 
                                 type="text"
                                 className="settings-input"
                                 value={schoolName}
                                 onChange={(e) => setSchoolName(e.target.value)}
                               />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">NPSN</label>
                               <input 
                                 type="text"
                                 className="settings-input"
                                 value={schoolNpsn}
                                 onChange={(e) => setSchoolNpsn(e.target.value)}
                               />
                            </div>
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Alamat Sekolah</label>
                            <textarea 
                              className="settings-input h-24 resize-none pt-4"
                              value={schoolAddress}
                              onChange={(e) => setSchoolAddress(e.target.value)}
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Nama Kepala Sekolah</label>
                            <input 
                              type="text"
                              className="settings-input"
                              value={principalName}
                              onChange={(e) => setPrincipalName(e.target.value)}
                            />
                         </div>
                      </div>
                   </div>

                   {/* Schedule */}
                   <div className="pt-12 border-t border-slate-100">
                      <div className="flex items-center gap-4 mb-8">
                         <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                            <Calendar size={24} />
                         </div>
                         <h3 className="text-xl font-black text-slate-800 tracking-tight">Jadwal & Preferensi</h3>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-8 mb-8">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Tanggal Rilis</label>
                            <input 
                              type="date"
                              className="settings-input"
                              value={announcementDate}
                              onChange={(e) => setAnnouncementDate(e.target.value)}
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Waktu (WIB)</label>
                            <input 
                              type="time"
                              className="settings-input"
                              value={announcementTime}
                              onChange={(e) => setAnnouncementTime(e.target.value)}
                            />
                         </div>
                      </div>
                       <div className="space-y-4">
                            <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[24px] border border-slate-100 hover:bg-white transition-all group">
                              <div className="flex items-center gap-4">
                                 <div className={`w-8 h-8 rounded-full ${maintenanceMode ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 text-slate-400'} flex items-center justify-center`}>
                                    {maintenanceMode ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                 </div>
                                 <div className="pr-4">
                                    <p className="text-sm font-black text-slate-800 group-hover:text-[#0f172a] transition-colors">Mode Perawatan (Maintenance)</p>
                                    <p className="text-[10px] font-bold text-slate-400">Nonaktifkan fitur pencarian untuk sementara.</p>
                                 </div>
                              </div>
                              <div 
                                onClick={() => setMaintenanceMode(!maintenanceMode)}
                                className={`w-12 h-6 ${maintenanceMode ? 'bg-emerald-500' : 'bg-slate-200'} rounded-full p-1 cursor-pointer transition-all flex items-center`}
                              >
                                 <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-all ${maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                              </div>
                           </div>
                      </div>
                   </div>

                   <button 
                    onClick={handleSaveSettings}
                    disabled={isLoading}
                    className="gold-button w-full shadow-2xl shadow-amber-500/20 active:translate-y-1 flex items-center justify-center gap-3"
                   >
                      {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                      SIMPAN SEMUA PERUBAHAN
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
                className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
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
                         <button type="submit" className="gold-button flex-1 shadow-lg shadow-amber-500/20 py-4">SIMPAN PERUBAHAN</button>
                         <button type="button" onClick={() => setEditStudent(null)} className="px-6 bg-slate-100 text-slate-500 rounded-[20px] font-black text-[10px] tracking-widest uppercase hover:bg-slate-200 transition-all">BATAL</button>
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
    <div className="min-h-screen flex flex-col bg-[#f8fafc] font-sans">
      {/* Official Header */}
      <header className="deep-blue-header text-white px-6 md:px-10 py-6 md:py-8 flex flex-col md:flex-row justify-between items-center shadow-2xl no-print border-b-4 border-[#fbbf24]">
        <div className="flex items-center gap-5 mb-4 md:mb-0">
          <div className="w-14 h-14 bg-white rounded-xl shadow-lg flex items-center justify-center transform rotate-3 overflow-hidden">
             {schoolInfo?.school_logo ? (
                <img src={schoolInfo.school_logo} className="w-full h-full object-contain p-2" alt="Logo" />
             ) : (
                <GraduationCap size={32} className="text-[#0f172a]" />
             )}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase leading-none">
              {schoolInfo?.school_name || "SMKN 1 WONOGIRI"}
            </h1>
            <p className="text-[10px] text-amber-400 uppercase tracking-[0.3em] font-black mt-1">Official Graduation Portal 2026</p>
          </div>
        </div>
        <div className="text-center md:text-right">
          <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-md border border-white/10">
            <p className="text-xs font-black uppercase tracking-widest flex items-center gap-2 justify-center md:justify-end">
              <Calendar size={12} className="text-amber-400" />
              Tahun Ajaran 2025/2026
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="search-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="official-card p-8 md:p-10"
              >
                {!isReady && !maintenanceMode ? (
                  <div className="text-center">
                    <div className="inline-flex p-4 md:p-6 bg-amber-50 rounded-[32px] text-amber-500 mb-8 transform -rotate-3">
                      <Calendar size={48} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-2">PENGUMUMAN SEGERA</h2>
                    <p className="text-slate-400 text-sm font-medium mb-12 italic uppercase tracking-widest">Silakan menunggu waktu rilis resmi</p>
                    
                    <div className="grid grid-cols-4 gap-3 md:gap-5 mb-12">
                      {[
                        { label: 'HARI', value: countdown.days },
                        { label: 'JAM', value: countdown.hours },
                        { label: 'MENIT', value: countdown.minutes },
                        { label: 'DETIK', value: countdown.seconds },
                      ].map((item, i) => (
                        <div key={i} className="bg-slate-50 p-3 md:p-5 rounded-2xl border border-slate-100 shadow-inner">
                          <p className="text-3xl md:text-5xl font-black text-[#0f172a] gold-pulse tracking-tighter">
                            {String(item.value).padStart(2, '0')}
                          </p>
                          <p className="text-[7px] md:text-[8px] font-black text-slate-400 tracking-[0.2em] mt-2">{item.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 bg-amber-500/5 rounded-3xl border border-amber-500/10">
                      <p className="text-[10px] font-bold text-amber-600 leading-relaxed uppercase tracking-[0.1em]">
                        Kunci akses formulir akan otomatis terbuka secara real-time<br/>saat hitung mundur tepat mencapai angka nol.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-10">
                      <div className="inline-flex p-3 bg-slate-50 rounded-full text-slate-400 mb-4">
                        <Search size={32} />
                      </div>
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Cek Hasil Kelulusan</h2>
                      <p className="text-slate-400 text-sm mt-2 font-medium">Lengkapi data di bawah ini untuk melihat status:</p>
                    </div>

                    <form onSubmit={handleSearchClick} className="space-y-6">
                      <div className={maintenanceMode ? 'opacity-50 pointer-events-none' : ''}>
                        <label htmlFor="search-input" className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-2 px-1">
                          Nomor Induk Siswa Nasional (NISN)
                        </label>
                        <input
                          type="text"
                          id="search-input"
                          className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-mono text-lg focus:border-[#fbbf24] focus:bg-white transition-all outline-none text-slate-800 placeholder:text-slate-300"
                          placeholder="0082918xxx"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          required
                          disabled={maintenanceMode}
                        />
                      </div>

                      <div className={maintenanceMode ? 'opacity-50 pointer-events-none' : ''}>
                        <label htmlFor="birth-date" className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-2 px-1">
                          Tanggal Lahir
                        </label>
                        <div className="relative">
                           <input
                            type="date"
                            id="birth-date"
                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-mono text-lg focus:border-[#fbbf24] focus:bg-white transition-all outline-none text-slate-800"
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
                        className={`w-full gold-button flex items-center justify-center gap-3 ${maintenanceMode ? 'opacity-50 shadow-none' : 'shadow-2xl shadow-amber-500/20'}`}
                      >
                        {isSearching ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            MEMPROSES...
                          </>
                        ) : (
                          maintenanceMode ? "SYSTEM LOCKED" : "LIHAT HASIL KELULUSAN"
                        )}
                      </button>
                    </form>

                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 rounded-xl bg-red-50 text-red-700 border border-red-100 flex items-center gap-3 font-bold text-[10px] uppercase tracking-wide"
                      >
                        <XCircle size={14} />
                        {error}
                      </motion.div>
                    )}

                    {maintenanceMode && (
                       <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-8 p-6 bg-slate-900 text-white rounded-3xl text-center shadow-2xl shadow-slate-200 border-b-4 border-amber-500"
                       >
                          <Settings size={28} className="mx-auto mb-3 text-amber-400 animate-spin-slow" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 mb-2">Maintenance Mode</p>
                          <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">Layanan sedang dalam pemeliharaan rutin oleh Tim IT Skansagiri.</p>
                       </motion.div>
                    )}
                  </>
                )}

                <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] leading-relaxed">
                    Created by: TIM IT SKANSAGIRI<br/>
                    Powered by: Joben Enterprise
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result-display"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* ----------------------------------------------------------
                    Official "Prestige" Result Card
                    Layout: Inline biodata (Tempat, Tanggal Lahir on one line)
                            + LULUS digital stamp over SKANSAGIRI watermark.
                    ---------------------------------------------------------- */}
                <div className="bg-white border-4 border-[#0f172a] rounded-2xl shadow-2xl overflow-hidden relative font-display">
                   {/* SKANSAGIRI watermark */}
                   <div className="watermark-text">SKANSAGIRI</div>

                   {/* Document header bar */}
                   <div className="bg-[#0f172a] text-white px-6 md:px-10 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 relative z-10">
                      <div className="flex items-center gap-3">
                        {schoolLogo ? (
                          <img
                            src={`/storage/${schoolLogo}`}
                            alt="Logo Sekolah"
                            className="w-9 h-9 object-contain bg-white rounded-md p-1"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-md bg-[#fbbf24] text-[#0f172a] flex items-center justify-center">
                            <GraduationCap size={20} strokeWidth={2.5} />
                          </div>
                        )}
                        <div className="leading-tight">
                          <p className="text-[9px] font-bold uppercase tracking-[0.32em] text-[#fbbf24]">
                            Surat Pengumuman Resmi
                          </p>
                          <p className="text-xs font-black uppercase tracking-widest">
                            Hasil Kelulusan Siswa
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-300">
                        TP. 2025 / 2026
                      </span>
                   </div>

                   <div className="p-8 md:p-12 relative z-10">
                     {/* Header: identity + photo */}
                     <div className="flex flex-col md:flex-row justify-between gap-8 mb-10">
                        <div className="flex-1 space-y-5">
                           <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#fbbf24] mb-1">
                                Nama Lengkap
                              </p>
                              <h3 className="font-display text-3xl md:text-4xl font-black text-slate-900 leading-tight uppercase tracking-tight">
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

                     <div className="mt-10 flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-100 items-center justify-between">
                        <div className="flex gap-4 w-full sm:w-auto order-2 sm:order-1">
                           <button className="flex-1 sm:flex-none bg-[#0f172a] text-white px-6 py-4 rounded-xl font-black text-xs tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                              <FileText size={16} />
                              UNDUH SKL DIGITAL
                           </button>
                           <button
                             onClick={() => setResult(null)}
                             className="px-8 bg-slate-100 text-slate-500 py-4 rounded-xl font-black text-xs tracking-widest hover:bg-slate-200 transition-all"
                           >
                             KEMBALI
                           </button>
                        </div>

                        <div className="text-right sm:text-right w-full sm:w-auto order-1 sm:order-2">
                           <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                             Created by: <span className="text-slate-700">TIM IT SKANSAGIRI</span>
                             <span className="mx-2 text-slate-300">|</span>
                             Powered by: <span className="text-[#0f172a]">Joben Enterprise</span>
                           </p>
                        </div>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Official Footer */}
      <footer className="px-6 md:px-10 py-8 bg-white border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
        <div className="flex flex-col md:flex-row items-center gap-6">
           <div className="text-center md:text-left">
              <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-relaxed mb-1">
                © 2026 {schoolInfo?.school_name || "SMKN 1 Wonogiri"}
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] leading-relaxed max-w-xs">
                {schoolInfo?.school_address || "Sistem Informasi Kelulusan Terintegrasi"}
              </p>
           </div>
           <button 
              onClick={() => setView('admin')}
              className="text-[9px] font-black uppercase text-slate-400 hover:text-[#fbbf24] transition-colors border border-slate-100 px-3 py-1 rounded-full flex items-center gap-2"
           >
             <LayoutDashboard size={10} />
             Portal Admin
           </button>
        </div>
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-[10px] font-black uppercase tracking-tighter">
          <div className="flex items-center gap-3 border-l-2 border-slate-100 pl-4">
            <span className="text-slate-300">Created by:</span>
            <span className="text-slate-700 tracking-normal underline decoration-[#fbbf24] decoration-2">TIM IT SKANSAGIRI</span>
          </div>
          <div className="flex items-center gap-3 border-l-2 border-slate-100 pl-4">
            <span className="text-slate-300">Powered by:</span>
            <span className="text-[#0f172a]">Joben Enterprise</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
