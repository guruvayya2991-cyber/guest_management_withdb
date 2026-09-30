import { useEffect } from 'react';
import { CheckCircle2, Sparkles, Users } from 'lucide-react';

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  count?: number;
  autoCloseMs?: number;
}

export function SuccessModal({ open, onClose, title, subtitle, count, autoCloseMs = 2200 }: SuccessModalProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseMs);
    return () => clearTimeout(timer);
  }, [open, onClose, autoCloseMs]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-[scaleIn_0.25s_cubic-bezier(0.175,0.885,0.32,1.275)]">
        {/* Animated Checkmark Circle */}
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center animate-pulse-glow">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pop-check">
              {count && count > 1 ? (
                <Users className="w-8 h-8 text-white stroke-[2.5]" />
              ) : (
                <CheckCircle2 className="w-9 h-9 text-white stroke-[2.5]" />
              )}
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-emerald-500 absolute -top-1 -right-1 animate-bounce" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">{title}</h3>

        {/* Subtitle / Details */}
        {subtitle && <p className="text-sm font-semibold text-slate-500">{subtitle}</p>}

        {count && count > 1 && (
          <div className="mt-3 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide">
            {count} Guest Profiles Created
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
