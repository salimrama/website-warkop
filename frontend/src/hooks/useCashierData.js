import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';
import { SOCKET_BASE_URL } from '../utils/config';

const useCashierData = (filterStatus, onNewOrder) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [newOrderIds, setNewOrderIds] = useState(new Set());
  const [updatingId, setUpdatingId] = useState(null);
  const [tables, setTables] = useState([]);
  const [tableActionId, setTableActionId] = useState(null);
  const [tableActionError, setTableActionError] = useState('');
  const onNewOrderRef = useRef(onNewOrder);
  onNewOrderRef.current = onNewOrder;

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

  const fetchTables = useCallback(async () => {
    try {
      const { data } = await api.get('/tables');
      setTables(data.data || []);
    } catch (err) {
      console.error('Gagal fetch tables:', err);
    }
  }, []);

  const handleCompleteTable = useCallback(async (tableId) => {
    setTableActionId(tableId);
    setTableActionError('');
    try {
      await api.post(`/tables/${tableId}/complete`);
      setTables((previous) =>
        previous.map((table) => table.id === tableId ? { ...table, status: 'available' } : table)
      );
    } catch (err) {
      console.error('Gagal menyelesaikan sesi meja:', err);
      setTableActionError(err?.response?.data?.message || 'Gagal menyelesaikan sesi meja.');
    } finally {
      setTableActionId(null);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  useEffect(() => {
    const socket = io(SOCKET_BASE_URL, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_cashier');
    });
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('new_order', (payload) => {
      const newOrder = {
        id: payload.order_id,
        table_id: payload.table_id,
        table_number: payload.table_number,
        source: payload.source || 'customer',
        status: payload.status || 'pending',
        total_price: payload.total_price,
        notes: payload.notes || null,
        created_at: payload.created_at,
        items: payload.items || [],
      };
      if (payload.table_id) {
        setTables((previous) =>
          previous.map((table) =>
            Number(table.id) === Number(payload.table_id)
              ? { ...table, status: 'occupied' }
              : table
          )
        );
      }

      setOrders((previous) => {
        const exists = previous.some((order) => order.id === newOrder.id);
        return exists ? previous : [newOrder, ...previous];
      });
      setNewOrderIds((previous) => new Set(previous).add(newOrder.id));
      setTimeout(() => {
        setNewOrderIds((previous) => {
          const next = new Set(previous);
          next.delete(newOrder.id);
          return next;
        });
      }, 8000);
      setShowFlash(true);
      onNewOrderRef.current?.();
    });

    socket.on('order_updated', ({ order_id, status }) => {
      setOrders((previous) =>
        previous.map((order) => order.id === order_id ? { ...order, status } : order)
      );
    });

    const markTableAvailable = ({ tableId }) => {
      setTables((previous) =>
        previous.map((table) =>
          Number(table.id) === Number(tableId) ? { ...table, status: 'available' } : table
        )
      );
    };
    socket.on('table_unlocked', markTableAvailable);
    socket.on('table_session_ended', markTableAvailable);

    return () => socket.disconnect();
  }, []);

  const handleUpdateStatus = useCallback(async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      setOrders((previous) =>
        previous.map((order) => order.id === orderId ? { ...order, status } : order)
      );
    } catch (err) {
      console.error('Gagal update status:', err);
    } finally {
      setUpdatingId(null);
    }
  }, []);

  return {
    orders,
    loading,
    isConnected,
    showFlash,
    setShowFlash,
    newOrderIds,
    updatingId,
    tables,
    tableActionId,
    tableActionError,
    fetchOrders,
    fetchTables,
    handleCompleteTable,
    handleUpdateStatus,
  };
};

export default useCashierData;
