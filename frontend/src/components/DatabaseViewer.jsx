import { useEffect, useMemo, useState } from 'react';
import { ClipboardCopy, Database, Download, RefreshCw } from 'lucide-react';
import api from '../utils/api';

const TABLE_OPTIONS = [
  { value: 'orders', label: 'orders — Data Transaksi' },
  { value: 'order_items', label: 'order_items — Rincian Pesanan' },
  { value: 'menu', label: 'menu — Katalog Menu' },
  { value: 'users', label: 'users — Data Karyawan' },
];

const formatCell = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const cleanTsvCell = (value) => formatCell(value).replace(/[\t\r\n]+/g, ' ');
const escapeCsvCell = (value) => `"${formatCell(value).replace(/"/g, '""')}"`;

const DatabaseViewer = ({ onToast }) => {
  const [tableName, setTableName] = useState(TABLE_OPTIONS[0].value);
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isActive = true;
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/database/${tableName}`);
        if (isActive) {
          setColumns(data.columns || []);
          setRows(data.data || []);
        }
      } catch (err) {
        if (isActive) {
          const message = err?.response?.data?.message || 'Gagal mengambil data tabel.';
          setError(message);
          setColumns([]);
          setRows([]);
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };
    fetchData();
    return () => { isActive = false; };
  }, [tableName, refreshKey]);

  const loadData = () => setRefreshKey((key) => key + 1);

  const exportText = useMemo(() => {
    const lines = [
      columns.map(cleanTsvCell).join('\t'),
      ...rows.map((row) => columns.map((column) => cleanTsvCell(row[column])).join('\t')),
    ];
    return lines.join('\n');
  }, [columns, rows]);

  const copyData = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      onToast({ message: 'Data berhasil disalin!', type: 'success' });
    } catch (err) {
      console.error('Gagal menyalin data database:', err);
      onToast({ message: 'Gagal menyalin data. Periksa izin clipboard browser.', type: 'error' });
    }
  };

  const downloadCsv = () => {
    const csv = [
      columns.map(escapeCsvCell).join(','),
      ...rows.map((row) => columns.map((column) => escapeCsvCell(row[column])).join(',')),
    ].join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tableName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database size={18} className="text-amber-400" />
            <h2 className="text-base font-bold text-white">Database (Read-only)</h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Lihat dan ekspor data tabel. Password karyawan tidak ditampilkan.
          </p>
        </div>
        <label className="min-w-64 text-xs font-semibold text-slate-300">
          Pilih tabel
          <select
            value={tableName}
            onChange={(event) => setTableName(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            {TABLE_OPTIONS.map((table) => (
              <option key={table.value} value={table.value}>{table.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          {loading ? 'Memuat data...' : `${rows.length} baris`}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyData}
            disabled={loading || columns.length === 0}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ClipboardCopy size={14} />
            Salin Data (Excel)
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={loading || columns.length === 0}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={14} />
            Download CSV
          </button>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            aria-label="Refresh data tabel"
            className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-800/80">
        <div className="max-h-[65vh] overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-900 text-xs uppercase text-slate-400">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="whitespace-nowrap border-b border-slate-700 px-4 py-3">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {!loading && !error && rows.length === 0 ? (
                <tr>
                  <td colSpan={Math.max(columns.length, 1)} className="px-4 py-8 text-center text-slate-500">
                    {columns.length ? 'Tabel belum memiliki data.' : 'Tidak ada kolom untuk ditampilkan.'}
                  </td>
                </tr>
              ) : rows.map((row, index) => (
                <tr key={row.id ?? index} className="hover:bg-slate-700/20">
                  {columns.map((column) => (
                    <td key={column} className="max-w-sm whitespace-nowrap px-4 py-3 text-slate-300">
                      {formatCell(row[column]) || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default DatabaseViewer;
