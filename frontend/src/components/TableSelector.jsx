import { Users } from 'lucide-react';

/**
 * Displays a grid of tables for the customer to select.
 * @param {Array}    tables          - List of table objects from API
 * @param {Object}   selectedTable   - Currently selected table (or null)
 * @param {Function} onSelect        - Called with table object when clicked
 */
const TableSelector = ({ tables, selectedTable, onSelect }) => {
  return (
    <div>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-5 gap-3">
        {tables.map((table) => {
          const isSelected  = selectedTable?.id === table.id;
          const isOccupied  = table.status === 'occupied';

          return (
            <button
              key={table.id}
              onClick={() => !isOccupied && onSelect(table)}
              disabled={isOccupied}
              className={`
                relative flex flex-col items-center justify-center rounded-2xl border-2 p-3
                aspect-square transition-all duration-200 font-semibold text-sm
                ${isOccupied
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isSelected
                    ? 'border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-200 scale-105'
                    : 'border-amber-200 bg-white text-amber-800 hover:border-amber-400 hover:bg-amber-50 hover:scale-105'
                }
              `}
            >
              <Users
                size={20}
                className={isOccupied ? 'text-gray-300' : isSelected ? 'text-white' : 'text-amber-400'}
              />
              <span className="mt-1 text-xs">{table.table_number}</span>

              {/* Occupied badge */}
              {isOccupied && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  PENUH
                </span>
              )}

              {/* Selected checkmark */}
              {isSelected && (
                <span className="absolute -top-1.5 -right-1.5 bg-green-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedTable && (
        <p className="mt-4 text-center text-sm text-green-600 font-medium">
          ✅ Kamu memilih <strong>Meja {selectedTable.table_number}</strong>. Sekarang pilih menu di bawah!
        </p>
      )}
    </div>
  );
};

export default TableSelector;

