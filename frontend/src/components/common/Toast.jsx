import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { hideToast } from '../../store/slices/uiSlice';

export default function Toast() {
  const dispatch = useDispatch();
  const { toast } = useSelector((s) => s.ui);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => dispatch(hideToast()), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

  if (!toast) return null;

  const styles = {
    success: { bg: 'bg-green-50 border-green-200', text: 'text-green-800', Icon: CheckCircle },
    error: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', Icon: AlertCircle },
    info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', Icon: Info },
  }[toast.type || 'info'];

  const { Icon } = styles;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg min-w-[300px] ${styles.bg}`}>
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.text}`} />
        <p className={`text-sm flex-1 ${styles.text}`}>{toast.message}</p>
        <button
          onClick={() => dispatch(hideToast())}
          className={`${styles.text} hover:opacity-70`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}