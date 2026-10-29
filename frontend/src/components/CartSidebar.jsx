import { X, ShoppingCart, Plus, Minus, Trash2, Receipt } from 'lucide-react';

const formatRupiah = (number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

/**
 * Sliding cart sidebar (desktop: fixed right panel, mobile: bottom sheet).
 *
 * @param {boolean}   isOpen         - Whether the cart panel is visible
 * @param {Function}  onClose        - Close the panel
 * @param {Array}     cart           - Cart items [{menu_id, name, price, quantity, category}]
 * @param {Function}  onAdd          - Add one unit of item by menu_id
 * @param {Function}  onRemove       - Remove one unit of item by menu_id
 * @param {Function}  onClear        - Empty the entire cart
 * @param {Function}  onCheckout     - Trigger checkout
 * @param {boolean}   isCheckingOut  - Loading state for checkout button
 * @param {Object}    selectedTable  - Currently selected table
 */
const CartSidebar = ({
  isOpen, onClose,
  cart, onAdd, onRemove, onClear,
  onCheckout, isCheckingOut,
  selectedTable,
}) => {
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-30 transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Panel */}
      <aside
        className={`
          fixed z-40 bg-white flex flex-col transition-transform duration-300 ease-in-out
          /* Mobile: bottom sheet */
          bottom-0 left-0 right-0 h-[85vh] rounded-t-3xl
          /* Desktop: right sidebar */
          md:top-0 md:right-0 md:bottom-0 md:left-auto md:h-full md:w-96 md:rounded-none md:rounded-l-3xl md:shadow-2xl
          ${isOpen
            ? 'translate-y-0 md:translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-y-0 md:translate-x-full'
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-amber-100">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-amber-500" />
            <h2 className="font-bold text-gray-800 text-lg">Keranjang</h2>
            {totalItems > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={onClear}
                className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
              >
                <Trash2 size={13} /> Kosongkan
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Selected table info */}
        {selectedTable && (
          <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 flex items-center gap-2">
            <Receipt size={15} className="text-amber-500 shrink-0" />
            <span className="text-sm text-amber-700">
              Meja <strong>{selectedTable.table_number}</strong>
            </span>
          </div>
        )}

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto py-3 px-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <ShoppingCart size={48} strokeWidth={1} />
              <p className="text-sm">Keranjang masih kosong</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.menu_id}
                className="flex items-center gap-3 bg-amber-50 rounded-2xl p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                  <p className="text-amber-600 text-xs font-medium">{formatRupiah(item.price)}</p>
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onRemove(item.menu_id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="font-bold text-gray-800 text-sm w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => onAdd(item.menu_id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Subtotal */}
                <p className="text-sm font-bold text-gray-700 w-20 text-right shrink-0">
                  {formatRupiah(item.price * item.quantity)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer — total & checkout */}
        {cart.length > 0 && (
          <div className="border-t border-amber-100 p-5 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Total</span>
              <span className="font-extrabold text-xl text-amber-600">{formatRupiah(totalPrice)}</span>
            </div>

            <button
              onClick={onCheckout}
              disabled={isCheckingOut || !selectedTable}
              className={`
                w-full py-3.5 rounded-2xl font-bold text-base transition-all duration-150 flex items-center justify-center gap-2
                ${isCheckingOut || !selectedTable
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95 shadow-lg shadow-amber-200'
                }
              `}
            >
              {isCheckingOut ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  <Receipt size={18} />
                  Pesan Sekarang
                </>
              )}
            </button>

            {!selectedTable && (
              <p className="text-center text-xs text-red-400">⚠️ Pilih nomor meja terlebih dahulu</p>
            )}
          </div>
        )}
      </aside>
    </>
  );
};

export default CartSidebar;

