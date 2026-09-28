import { Modal } from '@/components/Modal';
import { formatTime } from '@/lib/time';
import { markGuestOut } from '@/lib/guestOps';
import { showToast } from '@/components/Toast';
import type { Guest } from '@/lib/types';
import { AlertTriangle, CheckCircle2, Clock, Plus, X } from 'lucide-react';

interface TimeOverAlertProps {
  guest: Guest | null;
  onClose: () => void;
  onMarkOut: () => void;
  onExtend?: (guest: Guest) => void;
}

export function TimeOverAlert({ guest, onClose, onMarkOut, onExtend }: TimeOverAlertProps) {
  if (!guest) return null;

  async function handleMarkOut() {
    try {
      await markGuestOut(guest!.id, new Date());
      showToast('Guest Marked Out Successfully', 'success');
      onMarkOut();
      onClose();
    } catch (err) {
      console.error(err);
    }
  }

  function handleExtend() {
    onClose();
    if (onExtend) {
      onExtend(guest!);
    }
  }

  return (
    <Modal open={!!guest} onClose={onClose} title="" maxWidth="max-w-md" closeOnBackdrop={false}>
      <div className="text-center -mt-2">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3 shadow-sm border border-red-200">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-black uppercase tracking-widest mb-2">
          TIME OVER
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-1">{guest.guest_name}'s play time has ended.</h2>
        <p className="text-slate-600 text-sm mb-5">
          Please inform the guest their session is complete.
        </p>

        <div className="px-4 py-3 rounded-2xl bg-red-50/80 border border-red-200/80 mb-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-600 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-red-500" /> Expected Out Time
            </span>
            <span className="font-black text-red-600 text-base tabular-nums">{formatTime(guest.expected_out_time)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
          <button
            onClick={handleMarkOut}
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark Out
          </button>
          <button
            onClick={handleExtend}
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-cyan-500 text-white font-bold text-sm shadow-md shadow-cyan-500/20 hover:bg-cyan-600 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Extend Time
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-600 font-semibold text-xs hover:bg-slate-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" /> Close Alert
        </button>
      </div>
    </Modal>
  );
}
