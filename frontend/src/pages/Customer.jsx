import { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingCart, Coffee, RefreshCw, MapPin, User } from 'lucide-react';
import { Link } from 'react-router-dom';

import api             from '../utils/api';
import Toast           from '../components/Toast';
import { io }          from 'socket.io-client';
import { SOCKET_BASE_URL } from '../utils/config';
import TableSelector   from '../components/TableSelector';
import MenuCard        from '../components/MenuCard';
import CartSidebar     from '../components/CartSidebar';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'all',   label: 'Semua',   emoji: '🍽️' },
  { value: 'drink', label: 'Minuman', emoji: '☕' },
  { value: 'food',  label: 'Makanan', emoji: '🍜' },
  { value: 'snack', label: 'Camilan', emoji: '🍪' },
];

// ─── Helper ───────────────────────────────────────────────────────────────────
const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

// ─── Component ────────────────────────────────────────────────────────────────
const Customer = () => {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [tables,        setTables]        = useState([]);
  const [menus,         setMenus]         = useState([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [loadingMenus,  setLoadingMenus]  = useState(true);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [selectedTable,  setSelectedTable]  = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart,           setCart]           = useState([]);       // [{menu_id, name, price, quantity}]
  const [isCartOpen,     setIsCartOpen]     = useState(false);
  const [isCheckingOut,  setIsCheckingOut]  = useState(false);
  const [showSuccess,    setShowSuccess]    = useState(false);     // modal sukses checkout
  const [showUnlockNotice, setShowUnlockNotice] = useState(false); // modal notif buka kunci dari kasir
  const [isRestoringTable, setIsRestoringTable] = useState(true);
  const [toast,          setToast]          = useState(null);     // {message, type}
  const endedTableIdsRef = useRef(new Set());

  const resetCustomerTableSession = () => {
    localStorage.removeItem('selected_table');
    localStorage.removeItem('is_table_locked');
    setSelectedTable(null);
    setCart([]);
    setIsCartOpen(false);
    setShowSuccess(false);
    setShowUnlockNotice(true);
    fetchTables();
    setToast({
      message: 'Sesi meja telah diakhiri. Terima kasih atas kunjungan Anda.',
      type: 'success',
    });
  };

  // ── Fetch data ───────────────────────────────────────────────────────────────
  const fetchTables = useCallback(async () => {
    setLoadingTables(true);
    try {
      const { data } = await api.get('/tables');
      setTables(data.data || []);
    } catch {
      showToast('Gagal memuat data meja. Coba refresh halaman.', 'error');
    } finally {
      setLoadingTables(false);
    }
  }, []);

  const fetchMenus = useCallback(async () => {
    setLoadingMenus(true);
    try {
      const { data } = await api.get('/menus');
      setMenus(data.data || []);
    } catch {
      showToast('Gagal memuat data menu. Coba refresh halaman.', 'error');
    } finally {
      setLoadingMenus(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
    fetchMenus();
  }, [fetchTables, fetchMenus]);

  // Restore a saved table only while its server-side session remains active.
  useEffect(() => {
    let isMounted = true;

    try {
      const saved = localStorage.getItem('selected_table');
      if (!saved) {
        setIsRestoringTable(false);
        return () => { isMounted = false; };
      }

      const savedTable = JSON.parse(saved);
      if (!savedTable?.id) {
        localStorage.removeItem('selected_table');
        localStorage.removeItem('is_table_locked');
        setIsRestoringTable(false);
        return () => { isMounted = false; };
      }

      api.get(`/tables/${savedTable.id}/status`)
        .then(({ data }) => {
          if (!isMounted) return;
          const currentTable = data.data;
          if (
            currentTable?.status === 'occupied' &&
            !endedTableIdsRef.current.has(String(currentTable.id))
          ) {
            setSelectedTable(currentTable);
            return;
          }
          resetCustomerTableSession();
        })
        .catch((err) => {
          if (!isMounted) return;
          if (err?.response?.status === 404) {
            resetCustomerTableSession();
            return;
          }
          console.error('Gagal memvalidasi sesi meja:', err);
          setToast({
            message: 'Status meja tidak dapat diperiksa. Silakan pilih meja kembali.',
            type: 'error',
          });
        })
        .finally(() => {
          if (isMounted) setIsRestoringTable(false);
        });
    } catch {
      localStorage.removeItem('selected_table');
      localStorage.removeItem('is_table_locked');
      setIsRestoringTable(false);
    }

    return () => { isMounted = false; };
  }, []);

  // Reset a matching customer session as soon as the cashier ends it.
  useEffect(() => {
    const socket = io(SOCKET_BASE_URL, { transports: ['websocket', 'polling'] });

    const handleTableSessionEnded = ({ tableId }) => {
      endedTableIdsRef.current.add(String(tableId));
      try {
        const savedTable = JSON.parse(localStorage.getItem('selected_table') || 'null');
        if (Number(savedTable?.id) === Number(tableId)) resetCustomerTableSession();
      } catch {
        resetCustomerTableSession();
      }
    };

    socket.on('table_session_ended', handleTableSessionEnded);
    socket.on('order_completed', ({ table_id }) => {
      try {
        const savedTable = JSON.parse(localStorage.getItem('selected_table') || 'null');
        if (Number(savedTable?.id) === Number(table_id)) {
          showToast('Pesanan telah diantar. Silakan pesan lagi jika diperlukan.', 'success');
        }
      } catch (err) {
        console.error('Gagal membaca sesi meja saat pesanan selesai:', err);
      }
    });
    return () => socket.disconnect();
  }, []);

  // ── Toast helper ─────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => setToast({ message, type });
  const closeToast = () => setToast(null);

  // ── Cart logic ───────────────────────────────────────────────────────────────
  const getQuantity = (menuId) => cart.find((i) => i.menu_id === menuId)?.quantity ?? 0;

  const addToCart = (menu) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menu_id === menu.id);
      if (existing) {
        return prev.map((i) =>
          i.menu_id === menu.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, {
        menu_id:  menu.id,
        name:     menu.name,
        price:    parseFloat(menu.price),
        quantity: 1,
        category: menu.category,
      }];
    });
  };

  const removeFromCart = (menuId) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menu_id === menuId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((i) => i.menu_id !== menuId);
      return prev.map((i) => i.menu_id === menuId ? { ...i, quantity: i.quantity - 1 } : i);
    });
  };

  const clearCart = () => setCart([]);

  // ── Table selection persistence ─────────────────────────────────────────────
  const handleSelectTable = (table) => {
    setSelectedTable(table);
    try {
      localStorage.setItem('selected_table', JSON.stringify(table));
      localStorage.setItem('is_table_locked', 'true');
    } catch {
      // ignore storage errors
    }
  };

  // ── Checkout ─────────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!selectedTable) {
      showToast('Pilih nomor meja terlebih dahulu!', 'error');
      return;
    }
    if (cart.length === 0) {
      showToast('Keranjang masih kosong!', 'error');
      return;
    }

    setIsCheckingOut(true);
    try {
      await api.post('/orders', {
        table_id: selectedTable.id,
        items: cart.map(({ menu_id, quantity }) => ({ menu_id, quantity })),
      });

      // ── Sukses ──────────────────────────────────────────────────────────────
      clearCart();
      setIsCartOpen(false);
      // Keep selected_table persisted so customer can order again
      setShowSuccess(true);
      showToast(`🎉 Pesanan Meja ${selectedTable.table_number} berhasil dikirim! Silakan tunggu.`, 'success');
      fetchTables(); // Refresh status meja
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gagal membuat pesanan. Coba lagi.';
      showToast(msg, 'error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // ── Filtered menus ───────────────────────────────────────────────────────────
  const filteredMenus = activeCategory === 'all'
    ? menus
    : menus.filter((m) => m.category === activeCategory);

  // ── Cart summary ─────────────────────────────────────────────────────────────
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-amber-50">

      {/* ── Toast ── */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}

      {/* ── Cart Sidebar ── */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onAdd={(menuId) => {
          const menu = menus.find((m) => m.id === menuId);
          if (menu) addToCart(menu);
        }}
        onRemove={removeFromCart}
        onClear={clearCart}
        onCheckout={handleCheckout}
        isCheckingOut={isCheckingOut}
        selectedTable={selectedTable}
      />

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-amber-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
              <Coffee size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-gray-800 text-base leading-none">Warkop App</h1>
              <p className="text-[10px] text-amber-500 font-medium">Order Your Favourite</p>
            </div>
          </div>

          {/* Meja & Cart button */}
          <div className="flex items-center gap-3">
            {selectedTable && (
              <div className="flex items-center gap-1.5 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                <MapPin size={12} />
                🔒 Meja {selectedTable.table_number}
              </div>
            )}

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-amber-600 active:scale-95 transition-all shadow-md shadow-amber-200"
            >
              <ShoppingCart size={16} />
              <span className="hidden sm:inline">Keranjang</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Link Staff Login */}
            <Link
              to="/login"
              className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
              title="Portal Staff / Kasir"
            >
              <User size={18} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8 pb-32">

        {!selectedTable && (
          <section className="bg-white rounded-3xl p-5 shadow-sm border border-amber-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-800 text-base">1. Pilih Nomor Meja</h2>
                <p className="text-xs text-gray-400 mt-0.5">Pilih meja tempat kamu duduk</p>
              </div>
              <button
                onClick={fetchTables}
                className="flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-700 font-medium transition-colors"
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {loadingTables || isRestoringTable ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-2xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <TableSelector
                tables={tables}
                selectedTable={selectedTable}
                onSelect={handleSelectTable}
              />
            )}
          </section>
        )}

        {/* ── Section: Menu Catalog ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-gray-800 text-base">2. Pilih Menu</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedTable
                  ? 'Tambahkan menu ke keranjang'
                  : '⚠️ Pilih meja dulu untuk memesan'
                }
              </p>
            </div>
            {totalItems > 0 && (
              <p className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                {formatRupiah(totalPrice)}
              </p>
            )}
          </div>

          {/* Category filter tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap
                  transition-all duration-150 border shrink-0
                  ${activeCategory === cat.value
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-100'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'
                  }
                `}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Menu grid */}
          {loadingMenus ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white border border-amber-100 overflow-hidden">
                  <div className="h-32 bg-gray-100 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-100 animate-pulse rounded-full w-1/2" />
                    <div className="h-4 bg-gray-100 animate-pulse rounded-full w-3/4" />
                    <div className="h-3 bg-gray-100 animate-pulse rounded-full w-full" />
                    <div className="h-8 bg-gray-100 animate-pulse rounded-xl mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMenus.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <span className="text-5xl">😔</span>
              <p className="text-sm">Tidak ada menu di kategori ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredMenus.map((menu) => (
                <MenuCard
                  key={menu.id}
                  menu={menu}
                  quantity={getQuantity(menu.id)}
                  onAdd={() => addToCart(menu)}
                  onRemove={() => removeFromCart(menu.id)}
                  disabled={!selectedTable}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── Floating checkout bar (visible when cart has items) ── */}
      {totalItems > 0 && !isCartOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-white/90 backdrop-blur-md border-t border-amber-100 md:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-amber-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-between px-5 shadow-lg shadow-amber-200 active:scale-95 transition-all"
          >
            <span className="bg-amber-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
              {totalItems} item
            </span>
            <span>Lihat Keranjang</span>
            <span className="font-extrabold">{formatRupiah(totalPrice)}</span>
          </button>
        </div>
      )}

      {/* ── Table selection modal (blocking until a table is chosen) ── */}
      {!selectedTable && (
        <div className="fixed inset-0 z-40 bg-amber-50/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-xl border border-amber-100 max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-gray-800 text-lg mb-1">Pilih Nomor Meja</h2>
            <p className="text-sm text-gray-500 mb-4">Pilih meja tempat kamu duduk untuk mulai memesan.</p>
            {loadingTables || isRestoringTable ? (
              <p className="text-sm text-gray-400">Memuat data meja...</p>
            ) : (
              <TableSelector tables={tables} selectedTable={null} onSelect={handleSelectTable} />
            )}
          </div>
        </div>
      )}

      {/* ── Success modal after checkout ── */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl text-center">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="font-bold text-gray-800 text-lg mb-2">Pesanan Berhasil Dikirim!</h2>
            <p className="text-sm text-gray-500 mb-4">
              Pesananmu sedang diproses. Kamu bisa memesan lagi kapan saja.
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full bg-amber-500 text-white font-bold py-3 rounded-2xl hover:bg-amber-600 active:scale-95 transition-all"
            >
              Lanjut Pesan
            </button>
          </div>
        </div>
      )}

      {/* ── Unlock notice modal (triggered by cashier) ── */}
      {showUnlockNotice && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl text-center">
            <div className="text-4xl mb-3">🔓</div>
            <h2 className="font-bold text-gray-800 text-lg mb-2">Sesi Meja Berakhir</h2>
            <p className="text-sm text-gray-500 mb-4">
              Sesi meja telah diakhiri. Silakan pilih meja kembali.
            </p>
            <button
              onClick={() => setShowUnlockNotice(false)}
              className="w-full bg-amber-500 text-white font-bold py-3 rounded-2xl hover:bg-amber-600 active:scale-95 transition-all"
            >
              Pilih Meja
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Customer;
