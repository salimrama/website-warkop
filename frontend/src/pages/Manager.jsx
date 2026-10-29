import { useState, useEffect, useCallback } from 'react';
import {
  Users, History, TrendingUp, DollarSign, ShoppingBag,
  UserPlus, LogOut, Coffee, RefreshCw, CheckCircle2,
  XCircle, Clock, ShieldCheck, ChevronRight, X, UtensilsCrossed, Plus, Trash2, KeyRound,
  BarChart3, CalendarDays, List, Copy
} from 'lucide-react';
import api from '../utils/api';
import Toast from '../components/Toast';
import ChangePasswordModal from '../components/ChangePasswordModal';

const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const Manager = () => {
  const [activeTab,    setActiveTab]    = useState('history'); // 'history' | 'statistics' | 'employees' | 'menus'
  const [stats,        setStats]        = useState(null);
  const [history,      setHistory]      = useState([]);
  const [employees,    setEmployees]    = useState([]);
  const [menus,        setMenus]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [menuCatFilter,setMenuCatFilter]= useState('all');
  const [statisticsFilters, setStatisticsFilters] = useState({
    date: '',
    startDate: '',
    endDate: '',
  });
  const [statisticsDateMode, setStatisticsDateMode] = useState('range');
  const [statisticsViewMode, setStatisticsViewMode] = useState('chart');
  const [statistics, setStatistics] = useState({
    summary: { total_revenue: 0, total_transactions: 0 },
    popularItems: { food: [], drink: [], snack: [] },
    peakHours: [],
    revenueTrend: [],
  });
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [statisticsError, setStatisticsError] = useState('');

  // Modal Tambah Karyawan
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [formData,      setFormData]      = useState({ name: '', email: '', password: '', role: 'cashier' });
  const [formLoading,   setFormLoading]   = useState(false);
  const [formError,     setFormError]     = useState('');
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Modal Tambah Menu
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [menuForm,      setMenuForm]      = useState({ name: '', description: '', price: '', category: 'drink', image_url: '' });
  const [menuLoading,   setMenuLoading]   = useState(false);
  const [menuError,     setMenuError]     = useState('');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Info user login
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('warkop_user')) || {}; }
    catch { return {}; }
  })();

  const handleLogout = () => {
    localStorage.removeItem('warkop_token');
    localStorage.removeItem('warkop_user');
    window.location.href = '/login';
  };

  // ── Fetch Data ─────────────────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const { data } = await api.get('/dashboard/stats');
      setStats(data.data);
    } catch (err) {
      console.error('Gagal fetch stats:', err);
    }
  };

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/history?status=${filterStatus}`);
      setHistory(data.data || []);
    } catch (err) {
      console.error('Gagal fetch history:', err);
    }
  }, [filterStatus]);

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/users');
      setEmployees(data.data || []);
    } catch (err) {
      console.error('Gagal fetch users:', err);
    }
  };

  const fetchMenus = useCallback(async () => {
    try {
      const { data } = await api.get('/menus?all=1');
      setMenus(data.data || []);
    } catch (err) {
      console.error('Gagal fetch menus:', err);
    }
  }, []);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchHistory(), fetchEmployees(), fetchMenus()]);
    setLoading(false);
  }, [fetchHistory, fetchMenus]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  useEffect(() => {
    if (activeTab !== 'statistics') return undefined;

    if (
      statisticsDateMode === 'range' &&
      statisticsFilters.startDate &&
      statisticsFilters.endDate &&
      statisticsFilters.startDate > statisticsFilters.endDate
    ) {
      setStatisticsError('Tanggal awal tidak boleh melewati tanggal akhir.');
      setStatisticsLoading(false);
      setStatistics({
        summary: { total_revenue: 0, total_transactions: 0 },
        popularItems: { food: [], drink: [], snack: [] },
        peakHours: [],
        revenueTrend: [],
      });
      return undefined;
    }

    let isMounted = true;
    const fetchStatistics = async () => {
      setStatisticsLoading(true);
      setStatisticsError('');
      const params = new URLSearchParams();
      const activeFilters = statisticsDateMode === 'range'
        ? { startDate: statisticsFilters.startDate, endDate: statisticsFilters.endDate }
        : { date: statisticsFilters.date };
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      const query = params.toString();
      const suffix = query ? `?${query}` : '';

      try {
        const [summaryResponse, popularItemsResponse, peakHoursResponse, revenueTrendResponse] = await Promise.all([
          api.get(`/statistics/summary${suffix}`),
          api.get(`/statistics/popular-items${suffix}`),
          api.get(`/statistics/peak-hours${suffix}`),
          api.get(`/statistics/revenue-trend${suffix}`),
        ]);
        if (!isMounted) return;
        setStatistics({
          summary: summaryResponse.data.data,
          popularItems: popularItemsResponse.data.data,
          peakHours: peakHoursResponse.data.data,
          revenueTrend: revenueTrendResponse.data.data,
        });
      } catch (err) {
        if (!isMounted) return;
        console.error('Gagal memuat statistik:', err);
        setStatisticsError(err?.response?.data?.message || 'Gagal memuat statistik. Coba lagi.');
        setStatistics({
          summary: { total_revenue: 0, total_transactions: 0 },
          popularItems: { food: [], drink: [], snack: [] },
          peakHours: [],
          revenueTrend: [],
        });
      } finally {
        if (isMounted) setStatisticsLoading(false);
      }
    };

    fetchStatistics();
    return () => { isMounted = false; };
  }, [activeTab, statisticsDateMode, statisticsFilters]);

  const handleCopyStatistics = async () => {
    const categoryNames = { food: 'Makanan', drink: 'Minuman', snack: 'Cemilan' };
    const lines = [
      'STATISTIK & LAPORAN WARKOP',
      `Filter\t${statisticsDateMode === 'range'
        ? `${statisticsFilters.startDate || 'Awal'} s.d. ${statisticsFilters.endDate || 'Akhir'}`
        : statisticsFilters.date || 'Semua periode'}`,
      `Total Pendapatan\t${formatRupiah(statistics.summary.total_revenue)}`,
      `Total Transaksi Selesai\t${statistics.summary.total_transactions}`,
      '',
      'MENU TERLARIS',
      'Kategori\tMenu\tJumlah Terjual',
    ];

    Object.entries(categoryNames).forEach(([key, name]) => {
      (statistics.popularItems[key] || []).forEach((item) => {
        lines.push(`${name}\t${item.name}\t${item.quantity_sold}`);
      });
    });

    lines.push(
      '',
      'TRANSAKSI SELESAI PER JAM',
      'Jam\tJumlah Transaksi\tTotal Item\tMakanan\tMinuman\tCemilan\tRincian Item'
    );
    statistics.peakHours
      .filter(({ hour }) => hour >= 6 && hour <= 23)
      .forEach(({ hour, jumlahTransaksi, totalItem, makanan, minuman, cemilan, detailItems }) => {
        const itemSummary = (detailItems || [])
          .map((item) => `${item.nama} (${item.qty})`)
          .join(', ');
        lines.push(`${String(hour).padStart(2, '0')}:00\t${jumlahTransaksi}\t${totalItem}\t${makanan}\t${minuman}\t${cemilan}\t${itemSummary}`);
      });
    lines.push('', 'TREN PENDAPATAN', 'Tanggal\tPendapatan\tTransaksi');
    statistics.revenueTrend.forEach((entry) => {
      lines.push(`${entry.date}\t${formatRupiah(entry.total_revenue)}\t${entry.total_transactions}`);
    });

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setToast({ message: 'Data berhasil disalin!', type: 'success' });
    } catch (err) {
      console.error('Gagal menyalin data statistik:', err);
      setToast({ message: 'Gagal menyalin data. Periksa izin clipboard browser.', type: 'error' });
    }
  };

  // ── Tambah Karyawan ────────────────────────────────────────────────────────
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name || !formData.email || !formData.password) {
      setFormError('Semua field wajib diisi.');
      return;
    }

    setFormLoading(true);
    try {
      await api.post('/users', formData);
      setIsAddUserOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'cashier' });
      fetchEmployees();
      fetchStats();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Gagal menambahkan karyawan.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    setDeleteLoading(true);
    setDeleteError('');
    try {
      await api.delete(`/users/${employeeToDelete.id}`);
      setEmployees((prev) => prev.filter((employee) => employee.id !== employeeToDelete.id));
      setEmployeeToDelete(null);
      fetchStats();
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Gagal menghapus karyawan.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Tambah Menu ────────────────────────────────────────────────────────────
  const handleCreateMenu = async (e) => {
    e.preventDefault();
    setMenuError('');
    if (!menuForm.name || !menuForm.price) {
      setMenuError('Nama menu dan harga wajib diisi.');
      return;
    }

    setMenuLoading(true);
    try {
      await api.post('/menus', menuForm);
      setIsAddMenuOpen(false);
      setMenuForm({ name: '', description: '', price: '', category: 'drink', image_url: '' });
      fetchMenus();
    } catch (err) {
      setMenuError(err?.response?.data?.message || 'Gagal menambahkan menu.');
    } finally {
      setMenuLoading(false);
    }
  };

  // ── Hapus Menu ─────────────────────────────────────────────────────────────
  const handleDeleteMenu = async (id, name) => {
    if (!window.confirm(`Hapus menu "${name}"?`)) return;
    try {
      await api.delete(`/menus/${id}`);
      fetchMenus();
    } catch (err) {
      alert(err?.response?.data?.message || 'Gagal menghapus menu.');
    }
  };

  const filteredMenus = menuCatFilter === 'all'
    ? menus
    : menus.filter((m) => m.category === menuCatFilter);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {isChangePasswordOpen && (
        <ChangePasswordModal
          onClose={() => setIsChangePasswordOpen(false)}
          onSuccess={(message) => {
            setIsChangePasswordOpen(false);
            setToast({ message, type: 'success' });
          }}
        />
      )}

      {/* ── Top Navbar ── */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Coffee className="text-white" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg text-white">Warkop Admin</h1>
                <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Manager
                </span>
              </div>
              <p className="text-xs text-slate-400">Selamat bekerja, {currentUser.name || 'Manajer'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsChangePasswordOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-300 transition-all hover:bg-amber-500/20"
              title="Ganti Password"
            >
              <KeyRound size={14} />
              <span className="hidden sm:inline">Ganti Password</span>
            </button>
            <button
              onClick={reloadAll}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 space-y-8">

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Omset Hari Ini</span>
              <div className="p-2 rounded-xl bg-green-500/10 text-green-400"><DollarSign size={16} /></div>
            </div>
            <p className="text-2xl font-black text-white">{formatRupiah(stats?.revenue_today || 0)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Total: {formatRupiah(stats?.total_revenue || 0)}</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Pesanan Hari Ini</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400"><ShoppingBag size={16} /></div>
            </div>
            <p className="text-2xl font-black text-white">{stats?.orders_today || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Total: {stats?.total_orders || 0} transaksi</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Menu</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400"><UtensilsCrossed size={16} /></div>
            </div>
            <p className="text-2xl font-black text-white">{menus.length}</p>
            <p className="text-[11px] text-slate-400 mt-1">Minuman, makanan & camilan</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Karyawan</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400"><Users size={16} /></div>
            </div>
            <p className="text-2xl font-black text-white">{stats?.total_employees || 0}</p>
            <p className="text-[11px] text-slate-400 mt-1">Akun aktif</p>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="flex border-b border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History size={18} />
            Riwayat Pesanan
          </button>
          <button
            onClick={() => setActiveTab('menus')}
            className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'menus'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UtensilsCrossed size={18} />
            Kelola Menu ({menus.length})
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'statistics'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 size={18} />
            Statistik & Laporan
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-2 pb-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'employees'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={18} />
            Kelola Karyawan
          </button>
        </div>

        {activeTab === 'statistics' && (
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-amber-400" />
              <h2 className="text-base font-bold text-white">Filter Periode Laporan</h2>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-700/60 bg-slate-800/80 p-4 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-300">
                Jenis filter tanggal
                <select
                  value={statisticsDateMode}
                  onChange={(event) => setStatisticsDateMode(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                >
                  <option value="specific">Tanggal spesifik</option>
                  <option value="range">Rentang tanggal</option>
                </select>
              </label>
              {statisticsDateMode === 'specific' ? (
                <label className="text-xs font-semibold text-slate-300">
                  Pilih Tanggal
                  <input
                    type="date"
                    value={statisticsFilters.date}
                    onChange={(event) => setStatisticsFilters((prev) => ({
                      ...prev,
                      date: event.target.value,
                    }))}
                    className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                  />
                </label>
              ) : (
                <>
                  <label className="text-xs font-semibold text-slate-300">
                    Dari tanggal
                    <input
                      type="date"
                      value={statisticsFilters.startDate}
                      onChange={(event) => setStatisticsFilters((prev) => ({
                        ...prev,
                        startDate: event.target.value,
                      }))}
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-300">
                    Sampai tanggal
                    <input
                      type="date"
                      value={statisticsFilters.endDate}
                      onChange={(event) => setStatisticsFilters((prev) => ({
                        ...prev,
                        endDate: event.target.value,
                      }))}
                      className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                    />
                  </label>
                </>
              )}
            </div>

            {statisticsDateMode === 'range' && statisticsFilters.startDate && statisticsFilters.endDate &&
              statisticsFilters.startDate > statisticsFilters.endDate && (
                <p role="alert" className="text-sm text-red-400">
                  Tanggal awal tidak boleh melewati tanggal akhir.
                </p>
            )}
            {statisticsError && (
              <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {statisticsError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2 rounded-xl border border-slate-700 bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setStatisticsViewMode('chart')}
                  aria-pressed={statisticsViewMode === 'chart'}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                    statisticsViewMode === 'chart'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <BarChart3 size={14} /> Tampilan Grafik
                </button>
                <button
                  type="button"
                  onClick={() => setStatisticsViewMode('list')}
                  aria-pressed={statisticsViewMode === 'list'}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                    statisticsViewMode === 'list'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <List size={14} /> List Catatan
                </button>
              </div>
              {statisticsViewMode === 'list' && (
                <button
                  type="button"
                  onClick={handleCopyStatistics}
                  disabled={statisticsLoading || Boolean(statisticsError)}
                  className="flex items-center gap-2 rounded-xl bg-green-500/15 px-3.5 py-2.5 text-xs font-bold text-green-300 transition-colors hover:bg-green-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Copy size={14} /> Salin Data
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-700/60 bg-slate-800/80 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Pendapatan</p>
                <p className="mt-2 text-2xl font-black text-green-400">
                  {statisticsLoading ? 'Memuat...' : formatRupiah(statistics.summary.total_revenue)}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-700/60 bg-slate-800/80 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Transaksi Selesai</p>
                <p className="mt-2 text-2xl font-black text-amber-400">
                  {statisticsLoading ? 'Memuat...' : statistics.summary.total_transactions}
                </p>
              </div>
            </div>

            {statisticsViewMode === 'chart' ? (
              <>
            {statisticsDateMode === 'range' && (
            <div className="rounded-3xl border border-slate-700/60 bg-slate-800/80 p-5">
              <h3 className="font-bold text-white">Tren Pendapatan Harian</h3>
              <p className="mb-5 mt-1 text-xs text-slate-400">
                {statisticsFilters.date ||
                  statisticsFilters.startDate || statisticsFilters.endDate
                  ? 'Pendapatan dari pesanan selesai pada periode terpilih'
                  : 'Pendapatan 30 hari terakhir'}
              </p>
              {statisticsLoading ? (
                <p className="text-sm text-slate-500">Memuat...</p>
              ) : statistics.revenueTrend.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada data pendapatan.</p>
              ) : (
                <div className="flex h-56 items-end gap-1 overflow-x-auto border-b border-slate-700 pb-2">
                  {statistics.revenueTrend.map((entry) => {
                    const maxRevenue = Math.max(1, ...statistics.revenueTrend.map((item) => item.total_revenue));
                    return (
                      <div key={entry.date} className="flex h-full min-w-8 flex-1 flex-col items-center justify-end gap-1">
                        <div
                          className="w-full rounded-t-md bg-green-500"
                          style={{ height: `${Math.max(entry.total_revenue ? 5 : 1, (entry.total_revenue / maxRevenue) * 75)}%` }}
                          title={`${entry.date}: ${formatRupiah(entry.total_revenue)} (${entry.total_transactions} transaksi)`}
                        />
                        <span className="text-[9px] text-slate-500">
                          {entry.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {[
                { key: 'food', title: 'Top Makanan', icon: '🍜' },
                { key: 'drink', title: 'Top Minuman', icon: '☕' },
                { key: 'snack', title: 'Top Cemilan', icon: '🍪' },
              ].map((category) => {
                const items = statistics.popularItems[category.key] || [];
                const maxSold = Math.max(1, ...items.map((item) => item.quantity_sold));
                return (
                  <div key={category.key} className="rounded-3xl border border-slate-700/60 bg-slate-800/80 p-5">
                    <h3 className="mb-4 font-bold text-white">{category.icon} {category.title}</h3>
                    {statisticsLoading ? (
                      <p className="text-sm text-slate-500">Memuat...</p>
                    ) : items.length === 0 ? (
                      <p className="text-sm text-slate-500">Belum ada data penjualan.</p>
                    ) : (
                      <div className="space-y-4">
                        {items.map((item, index) => (
                          <div key={item.id}>
                            <div className="mb-1 flex justify-between gap-2 text-xs">
                              <span className="truncate text-slate-200">{index + 1}. {item.name}</span>
                              <span className="shrink-0 font-bold text-amber-400">{item.quantity_sold} terjual</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                              <div
                                className="h-full rounded-full bg-amber-500"
                                style={{ width: `${(item.quantity_sold / maxSold) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="rounded-3xl border border-slate-700/60 bg-slate-800/80 p-5">
              <div className="mb-5 flex items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-white">Jam Sibuk</h3>
                  <p className="mt-1 text-xs text-slate-400">Jumlah transaksi selesai menurut jam pemesanan</p>
                </div>
                {statisticsLoading && <span className="text-xs text-slate-400">Memuat...</span>}
              </div>
              <div className="flex h-56 items-end gap-1 overflow-x-auto border-b border-slate-700 pb-2">
                {statistics.peakHours.filter(({ hour }) => hour >= 6 && hour <= 23).map((entry) => {
                  const { hour, transaction_count, jumlahTransaksi, totalItem, makanan, minuman, cemilan, detailItems } = entry;
                  const peak = Math.max(1, ...statistics.peakHours.map((entry) => entry.transaction_count));
                  const tooltip = [
                    `Jam: ${String(hour).padStart(2, '0')}:00`,
                    '-------------------------',
                    `Total Transaksi : ${jumlahTransaksi}`,
                    `Total Item      : ${totalItem}`,
                    '-------------------------',
                    `🍔 Makanan Terjual : ${makanan}`,
                    `🥤 Minuman Terjual : ${minuman}`,
                    `🍟 Cemilan Terjual : ${cemilan}`,
                    '',
                    'Rincian Item:',
                    ...(detailItems || []).map((item) => `- ${item.nama} (${item.qty})`),
                  ].join('\n');
                  return (
                    <div key={hour} className="flex h-full min-w-11 flex-1 flex-col items-center justify-end gap-1">
                      <span className="text-[9px] text-slate-400">
                        {transaction_count || ''}
                      </span>
                      <button
                        type="button"
                        className={`w-full rounded-t-md ${transaction_count ? 'bg-amber-500' : 'bg-slate-700'}`}
                        style={{ height: `${Math.max(transaction_count ? 5 : 1, (transaction_count / peak) * 75)}%` }}
                        title={tooltip}
                        aria-label={tooltip}
                        tabIndex={0}
                      />
                      <span className="text-[9px] text-slate-500">
                        {hour % 3 === 0 || hour === 23 ? `${String(hour).padStart(2, '0')}:00` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
              {!statisticsLoading && statistics.peakHours.length > 0 &&
                !statistics.peakHours.some(({ hour, transaction_count }) => hour >= 6 && hour <= 23 && transaction_count > 0) && (
                  <p className="mt-3 text-center text-xs text-slate-500">
                    Belum ada transaksi selesai pada periode ini.
                  </p>
              )}
            </div>
              </>
            ) : (
              <div className="space-y-5">
                <div className="overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-800/80">
                  <h3 className="border-b border-slate-700 px-5 py-4 font-bold text-white">Tren Pendapatan Harian</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900/60 text-xs uppercase text-slate-400">
                        <tr>
                          <th className="px-5 py-3">Tanggal</th>
                          <th className="px-5 py-3">Pendapatan</th>
                          <th className="px-5 py-3">Transaksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {statisticsLoading ? (
                          <tr><td colSpan="3" className="px-5 py-4 text-slate-500">Memuat...</td></tr>
                        ) : statistics.revenueTrend.length === 0 ? (
                          <tr><td colSpan="3" className="px-5 py-4 text-slate-500">Belum ada data pendapatan.</td></tr>
                        ) : statistics.revenueTrend.map((entry) => (
                          <tr key={entry.date}>
                            <td className="px-5 py-3 text-slate-200">{entry.date}</td>
                            <td className="px-5 py-3 font-bold text-green-400">{formatRupiah(entry.total_revenue)}</td>
                            <td className="px-5 py-3 text-slate-300">{entry.total_transactions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {[
                  { key: 'food', title: 'Top Makanan' },
                  { key: 'drink', title: 'Top Minuman' },
                  { key: 'snack', title: 'Top Cemilan' },
                ].map((category) => {
                  const items = statistics.popularItems[category.key] || [];
                  return (
                    <div key={category.key} className="overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-800/80">
                      <h3 className="border-b border-slate-700 px-5 py-4 font-bold text-white">{category.title}</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-900/60 text-xs uppercase text-slate-400">
                            <tr>
                              <th className="px-5 py-3">#</th>
                              <th className="px-5 py-3">Nama Menu</th>
                              <th className="px-5 py-3">Jumlah Terjual</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700/50">
                            {statisticsLoading ? (
                              <tr><td colSpan="3" className="px-5 py-4 text-slate-500">Memuat...</td></tr>
                            ) : items.length === 0 ? (
                              <tr><td colSpan="3" className="px-5 py-4 text-slate-500">Belum ada data penjualan.</td></tr>
                            ) : items.map((item, index) => (
                              <tr key={item.id}>
                                <td className="px-5 py-3 text-slate-400">{index + 1}</td>
                                <td className="px-5 py-3 font-medium text-slate-200">{item.name}</td>
                                <td className="px-5 py-3 font-bold text-amber-400">{item.quantity_sold}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}

                <div className="overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-800/80">
                  <h3 className="border-b border-slate-700 px-5 py-4 font-bold text-white">Transaksi Selesai per Jam</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-900/60 text-xs uppercase text-slate-400">
                        <tr>
                          <th className="px-5 py-3">Jam</th>
                          <th className="px-5 py-3">Jumlah Transaksi</th>
                          <th className="px-5 py-3">Total Item Terjual</th>
                          <th className="px-5 py-3">Ringkasan Kategori</th>
                          <th className="px-5 py-3">Rincian Item</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {statisticsLoading ? (
                          <tr><td colSpan="5" className="px-5 py-4 text-slate-500">Memuat...</td></tr>
                        ) : statistics.peakHours.filter(({ hour }) => hour >= 6 && hour <= 23).map((entry) => (
                          <tr key={entry.hour} className="align-top">
                            <td className="px-5 py-3 text-slate-200">{entry.jam}</td>
                            <td className="px-5 py-3 font-bold text-amber-400">{entry.jumlahTransaksi}</td>
                            <td className="px-5 py-3 font-bold text-amber-400">{entry.totalItem}</td>
                            <td className="px-5 py-3">
                              <div className="flex min-w-48 flex-col gap-1">
                                <span className="text-xs text-slate-300">🍔 Makanan: {entry.makanan}</span>
                                <span className="text-xs text-slate-300">🥤 Minuman: {entry.minuman}</span>
                                <span className="text-xs text-slate-300">🍟 Cemilan: {entry.cemilan}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-slate-300">
                              {entry.detailItems.length ? (
                                <ul className="flex min-w-40 flex-col gap-1">
                                  {entry.detailItems.map((item) => (
                                    <li key={item.id} className="text-xs">
                                      <span className="rounded-md bg-slate-700 px-2 py-1">{item.nama}: {item.qty}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── TAB 1: Order History ── */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-2">
                {[
                  { key: 'all',       label: 'Semua Status' },
                  { key: 'completed', label: '✅ Selesai'    },
                  { key: 'cancelled', label: '❌ Dibatalkan'  },
                ].map((btn) => (
                  <button
                    key={btn.key}
                    onClick={() => setFilterStatus(btn.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      filterStatus === btn.key
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-400">{history.length} transaksi tercatat</span>
            </div>

            {/* Table */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900/60 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700/60">
                    <tr>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Meja</th>
                      <th className="px-6 py-4">Total Item</th>
                      <th className="px-6 py-4">Total Bayar</th>
                      <th className="px-6 py-4">Sumber</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="text-center py-12 text-slate-500">Memuat riwayat transaksi...</td>
                      </tr>
                    ) : history.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-12 text-slate-500">Belum ada riwayat transaksi.</td>
                      </tr>
                    ) : (
                      history.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-700/20 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-amber-400">#{order.id}</td>
                          <td className="px-6 py-4 font-semibold text-white">Meja {order.table_number}</td>
                          <td className="px-6 py-4 text-slate-300">{order.item_count} menu</td>
                          <td className="px-6 py-4 font-bold text-white">{formatRupiah(order.total_price)}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-300">
                              {order.source === 'customer' ? '📱 Pelanggan' : '🖥️ Kasir'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              order.status === 'completed'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : order.status === 'cancelled'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">{formatDate(order.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: Menu Management ── */}
        {activeTab === 'menus' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                {[
                  { key: 'all',   label: 'Semua Menu' },
                  { key: 'drink', label: '☕ Minuman'  },
                  { key: 'food',  label: '🍜 Makanan'  },
                  { key: 'snack', label: '🍪 Camilan'  },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setMenuCatFilter(cat.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      menuCatFilter === cat.key
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsAddMenuOpen(true)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-2xl text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <Plus size={16} />
                Tambah Menu Baru
              </button>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMenus.map((menu) => (
                <div key={menu.id} className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 flex flex-col justify-between space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                      {menu.image_url ? (
                        <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">
                          {menu.category === 'drink' ? '☕' : menu.category === 'food' ? '🍜' : '🍪'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                          {menu.category}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          menu.is_available ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {menu.is_available ? 'Tersedia' : 'Habis'}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-base truncate mt-0.5">{menu.name}</h3>
                      <p className="text-amber-400 font-extrabold text-sm mt-1">{formatRupiah(menu.price)}</p>
                      {menu.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">{menu.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700/60 flex items-center justify-end">
                    <button
                      onClick={() => handleDeleteMenu(menu.id, menu.name)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                      title="Hapus Menu"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: Employee Management ── */}
        {activeTab === 'employees' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Daftar Akun Karyawan</h2>
                <p className="text-xs text-slate-400">Kelola akun kasir dan manajer yang memiliki akses sistem</p>
              </div>
              <button
                onClick={() => setIsAddUserOpen(true)}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-2xl text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <UserPlus size={16} />
                Tambah Karyawan
              </button>
            </div>

            {/* Employee Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((emp) => (
                <div key={emp.id} className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-5 flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base text-white">{emp.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{emp.email}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      emp.role === 'manager'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {emp.role}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2 text-xs text-slate-400">
                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${emp.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                        {emp.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                      <span className="block">Terdaftar: {formatDate(emp.created_at)}</span>
                    </div>
                    {Number(emp.id) !== Number(currentUser.id) && (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError('');
                          setEmployeeToDelete(emp);
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-2 font-bold text-red-400 transition-colors hover:bg-red-500/20"
                        aria-label={`Pecat ${emp.name}`}
                      >
                        <Trash2 size={14} />
                        Pecat
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── Modal Tambah Menu Baru ── */}
      {isAddMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
              <h3 className="font-bold text-base text-white">Tambah Menu Baru</h3>
              <button
                onClick={() => setIsAddMenuOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {menuError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                {menuError}
              </div>
            )}

            <form onSubmit={handleCreateMenu} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nama Menu</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kopi Susu Aren"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Kategori</label>
                  <select
                    value={menuForm.category}
                    onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="drink">Minuman (Drink)</option>
                    <option value="food">Makanan (Food)</option>
                    <option value="snack">Camilan (Snack)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="12000"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows="2"
                  placeholder="Contoh: Kopi robusta pekat dengan susu manis legit"
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">URL Gambar (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={menuForm.image_url}
                  onChange={(e) => setMenuForm({ ...menuForm, image_url: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMenuOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={menuLoading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  {menuLoading ? 'Menyimpan...' : 'Simpan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Tambah Karyawan ── */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
              <h3 className="font-bold text-base text-white">Tambah Karyawan Baru</h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="budi@warkop.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Peran / Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="cashier">Kasir (Cashier)</option>
                  <option value="manager">Manajer (Manager)</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Karyawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {employeeToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          role="presentation"
        >
          <div
            className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-employee-title"
          >
            <h3 id="delete-employee-title" className="font-bold text-base text-white">
              Pecat Karyawan
            </h3>
            <p className="mt-3 text-sm text-slate-300">
              Apakah Anda yakin ingin memecat karyawan ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              {employeeToDelete.name} ({employeeToDelete.email})
            </p>
            {deleteError && (
              <p role="alert" className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                {deleteError}
              </p>
            )}
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setEmployeeToDelete(null)}
                disabled={deleteLoading}
                className="flex-1 rounded-xl bg-slate-700 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-600 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteEmployee}
                disabled={deleteLoading}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deleteLoading ? 'Menghapus...' : 'Ya, Pecat'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Manager;
