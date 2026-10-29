import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Customer       from './pages/Customer';
import Cashier        from './pages/Cashier';
import Manager        from './pages/Manager';
import Login          from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Halaman Pelanggan — Publik */}
        <Route path="/" element={<Customer />} />

        {/* Halaman Login Karyawan — Publik */}
        <Route path="/login" element={<Login />} />

        {/* Halaman Kasir — Terproteksi (Kasir & Manajer) */}
        <Route
          path="/cashier"
          element={
            <ProtectedRoute allowedRoles={['cashier', 'manager']}>
              <Cashier />
            </ProtectedRoute>
          }
        />

        {/* Halaman Manajer — Terproteksi (Khusus Manajer) */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <Manager />
            </ProtectedRoute>
          }
        />

        {/* Fallback ke beranda */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
