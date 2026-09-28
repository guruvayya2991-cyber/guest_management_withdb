import { useState } from 'react';
import { Modal } from '@/components/Modal';
import { deleteAllCompletedGuestsFromSupabase } from '@/lib/guestOps';
import { showToast } from '@/components/Toast';
import { Trash2 } from 'lucide-react';

interface DeleteCompletedModalProps {
  open: boolean;
  onClose: () => void;
  count: number;
  onDone: () => void;
}

export function DeleteCompletedModal({ open, onClose, count, onDone }: DeleteCompletedModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open || count === 0) return null;

  async function handleConfirm() {
    try {
      setLoading(true);
      const deletedCount = await deleteAllCompletedGuestsFromSupabase();
      showToast(`${deletedCount} completed guest record(s) permanently deleted.`, 'success');
      onDone();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Could not delete completed guests. Please try again.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Delete All Completed Guests?" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200/80 text-red-800">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-red-900 leading-tight">Are you sure you want to delete all completed guests?</h4>
            <p className="text-xs text-red-700 font-medium mt-1 leading-relaxed">
              This action will permanently delete <span className="font-extrabold text-red-900 underline">{count}</span> completed guest record(s) from the central Supabase database. Active and Time Over guests will remain completely safe.
            </p>
            <p className="text-[11px] font-bold text-red-600 mt-2">
              This action cannot be undone.
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
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold transition-all shadow-md shadow-red-600/20 disabled:opacity-50 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            {loading ? 'Deleting...' : 'Delete All'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
