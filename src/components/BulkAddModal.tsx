import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Modal } from '@/components/Modal';
import { addBulkGuests } from '@/lib/guestOps';
import { showToast } from '@/components/Toast';
import { Sparkles, Users } from 'lucide-react';

interface BulkAddModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

const COUNT_PRESETS = [10, 50, 100];
const DURATION_OPTIONS = [
  { label: '30 Minutes', value: 30 },
  { label: '1 Hour', value: 60 },
  { label: '2 Hours', value: 120 },
  { label: '3 Hours', value: 180 },
];

export function BulkAddModal({ open, onClose, onAdded }: BulkAddModalProps) {
  const [guestCount, setGuestCount] = useState<number>(10);
  const [customCount, setCustomCount] = useState('');
  const [useCustomCount, setUseCustomCount] = useState(false);

  const [namesText, setNamesText] = useState('');
  const [duration, setDuration] = useState<number>(60);
  const [customDuration, setCustomDuration] = useState('');
  const [useCustomDuration, setUseCustomDuration] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setGuestCount(10);
      setCustomCount('');
      setUseCustomCount(false);
      setNamesText('');
      setDuration(60);
      setCustomDuration('');
      setUseCustomDuration(false);
      setError(null);
      setSaving(false);
    }
  }, [open]);

  const effectiveCount = useMemo(() => {
    if (useCustomCount) {
      const n = parseInt(customCount, 10);
      return Number.isFinite(n) && n > 0 ? n : 1;
    }
    return guestCount;
  }, [useCustomCount, customCount, guestCount]);

  const effectiveDuration = useMemo(() => {
    if (useCustomDuration) {
      const n = parseInt(customDuration, 10);
      return Number.isFinite(n) && n > 0 ? n : 0;
    }
    return duration;
  }, [useCustomDuration, customDuration, duration]);

  const parsedNames = useMemo(() => {
    return namesText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }, [namesText]);

  const handleAutoFill = () => {
    const list: string[] = [];
    for (let i = 1; i <= effectiveCount; i++) {
      list.push(`Guest ${String(i).padStart(2, '0')}`);
    }
    setNamesText(list.join('\n'));
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (effectiveDuration <= 0) {
      setError('Please select a valid duration.');
      return;
    }

    let finalNames: string[] = [];
    if (parsedNames.length > 0) {
      finalNames = parsedNames;
    } else {
      for (let i = 1; i <= effectiveCount; i++) {
        finalNames.push(`Guest ${String(i).padStart(2, '0')}`);
      }
    }

    try {
      setSaving(true);
      const now = new Date();
      const payload = finalNames.map((name) => ({
        name,
        in_time: now,
        duration_minutes: effectiveDuration,
        remarks: 'Bulk Entry',
      }));

      await addBulkGuests(payload);
      showToast(`Added ${finalNames.length} guests to central database`, 'success');
      onAdded();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding bulk guests.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  const finalGuestCount = parsedNames.length > 0 ? parsedNames.length : effectiveCount;

  return (
    <Modal open={open} onClose={onClose} title="Bulk Add Guests" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Count Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Number of Guests</label>
          <div className="grid grid-cols-4 gap-2">
            {COUNT_PRESETS.map((cnt) => (
              <button
                key={cnt}
                type="button"
                onClick={() => {
                  setGuestCount(cnt);
                  setUseCustomCount(false);
                }}
                className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                  !useCustomCount && guestCount === cnt
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {cnt} Guests
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUseCustomCount(true)}
              className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                useCustomCount
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              Custom
            </button>
          </div>
          {useCustomCount && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                value={customCount}
                onChange={(e) => setCustomCount(e.target.value)}
                placeholder="e.g. 25"
                min={1}
                max={200}
                className="w-32 px-4 py-2 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-900"
              />
              <span className="text-sm text-slate-500">guests</span>
            </div>
          )}
        </div>

        {/* Duration Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Duration for all guests <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => {
                  setDuration(d.value);
                  setUseCustomDuration(false);
                }}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  !useCustomDuration && duration === d.value
                    ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {d.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUseCustomDuration(true)}
              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                useCustomDuration
                  ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              Custom
            </button>
          </div>
          {useCustomDuration && (
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

        {/* Names text area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Paste Guest Names (1 per line)
            </label>
            <button
              type="button"
              onClick={handleAutoFill}
              className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-700 hover:underline"
            >
              <Sparkles className="w-3.5 h-3.5" /> Auto-fill {effectiveCount} names
            </button>
          </div>
          <textarea
            rows={5}
            value={namesText}
            onChange={(e) => setNamesText(e.target.value)}
            placeholder={`Rahul\nSuresh\nPriya\nAnil\n...(or leave blank to auto-create ${effectiveCount} guests)`}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-900 font-mono text-sm leading-relaxed placeholder:text-slate-400"
          />
          <p className="text-xs text-slate-400 mt-1">
            {parsedNames.length > 0 ? `${parsedNames.length} names detected` : `Will auto-create ${effectiveCount} profiles`}
          </p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50"
        >
          <Users className="w-5 h-5" /> {saving ? 'Adding Guests...' : `ADD ${finalGuestCount} GUESTS`}
        </button>
      </form>
    </Modal>
  );
}
