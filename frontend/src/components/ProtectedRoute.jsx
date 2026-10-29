import { Navigate } from 'react-router-dom';

/**
 * Komponen pelindung rute.
 * @param {ReactNode} children      - Komponen yang dilindungi
 * @param {Array}     allowedRoles  - Daftar role yang diizinkan (opsional, contoh: ['manager'])
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token   = localStorage.getItem('warkop_token');
  const userStr = localStorage.getItem('warkop_user');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && userStr) {
    try {
      const user = JSON.parse(userStr);
      if (!allowedRoles.includes(user.role)) {
        // Jika kasir mencoba akses rute manajer, alihkan ke dashboard kasir
        if (user.role === 'cashier') {
          return <Navigate to="/cashier" replace />;
        }
        return <Navigate to="/login" replace />;
      }
    } catch {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

