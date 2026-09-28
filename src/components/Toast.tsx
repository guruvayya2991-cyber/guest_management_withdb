import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

export function showToast(message: string, type: ToastType = 'success') {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent<ToastMessage>('unlimited_fun_toast', {
      detail: {
        id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        message,
      },
    });
    window.dispatchEvent(event);
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastMessage>;
      if (customEvent.detail) {
        const item = customEvent.detail;
        setToasts((prev) => [...prev, item]);

        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== item.id));
        }, 3000);
      }
    };

    window.addEventListener('unlimited_fun_toast', handleToast);
    return () => {
      window.removeEventListener('unlimited_fun_toast', handleToast);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold pointer-events-auto animate-[slideIn_0.2s_ease-out] ${
            t.type === 'success'
              ? 'bg-emerald-900/95 text-emerald-100 border-emerald-700/60 shadow-emerald-950/40 backdrop-blur'
              : t.type === 'error'
              ? 'bg-red-900/95 text-red-100 border-red-700/60 shadow-red-950/40 backdrop-blur'
              : 'bg-slate-900/95 text-slate-100 border-slate-700/60 shadow-slate-950/40 backdrop-blur'
          }`}
        >
          {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {t.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
          {t.type === 'info' && <Info className="w-5 h-5 text-cyan-400 shrink-0" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
