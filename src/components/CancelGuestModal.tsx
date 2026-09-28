import { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { cancelGuest, deleteGuest } from '@/lib/guestOps';
import type { Guest } from '@/lib/types';
import { Loader2, Trash2 } from 'lucide-react';

interface CancelGuestModalProps {
  open: boolean;
  onClose: () => void;
  guest: Guest | null;
  onDone: () => void;
  isAdmin: boolean;
}

export function CancelGuestModal({ open, onClose, guest, onDone, isAdmin }: CancelGuestModalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setBusy(false); setError(null); }
  }, [open]);

  if (!guest) return null;

  async function handleCancel() {
    setBusy(true);
    setError(null);
    try {
      await cancelGuest(guest!.id);
      onDone();
      onClose();
    } catch (err) {
      setError('Unable to cancel guest. Please try again.');
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      await deleteGuest(guest!.id);
      onDone();
      onClose();
    } catch (err) {
      setError('Unable to delete guest. Please try again.');
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Remove Guest" maxWidth="max-w-sm">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Are you sure you want to remove <span className="font-bold text-slate-900">{guest.guest_name}</span>?
        </p>

        <div className="space-y-2">
          <button
            onClick={handleCancel}
            disabled={busy}
            className="w-full py-3 rounded-xl bg-amber-50 text-amber-700 font-bold text-sm border border-amber-200 hover:bg-amber-100 transition-all disabled:opacity-60"
          >
            Cancel Guest (keep in history)
          </button>
          <p className="text-xs text-slate-400 text-center">Marks the guest as cancelled. Record stays in today's history.</p>

          {isAdmin && (
            <>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-700 font-bold text-sm border border-red-200 hover:bg-red-100 transition-all disabled:opacity-60"
              >
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                Delete Permanently
              </button>
              <p className="text-xs text-slate-400 text-center">Admin only. Removes the record entirely.</p>
            </>
          )}
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <button
          onClick={onClose}
          disabled={busy}
          className="w-full py-2.5 rounded-xl text-slate-500 font-semibold text-sm hover:bg-slate-100 transition-all"
        >
          Keep Guest
        </button>
      </div>
    </Modal>
  );
}
