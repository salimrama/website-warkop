import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

/**
 * Toast notification component.
 * @param {string}   message  - Text to display
 * @param {'success'|'error'} type - Visual style
 * @param {Function} onClose  - Called when toast should be dismissed
 * @param {number}   duration - Auto-dismiss duration in ms (default 3500)
 */
const Toast = ({ message, type = 'success', onClose, duration = 3500 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const isSuccess = type === 'success';

  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-start gap-3 rounded-2xl px-5 py-4 shadow-2xl
        text-white max-w-sm animate-[slideIn_0.3s_ease-out]
        ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`}
    >
      {isSuccess
        ? <CheckCircle className="mt-0.5 shrink-0" size={20} />
        : <XCircle className="mt-0.5 shrink-0" size={20} />
      }
      <p className="text-sm font-medium leading-snug flex-1">{message}</p>
      <button onClick={onClose} className="ml-1 shrink-0 opacity-75 hover:opacity-100 transition-opacity">
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;

