import { useState, useEffect, useCallback } from 'react';
import {
  Users, History, TrendingUp, DollarSign, ShoppingBag,
  UserPlus, LogOut, Coffee, RefreshCw, CheckCircle2,
  XCircle, Clock, ShieldCheck, ChevronRight, X, UtensilsCrossed, Plus, Trash2
} from 'lucide-react';
import api from '../utils/api';

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
  const [activeTab,    setActiveTab]    = useState('history'); // 'history' | 'employees' | 'menus'
  const [stats,        setStats]        = useState(null);
  const [history,      setHistory]      = useState([]);
  const [employees,    setEmployees]    = useState([]);
  const [menus,        setMenus]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [menuCatFilter,setMenuCatFilter]= useState('all');

  // Modal Tambah Karyawan
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [formData,      setFormData]      = useState({ name: '', email: '', password: '', role: 'cashier' });
  const [formLoading,   setFormLoading]   = useState(false);
  const [formError,     setFormError]     = useState('');

  // Modal Tambah Menu
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [menuForm,      setMenuForm]      = useState({ name: '', description: '', price: '', category: 'drink', image_url: '' });
  const [menuLoading,   setMenuLoading]   = useState(false);
  const [menuError,     setMenuError]     = useState('');

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

                  <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${emp.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                      {emp.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <span>Terdaftar: {formatDate(emp.created_at)}</span>
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

    </div>
  );
};

export default Manager;
