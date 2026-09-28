import { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { EXTENSION_PRESETS } from '@/lib/types';
import { addMinutes, formatTime } from '@/lib/time';
import { extendGuestTime } from '@/lib/guestOps';
import { showToast } from '@/components/Toast';
import type { Guest } from '@/lib/types';
import { Plus } from 'lucide-react';

interface ExtendTimeModalProps {
  open: boolean;
  onClose: () => void;
  guest: Guest | null;
  onDone: () => void;
}

export function ExtendTimeModal({ open, onClose, guest, onDone }: ExtendTimeModalProps) {
  const [minutes, setMinutes] = useState(2);
  const [custom, setCustom] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMinutes(2);
      setCustom('');
      setUseCustom(false);
      setError(null);
    }
  }, [open]);

  if (!guest) return null;

  const effMinutes = useCustom ? (parseInt(custom, 10) || 0) : minutes;
  const currentExpectedMs = new Date(guest.expected_out_time).getTime();
  const nowMs = Date.now();
  const baseMs = currentExpectedMs < nowMs ? nowMs : currentExpectedMs;
  const newOut = new Date(baseMs + effMinutes * 60000);

  async function handleExtend() {
    if (effMinutes <= 0) {
      setError('Please enter a valid duration.');
      return;
    }

    try {
      await extendGuestTime(guest!, effMinutes);
      showToast(`Added +${effMinutes} mins for ${guest!.guest_name}`, 'success');
      onDone();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Unable to extend time.');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Extend Time — ${guest.guest_name}`} maxWidth="max-w-md">
      <div className="space-y-5">
        <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-600">Current Out Time</span>
            <span className="font-bold text-slate-900 tabular-nums">{formatTime(guest.expected_out_time)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Add Extra Time</label>
          <div className="grid grid-cols-3 gap-2">
            {EXTENSION_PRESETS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => { setMinutes(d.value); setUseCustom(false); }}
                className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  !useCustom && minutes === d.value
                    ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {d.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUseCustom(true)}
              className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                useCustom ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              Custom
            </button>
          </div>
          {useCustom && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Minutes"
                min={1}
                autoFocus
                className="w-32 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-900"
              />
              <span className="text-sm text-slate-500">minutes</span>
            </div>
          )}
        </div>

        <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-emerald-900">New Out Time</span>
            <span className="text-lg font-bold text-emerald-700 tabular-nums">{formatTime(newOut)}</span>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <button
          onClick={handleExtend}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/30 hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-5 h-5" /> Extend Time
        </button>
      </div>
    </Modal>
  );
}
