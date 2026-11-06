import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { SOCKET_BASE_URL } from '../utils/config';

const useCustomerData = (onToast, onSessionEnd) => {
  const [tables, setTables] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showUnlockNotice, setShowUnlockNotice] = useState(false);
  const [isRestoringTable, setIsRestoringTable] = useState(true);
  const endedTableIdsRef = useRef(new Set());
  const onToastRef = useRef(onToast);
  const onSessionEndRef = useRef(onSessionEnd);
  onToastRef.current = onToast;
  onSessionEndRef.current = onSessionEnd;

  const fetchTables = useCallback(async () => {
    setLoadingTables(true);
    try {
      const { data } = await api.get('/tables');
      setTables(data.data || []);
    } catch {
      onToastRef.current('Gagal memuat data meja. Coba refresh halaman.', 'error');
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
      onToastRef.current('Gagal memuat data menu. Coba refresh halaman.', 'error');
    } finally {
      setLoadingMenus(false);
    }
  }, []);

  const resetCustomerTableSession = useCallback(() => {
    localStorage.removeItem('selected_table');
    localStorage.removeItem('is_table_locked');
    setSelectedTable(null);
    onSessionEndRef.current?.();
    setShowUnlockNotice(true);
    fetchTables();
    onToastRef.current({
      message: 'Sesi meja telah diakhiri. Terima kasih atas kunjungan Anda.',
      type: 'success',
    });
  }, [fetchTables]);

  const handleSelectTable = useCallback((table) => {
    setSelectedTable(table);
    try {
      localStorage.setItem('selected_table', JSON.stringify(table));
      localStorage.setItem('is_table_locked', 'true');
    } catch {
      // Ignore storage errors.
    }
  }, []);

  useEffect(() => {
    fetchTables();
    fetchMenus();
  }, [fetchMenus, fetchTables]);

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
          onToastRef.current({
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
  }, [resetCustomerTableSession]);

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

    const handleOrderCompleted = ({ table_id }) => {
      try {
        const savedTable = JSON.parse(localStorage.getItem('selected_table') || 'null');
        if (Number(savedTable?.id) === Number(table_id)) {
          onToastRef.current('Pesanan telah diantar. Silakan pesan lagi jika diperlukan.', 'success');
        }
      } catch (err) {
        console.error('Gagal membaca sesi meja saat pesanan selesai:', err);
      }
    };

    socket.on('table_session_ended', handleTableSessionEnded);
    socket.on('order_completed', handleOrderCompleted);
    return () => socket.disconnect();
  }, [resetCustomerTableSession]);

  return {
    tables,
    menus,
    loadingTables,
    loadingMenus,
    selectedTable,
    setSelectedTable,
    showUnlockNotice,
    setShowUnlockNotice,
    isRestoringTable,
    fetchTables,
    handleSelectTable,
  };
};

export default useCustomerData;
