import { Modal } from '@/components/Modal';
import { formatTime } from '@/lib/time';
import { markGuestOut } from '@/lib/guestOps';
import { showToast } from '@/components/Toast';
import type { Guest } from '@/lib/types';
import { CheckCircle2, LogOut } from 'lucide-react';

interface MarkOutModalProps {
  open: boolean;
  onClose: () => void;
  guest: Guest | null;
  onDone: () => void;
}

export function MarkOutModal({ open, onClose, guest, onDone }: MarkOutModalProps) {
  if (!guest) return null;

  const actualOut = new Date();
  const expected = new Date(guest.expected_out_time);
  const diffMin = Math.round((actualOut.getTime() - expected.getTime()) / 60000);
  const overdue = diffMin > 0;

  async function handleConfirm() {
    try {
      await markGuestOut(guest!.id, new Date());
      showToast('Guest Marked Out Successfully', 'success');
      onDone();
      onClose();
    } catch (err) {
      console.error('Error marking guest out:', err);
      showToast('Failed to mark guest out', 'error');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Confirm Guest Out" maxWidth="max-w-sm">
      <div className="space-y-4">
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <LogOut className="w-7 h-7 text-slate-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{guest.guest_name}</h3>
        </div>

        <div className="space-y-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-500">Expected Out</span>
            <span className="font-bold text-slate-900 tabular-nums">{formatTime(expected)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-500">Actual Out</span>
            <span className="font-bold text-slate-900 tabular-nums">{formatTime(actualOut)}</span>
          </div>
          {overdue && (
            <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200">
              <span className="font-semibold text-red-500">Overdue</span>
              <span className="font-bold text-red-600">{diffMin} min over</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
            Mark Out
          </button>
        </div>
      </div>
    </Modal>
  );
}
