import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  Wifi, WifiOff, BellRing, Clock, CheckCircle2,
  Loader2, Coffee, Table2, ShoppingBag, RefreshCw, LogOut, KeyRound,
} from 'lucide-react';
import api from '../utils/api';
import { SOCKET_BASE_URL } from '../utils/config';
import Toast from '../components/Toast';
import ChangePasswordModal from '../components/ChangePasswordModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)  return `${diff}d lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  return `${Math.floor(diff / 3600)}j lalu`;
};

const STATUS_CONFIG = {
  pending:    { label: 'Menunggu',   bg: 'bg-yellow-400', text: 'text-yellow-900', ring: 'ring-yellow-300' },
  processing: { label: 'Diproses',   bg: 'bg-blue-500',   text: 'text-white',      ring: 'ring-blue-300'   },
  completed:  { label: 'Selesai',    bg: 'bg-green-500',  text: 'text-white',      ring: 'ring-green-300'  },
  cancelled:  { label: 'Dibatalkan', bg: 'bg-red-400',    text: 'text-white',      ring: 'ring-red-300'    },
};

// ── Web Audio: beep dua kali ──────────────────────────────────────────────────
const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25].forEach((delay) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.3);
    });
  } catch (_) { /* silent fail */ }
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Blinking "NEW ORDER" banner overlay */
const NewOrderFlash = ({ onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Flashing border ring */}
      <div className="absolute inset-0 animate-[flashBorder_0.5s_ease-in-out_6] border-[12px] border-amber-400 rounded-none opacity-80" />
      {/* Center badge */}
      <div className="bg-amber-400 text-amber-900 font-black text-4xl md:text-6xl px-10 py-6 rounded-3xl shadow-2xl
                      animate-[bounceIn_0.4s_ease-out] flex items-center gap-4">
        <BellRing size={48} className="animate-[wiggle_0.3s_ease-in-out_infinite]" />
        PESANAN BARU!
        <BellRing size={48} className="animate-[wiggle_0.3s_ease-in-out_infinite]" />
      </div>
    </div>
  );
};

/** Single order card */
const OrderCard = ({ order, onUpdateStatus, updatingId, isNew }) => {
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  return (
    <div className={`
      bg-gray-800 rounded-3xl overflow-hidden border-2 transition-all duration-500
      ${isNew ? 'border-amber-400 shadow-2xl shadow-amber-500/30 animate-[slideDown_0.4s_ease-out]' : 'border-gray-700'}
    `}>
      {/* Card header */}
      <div className={`flex items-center justify-between px-6 py-4
        ${isNew ? 'bg-amber-400' : 'bg-gray-700'}`}>
        <div className="flex items-center gap-4">
          {/* Big table number */}
          <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black
            ${isNew ? 'bg-amber-600 text-white' : 'bg-gray-600 text-amber-400'}`}>
            <Table2 size={18} className="mb-0.5" />
            <span className="text-2xl leading-none">{order.table_number}</span>
          </div>
          <div>
            <div className={`font-black text-xl ${isNew ? 'text-amber-900' : 'text-white'}`}>
              Meja {order.table_number}
            </div>
            <div className={`text-sm font-medium flex items-center gap-1.5
              ${isNew ? 'text-amber-800' : 'text-gray-400'}`}>
              <Clock size={13} />
              {formatTime(order.created_at)} · {timeAgo(order.created_at)}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {/* Status badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusCfg.bg} ${statusCfg.text}`}>
            {statusCfg.label}
          </span>
          {/* Source badge */}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
            ${isNew ? 'bg-amber-700/40 text-amber-900' : 'bg-gray-600 text-gray-300'}`}>
            {order.source === 'customer' ? '📱 Pelanggan' : '🖥️ Kasir'}
          </span>
        </div>
      </div>

      {/* Items list */}
      <div className="px-6 py-4 space-y-2">
        {(order.items || []).map((item, idx) => (
          <div key={idx} className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                {item.quantity}×
              </span>
              <div className="min-w-0">
                <p className="text-white font-semibold text-base leading-tight truncate">{item.menu_name}</p>
                {item.notes && (
                  <p className="text-gray-400 text-xs mt-0.5 italic">📝 {item.notes}</p>
                )}
              </div>
            </div>
            <span className="text-amber-400 font-bold text-sm shrink-0 pt-0.5">
              {formatRupiah(item.subtotal)}
            </span>
          </div>
        ))}

        {order.notes && (
          <div className="mt-3 bg-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-gray-300 italic">
            💬 {order.notes}
          </div>
        )}
      </div>

      {/* Footer: total + actions */}
      <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between gap-3">
        <div>
          <p className="text-gray-400 text-xs">Total</p>
          <p className="text-amber-400 font-black text-2xl">{formatRupiah(order.total_price)}</p>
        </div>

        <div className="flex gap-2">
          {order.status === 'pending' && (
            <button
              onClick={() => onUpdateStatus(order.id, 'processing')}
              disabled={updatingId === order.id}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {updatingId === order.id
                ? <Loader2 size={15} className="animate-spin" />
                : <Coffee size={15} />
              }
              Proses
            </button>
          )}

          {(order.status === 'pending' || order.status === 'processing') && (
            <button
              onClick={() => onUpdateStatus(order.id, 'completed')}
              disabled={updatingId === order.id}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
            >
              {updatingId === order.id
                ? <Loader2 size={15} className="animate-spin" />
                : <CheckCircle2 size={15} />
              }
              Selesai
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const Cashier = () => {
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [showFlash,   setShowFlash]   = useState(false);
  const [newOrderIds, setNewOrderIds] = useState(new Set());   // highlight new cards
  const [updatingId,  setUpdatingId]  = useState(null);
  const [filterStatus, setFilterStatus] = useState('active'); // 'active' | 'completed' | 'all'
  const [tables,       setTables]       = useState([]);
  const [tableActionId, setTableActionId] = useState(null);
  const [tableActionError, setTableActionError] = useState('');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const socketRef = useRef(null);

  // ── Fetch existing orders ──────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const param = filterStatus === 'active'
        ? '' : filterStatus === 'completed'
        ? '?status=completed' : '';
      const { data } = await api.get(`/orders${param}`);
      setOrders(data.data || []);
    } catch (err) {
      console.error('Gagal fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Table management ────────────────────────────────────────────────────────
  const fetchTables = useCallback(async () => {
    try {
      const { data } = await api.get('/tables');
      setTables(data.data || []);
    } catch (err) {
      console.error('Gagal fetch tables:', err);
    }
  }, []);

  const handleCompleteTable = async (tableId) => {
    setTableActionId(tableId);
    setTableActionError('');
    try {
      await api.post(`/tables/${tableId}/complete`);
      setTables((prev) =>
        prev.map((t) => (t.id === tableId ? { ...t, status: 'available' } : t))
      );
    } catch (err) {
      console.error('Gagal menyelesaikan sesi meja:', err);
      setTableActionError(err?.response?.data?.message || 'Gagal menyelesaikan sesi meja.');
    } finally {
      setTableActionId(null);
    }
  };

  useEffect(() => { fetchTables(); }, [fetchTables]);

  // ── Socket.io connection ──────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_BASE_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Notify backend that this client is the cashier screen
      socket.emit('join_cashier');
    });

    socket.on('disconnect', () => setIsConnected(false));

    // New order event
    socket.on('new_order', (payload) => {
      // Build an order object matching our shape
      const newOrder = {
        id:           payload.order_id,
        table_id:     payload.table_id,
        table_number: payload.table_number,
        source:       payload.source || 'customer',
        status:       payload.status || 'pending',
        total_price:  payload.total_price,
        notes:        payload.notes || null,
        created_at:   payload.created_at,
        items:        payload.items || [],
      };
      if (payload.table_id) {
        setTables((prev) =>
          prev.map((table) =>
            Number(table.id) === Number(payload.table_id)
              ? { ...table, status: 'occupied' }
              : table
          )
        );
      }

      // Add to top of list
      setOrders((prev) => {
        // Prevent duplicate if we also fetched it
        const exists = prev.some((o) => o.id === newOrder.id);
        return exists ? prev : [newOrder, ...prev];
      });

      // Highlight this card
      setNewOrderIds((prev) => new Set(prev).add(newOrder.id));
      setTimeout(() => {
        setNewOrderIds((prev) => {
          const next = new Set(prev);
          next.delete(newOrder.id);
          return next;
        });
      }, 8000); // highlight for 8s

      // Visual & audio effects
      setShowFlash(true);
      playBeep();
    });

    // Order status updated by another cashier / system
    socket.on('order_updated', ({ order_id, status }) => {
      setOrders((prev) =>
        prev.map((o) => o.id === order_id ? { ...o, status } : o)
      );
    });

    // Table unlocked by cashier/manager
    socket.on('table_unlocked', ({ tableId }) => {
      setTables((prev) =>
        prev.map((t) => (Number(t.id) === Number(tableId) ? { ...t, status: 'available' } : t))
      );
    });

    socket.on('table_session_ended', ({ tableId }) => {
      setTables((prev) =>
        prev.map((t) => (Number(t.id) === Number(tableId) ? { ...t, status: 'available' } : t))
      );
    });

    return () => socket.disconnect();
  }, []);

  // ── Update order status ───────────────────────────────────────────────────
  const handleUpdateStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      // Optimistic update (socket event will also arrive)
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
    } catch (err) {
      console.error('Gagal update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Filtered view ─────────────────────────────────────────────────────────
  const displayedOrders = orders.filter((o) => {
    if (filterStatus === 'active')    return o.status === 'pending' || o.status === 'processing';
    if (filterStatus === 'completed') return o.status === 'completed' || o.status === 'cancelled';
    return true;
  });

  const pendingCount    = orders.filter((o) => o.status === 'pending').length;
  const processingCount = orders.filter((o) => o.status === 'processing').length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-900 text-white">

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

      {/* ── Flash overlay ── */}
      {showFlash && <NewOrderFlash onDone={() => setShowFlash(false)} />}

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
              <Coffee size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-lg text-white leading-none">Warkop — Kasir</h1>
              <p className="text-[11px] text-amber-400 font-medium">Real-time Order Monitor</p>
            </div>
          </div>

          {/* Stats pills */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-yellow-500/20 text-yellow-400 px-3 py-1.5 rounded-full text-xs font-bold">
              <ShoppingBag size={13} />
              {pendingCount} Menunggu
            </div>
            <div className="flex items-center gap-1.5 bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-full text-xs font-bold">
              <Coffee size={13} />
              {processingCount} Diproses
            </div>
          </div>

          {/* Connection status + refresh + logout */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsChangePasswordOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500/10 px-2.5 py-2 text-xs font-bold text-amber-300 transition-colors hover:bg-amber-500/20 sm:px-3"
              title="Ganti Password"
            >
              <KeyRound size={14} />
              <span className="hidden sm:inline">Ganti Password</span>
            </button>
            <button
              onClick={fetchOrders}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-700 hover:bg-gray-600 transition-colors text-gray-300"
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
              ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
              {isConnected ? 'Live' : 'Offline'}
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('warkop_token');
                localStorage.removeItem('warkop_user');
                window.location.href = '/login';
              }}
              className="flex items-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ml-1"
              title="Keluar"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Filter tabs ── */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          {[
            { key: 'active',    label: '🔴 Aktif'   },
            { key: 'completed', label: '✅ Selesai'  },
            { key: 'all',       label: '📋 Semua'   },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all
                ${filterStatus === tab.key
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table management ── */}
      <div className="max-w-7xl mx-auto px-4 pb-4">
        <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white text-sm">Manajemen Meja</h3>
            <button
              onClick={fetchTables}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
          {tableActionError && (
            <p role="alert" className="mb-3 text-xs font-medium text-red-400">
              {tableActionError}
            </p>
          )}
          {tables.length === 0 ? (
            <p className="text-xs text-gray-500">Memuat meja...</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="bg-gray-700 rounded-xl p-2 text-center border border-gray-600"
                >
                  <div className="text-xs font-bold text-white">Meja {table.table_number}</div>
                  <div
                    className={`text-[10px] mt-0.5 font-semibold ${
                      table.status === 'occupied' ? 'text-red-400' : 'text-green-400'
                    }`}
                  >
                    {table.status === 'occupied' ? 'Terisi' : 'Tersedia'}
                  </div>
                  <button
                    onClick={() => handleCompleteTable(table.id)}
                    disabled={table.status !== 'occupied' || tableActionId === table.id}
                    className="mt-1.5 w-full min-h-9 text-[9px] leading-3 px-1.5 py-1 rounded-lg bg-amber-500 text-white font-bold
                               disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-600 transition-colors"
                  >
                    {tableActionId === table.id ? 'Memproses...' : 'Selesai & Bersihkan Meja'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Order grid ── */}
      <main className="max-w-7xl mx-auto px-4 pb-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-3xl overflow-hidden border-2 border-gray-700 animate-pulse">
                <div className="h-24 bg-gray-700" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-gray-700 rounded-full w-3/4" />
                  <div className="h-4 bg-gray-700 rounded-full w-1/2" />
                  <div className="h-4 bg-gray-700 rounded-full w-2/3" />
                </div>
                <div className="h-16 bg-gray-700/50 mx-5 mb-5 rounded-xl" />
              </div>
            ))}
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-gray-600">
            <ShoppingBag size={64} strokeWidth={1} />
            <p className="text-xl font-semibold">Belum ada pesanan</p>
            <p className="text-sm">Pesanan baru akan muncul secara otomatis di sini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {displayedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onUpdateStatus={handleUpdateStatus}
                updatingId={updatingId}
                isNew={newOrderIds.has(order.id)}
              />
            ))}
          </div>
        )}
      </main>

    </div>
  );
};

export default Cashier;
