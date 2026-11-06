import { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';

const EMPTY_STATISTICS = {
  summary: { total_revenue: 0, total_transactions: 0 },
  popularItems: { food: [], drink: [], snack: [] },
  peakHours: [],
  revenueTrend: [],
};

const useManagerData = ({
  filterStatus,
  activeTab,
  statisticsDateMode,
  statisticsFilters,
}) => {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(EMPTY_STATISTICS);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [statisticsError, setStatisticsError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/dashboard/stats');
      setStats(data.data);
    } catch (err) {
      console.error('Gagal fetch stats:', err);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/history?status=${filterStatus}`);
      setHistory(data.data || []);
    } catch (err) {
      console.error('Gagal fetch history:', err);
    }
  }, [filterStatus]);

  const fetchEmployees = useCallback(async () => {
    try {
      const { data } = await api.get('/users');
      setEmployees(data.data || []);
    } catch (err) {
      console.error('Gagal fetch users:', err);
    }
  }, []);

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
  }, [fetchEmployees, fetchHistory, fetchMenus, fetchStats]);

  useEffect(() => { reloadAll(); }, [reloadAll]);

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
      setStatistics(EMPTY_STATISTICS);
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
        setStatistics(EMPTY_STATISTICS);
      } finally {
        if (isMounted) setStatisticsLoading(false);
      }
    };

    fetchStatistics();
    return () => { isMounted = false; };
  }, [activeTab, statisticsDateMode, statisticsFilters]);

  const createEmployee = useCallback(async (formData) => {
    await api.post('/users', formData);
    fetchEmployees();
    fetchStats();
  }, [fetchEmployees, fetchStats]);

  const deleteEmployee = useCallback(async (employeeId) => {
    await api.delete(`/users/${employeeId}`);
    setEmployees((previous) => previous.filter((employee) => employee.id !== employeeId));
    fetchStats();
  }, [fetchStats]);

  const createMenu = useCallback(async (menuForm) => {
    await api.post('/menus', menuForm);
    fetchMenus();
  }, [fetchMenus]);

  const deleteMenu = useCallback(async (menuId) => {
    await api.delete(`/menus/${menuId}`);
    fetchMenus();
  }, [fetchMenus]);

  return {
    stats,
    history,
    employees,
    menus,
    loading,
    statistics,
    statisticsLoading,
    statisticsError,
    setStatisticsError,
    fetchStats,
    fetchHistory,
    fetchEmployees,
    fetchMenus,
    reloadAll,
    createEmployee,
    deleteEmployee,
    createMenu,
    deleteMenu,
  };
};

export default useManagerData;
