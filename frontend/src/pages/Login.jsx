import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Coffee, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';

const Login = () => {
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Harap isi email dan password.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });

      // Simpan sesi ke localStorage
      localStorage.setItem('warkop_token', data.token);
      localStorage.setItem('warkop_user',  JSON.stringify(data.user));

      // Redirect sesuai role
      if (data.user.role === 'manager') {
        navigate('/manager');
      } else {
        navigate('/cashier');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login gagal. Periksa koneksi atau kredensial Anda.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Box */}
      <div className="w-full max-w-md bg-slate-800 border border-slate-700/80 rounded-3xl shadow-2xl p-8 relative z-10 backdrop-blur-sm">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-3">
            <Coffee className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Staff Portal</h1>
          <p className="text-sm text-slate-400 mt-1">Masuk untuk mengakses Kasir & Dashboard Manajer</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3 text-red-400 text-sm animate-[slideIn_0.2s_ease-out]">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="leading-snug">{error}</p>
          </div>
        )}

        {/* Quick Demo Login Pill */}
        <div className="mb-6 bg-slate-900/60 border border-slate-700/60 rounded-2xl p-3 flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase text-slate-400">Akun Percobaan (Klik untuk isi cepat):</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setEmail('kasir@warkop.com'); setPassword('kasir123'); }}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-colors text-center"
            >
              🖥️ Kasir Demo
            </button>
            <button
              type="button"
              onClick={() => { setEmail('manager@warkop.com'); setPassword('admin123'); }}
              className="flex-1 py-1.5 px-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-colors text-center"
            >
              📊 Manajer Demo
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Email Karyawan
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@warkop.com"
                className="w-full bg-slate-900 border border-slate-700 text-white pl-11 pr-4 py-3 rounded-2xl focus:outline-none focus:border-amber-500 text-sm placeholder:text-slate-500 transition-colors"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-700 text-white pl-11 pr-11 py-3 rounded-2xl focus:outline-none focus:border-amber-500 text-sm placeholder:text-slate-500 transition-colors"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3.5 rounded-2xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-slate-950" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Memverifikasi...
              </>
            ) : (
              <>
                Masuk ke Sistem
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-8 pt-6 border-t border-slate-700/60 text-center">
          <Link
            to="/"
            className="text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5"
          >
            ← Kembali ke Menu Pelanggan
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

