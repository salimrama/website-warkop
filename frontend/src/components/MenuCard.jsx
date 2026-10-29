import { Plus, Minus } from 'lucide-react';

// Emoji & gradient per kategori sebagai placeholder gambar
const CATEGORY_VISUALS = {
  drink: { emoji: '☕', gradient: 'from-amber-100 to-orange-100' },
  food:  { emoji: '🍜', gradient: 'from-yellow-100 to-amber-100' },
  snack: { emoji: '🍪', gradient: 'from-orange-100 to-red-100' },
};

const formatRupiah = (number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

/**
 * Single menu item card with add/remove buttons.
 * @param {Object}   menu       - Menu object from API
 * @param {number}   quantity   - Current quantity in cart (0 if not added)
 * @param {Function} onAdd      - Increment quantity
 * @param {Function} onRemove   - Decrement quantity
 * @param {boolean}  disabled   - Disable controls when no table selected
 */
const MenuCard = ({ menu, quantity = 0, onAdd, onRemove, disabled }) => {
  const visual = CATEGORY_VISUALS[menu.category] || CATEGORY_VISUALS.drink;

  return (
    <div className={`
      bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden
      flex flex-col transition-shadow hover:shadow-md
      ${disabled ? 'opacity-60' : ''}
    `}>
      {/* Gambar / Placeholder */}
      <div className={`bg-gradient-to-br ${visual.gradient} flex items-center justify-center h-32 text-5xl select-none`}>
        {menu.image_url
          ? <img src={menu.image_url} alt={menu.name} className="h-full w-full object-cover" />
          : visual.emoji
        }
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <span className={`text-[10px] uppercase font-semibold tracking-widest
          ${menu.category === 'drink' ? 'text-amber-500'
            : menu.category === 'food' ? 'text-yellow-600'
            : 'text-orange-500'}`}>
          {menu.category}
        </span>
        <h3 className="text-sm font-bold text-gray-800 leading-tight line-clamp-2">{menu.name}</h3>
        {menu.description && (
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{menu.description}</p>
        )}
        <p className="text-amber-600 font-bold text-sm mt-auto pt-2">
          {formatRupiah(menu.price)}
        </p>
      </div>

      {/* Add/Remove controls */}
      <div className="px-3 pb-3">
        {quantity === 0 ? (
          <button
            onClick={onAdd}
            disabled={disabled}
            className={`
              w-full py-2 rounded-xl text-sm font-semibold transition-all duration-150
              flex items-center justify-center gap-1
              ${disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95'
              }
            `}
          >
            <Plus size={15} /> Tambah
          </button>
        ) : (
          <div className="flex items-center justify-between bg-amber-50 rounded-xl px-2 py-1">
            <button
              onClick={onRemove}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-200 text-amber-800 hover:bg-amber-300 active:scale-90 transition-all"
            >
              <Minus size={14} />
            </button>
            <span className="font-bold text-amber-800 text-sm w-6 text-center">{quantity}</span>
            <button
              onClick={onAdd}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-500 text-white hover:bg-amber-600 active:scale-90 transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuCard;

