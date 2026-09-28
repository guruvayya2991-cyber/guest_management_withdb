import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { markAllOverdueGuestsOut } from '@/lib/guestOps';
import { showToast } from '@/components/Toast';
import { CheckCircle2, Clock } from 'lucide-react';

interface MarkAllOverdueModalProps {
  open: boolean;
  onClose: () => void;
  overdueGuestIds: string[];
  onDone: () => void;
}

export function MarkAllOverdueModal({ open, onClose, overdueGuestIds, onDone }: MarkAllOverdueModalProps) {
  const [loading, setLoading] = useState(false);
  const count = overdueGuestIds.length;

  if (!open || count === 0) return null;

  async function handleConfirm() {
    try {
      setLoading(true);
      const updatedCount = await markAllOverdueGuestsOut(overdueGuestIds, new Date());
      showToast(`${updatedCount} overdue guests marked as completed.`, 'success');
      onDone();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      showToast('Could not complete overdue guests. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Complete All Overdue Guests?" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200/80 text-red-800">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-red-900 leading-tight">Complete All Overdue Guests?</h4>
            <p className="text-xs text-red-700 font-medium mt-1 leading-relaxed">
              This will mark all <span className="font-extrabold text-red-900 underline">{count}</span> currently overdue guests as completed and move them to History.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            {loading ? 'MARKING OUT...' : 'MARK ALL OUT'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
