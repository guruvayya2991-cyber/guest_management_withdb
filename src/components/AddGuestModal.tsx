import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Modal } from '@/components/Modal';
import { DURATION_PRESETS, REMARK_SUGGESTIONS } from '@/lib/types';
import { addMinutes, formatTime, parseTimeOnDate, toLocalInputValue } from '@/lib/time';
import { addGuest } from '@/lib/guestOps';
import { showToast } from '@/components/Toast';
import { Plus, User } from 'lucide-react';

interface AddGuestModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export function AddGuestModal({ open, onClose, onAdded }: AddGuestModalProps) {
  const [guestName, setGuestName] = useState('');
  const [inTime, setInTime] = useState(() => toLocalInputValue(new Date()));
  const [duration, setDuration] = useState<number>(30);
  const [customDuration, setCustomDuration] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form each time it opens
  useEffect(() => {
    if (open) {
      setGuestName('');
      setInTime(toLocalInputValue(new Date()));
      setDuration(30);
      setCustomDuration('');
      setUseCustom(false);
      setRemarks('');
      setSaving(false);
      setError(null);
    }
  }, [open]);

  const effectiveDuration = useMemo(() => {
    if (useCustom) {
      const n = parseInt(customDuration, 10);
      return Number.isFinite(n) && n > 0 ? n : 0;
    }
    return duration;
  }, [useCustom, customDuration, duration]);

  const inTimeDate = useMemo(() => parseTimeOnDate(inTime || toLocalInputValue(new Date())), [inTime]);
  const expectedOut = useMemo(() => addMinutes(inTimeDate, effectiveDuration), [inTimeDate, effectiveDuration]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = guestName.trim();
    if (!trimmedName) {
      setError('Please enter guest name.');
      return;
    }
    if (effectiveDuration <= 0) {
      setError('Please select play duration.');
      return;
    }

    try {
      setSaving(true);
      await addGuest({
        guest_name: trimmedName,
        in_time: inTimeDate,
        duration_minutes: effectiveDuration,
        remarks: remarks.trim() || null,
      });

      showToast('Guest Added Successfully', 'success');
      onAdded();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to save guest to central database.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add New Guest" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Guest Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Guest Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={guestName}
              onChange={(e) => {
                setGuestName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Rahul / Mahi"
              autoFocus
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-900 placeholder:text-slate-400 font-medium text-sm"
            />
          </div>
        </div>

        {/* In Time */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">In Time</label>
          <input
            type="time"
            value={inTime}
            onChange={(e) => setInTime(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-900 text-sm"
          />
          <p className="text-xs text-slate-400 mt-1">Defaults to current time. Edit if needed.</p>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Play Duration <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DURATION_PRESETS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => {
                  setDuration(d.value);
                  setUseCustom(false);
                }}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                  !useCustom && duration === d.value
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
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                useCustom
                  ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              Custom
            </button>
          </div>
          {useCustom && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder="Minutes"
                min={1}
                className="w-32 px-4 py-2 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-900 text-sm"
              />
              <span className="text-sm text-slate-500">minutes</span>
            </div>
          )}
        </div>

        {/* Out Time (auto) */}
        <div className="px-4 py-3 rounded-xl bg-cyan-50 border border-cyan-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-cyan-900">Expected Out Time</span>
            <span className="text-base sm:text-lg font-bold text-cyan-700 tabular-nums">{formatTime(expectedOut)}</span>
          </div>
          <p className="text-xs text-cyan-600 mt-0.5">Auto-calculated from In Time + Duration</p>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Remarks <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Birthday, Group, Extra Time"
            list="remark-suggestions"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-900 placeholder:text-slate-400 text-sm"
          />
          <datalist id="remark-suggestions">
            {REMARK_SUGGESTIONS.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-extrabold text-sm shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50"
        >
          <Plus className="w-5 h-5" /> {saving ? 'Adding Guest...' : 'Add Guest'}
        </button>
      </form>
    </Modal>
  );
}
