import { useCallback, useMemo, useRef, useState } from 'react';
import api from '../utils/api';

const useCustomerCart = ({ selectedTable, refreshTables, onToast }) => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;

  const getQuantity = useCallback(
    (menuId) => cart.find((item) => item.menu_id === menuId)?.quantity ?? 0,
    [cart]
  );

  const addToCart = useCallback((menu) => {
    setCart((previous) => {
      const existing = previous.find((item) => item.menu_id === menu.id);
      if (existing) {
        return previous.map((item) =>
          item.menu_id === menu.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...previous, {
        menu_id: menu.id,
        name: menu.name,
        price: parseFloat(menu.price),
        quantity: 1,
        category: menu.category,
      }];
    });
  }, []);

  const removeFromCart = useCallback((menuId) => {
    setCart((previous) => {
      const existing = previous.find((item) => item.menu_id === menuId);
      if (!existing) return previous;
      if (existing.quantity === 1) return previous.filter((item) => item.menu_id !== menuId);
      return previous.map((item) =>
        item.menu_id === menuId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  }, []);

  const clearCart = useCallback(() => setCart([]), []);
  const resetCartSession = useCallback(() => {
    setCart([]);
    setIsCartOpen(false);
    setShowSuccess(false);
  }, []);

  const handleCheckout = useCallback(async () => {
    if (!selectedTable) {
      onToastRef.current('Pilih nomor meja terlebih dahulu!', 'error');
      return;
    }
    if (cart.length === 0) {
      onToastRef.current('Keranjang masih kosong!', 'error');
      return;
    }

    setIsCheckingOut(true);
    try {
      await api.post('/orders', {
        table_id: selectedTable.id,
        items: cart.map(({ menu_id, quantity }) => ({ menu_id, quantity })),
      });

      clearCart();
      setIsCartOpen(false);
      setShowSuccess(true);
      onToastRef.current(
        `🎉 Pesanan Meja ${selectedTable.table_number} berhasil dikirim! Silakan tunggu.`,
        'success'
      );
      refreshTables();
    } catch (err) {
      const message = err?.response?.data?.message || 'Gagal membuat pesanan. Coba lagi.';
      onToastRef.current(message, 'error');
    } finally {
      setIsCheckingOut(false);
    }
  }, [cart, clearCart, refreshTables, selectedTable]);

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );
  const totalPrice = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  return {
    cart,
    isCartOpen,
    setIsCartOpen,
    isCheckingOut,
    showSuccess,
    setShowSuccess,
    totalItems,
    totalPrice,
    getQuantity,
    addToCart,
    removeFromCart,
    clearCart,
    resetCartSession,
    handleCheckout,
  };
};

export default useCustomerCart;
