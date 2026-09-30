import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Modal } from '@/components/Modal';
import {
  GUEST_TYPE_OPTIONS,
  PLAY_AREA_OPTIONS,
  SOCKS_SIZE_OPTIONS,
  CARD_TYPE_OPTIONS,
  type GuestType,
  type PlayArea,
  type SocksSize,
  type CardType,
} from '@/lib/types';
import { addBulkGuests } from '@/lib/guestOps';
import { showToast } from '@/components/Toast';
import { Sparkles, Users, UserCheck, MapPin, Footprints, CreditCard } from 'lucide-react';
import { SuccessModal } from '@/components/SuccessModal';

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

  const [guestType, setGuestType] = useState<GuestType>('new');
  const [playArea, setPlayArea] = useState<PlayArea>('trampoline');
  const [socksSize, setSocksSize] = useState<SocksSize>('medium');
  const [cardType, setCardType] = useState<CardType>('basic');

  const [namesText, setNamesText] = useState('');
  const [duration, setDuration] = useState<number>(60);
  const [customDuration, setCustomDuration] = useState('');
  const [useCustomDuration, setUseCustomDuration] = useState(false);
  const [remarks, setRemarks] = useState('Bulk Entry');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState(0);

  useEffect(() => {
    if (open) {
      setGuestCount(10);
      setCustomCount('');
      setUseCustomCount(false);
      setGuestType('new');
      setPlayArea('trampoline');
      setSocksSize('medium');
      setCardType('basic');
      setNamesText('');
      setDuration(60);
      setCustomDuration('');
      setUseCustomDuration(false);
      setRemarks('Bulk Entry');
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
        guest_type: guestType,
        play_area: playArea,
        socks_size: socksSize,
        card_type: cardType,
        in_time: now,
        duration_minutes: effectiveDuration,
        remarks: remarks.trim() || 'Bulk Entry',
      }));

      await addBulkGuests(payload);
      showToast(`Added ${finalNames.length} guests to central database`, 'success');
      onAdded();
      setAddedCount(finalNames.length);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error adding bulk guests.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  if (addedCount > 0) {
    return (
      <SuccessModal
        open={addedCount > 0}
        onClose={() => {
          setAddedCount(0);
          onClose();
        }}
        title="✓ Guests Added Successfully"
        subtitle={`${addedCount} guest profiles initialized & timing active`}
        count={addedCount}
      />
    );
  }

  const finalGuestCount = parsedNames.length > 0 ? parsedNames.length : effectiveCount;

  return (
    <Modal open={open} onClose={onClose} title="Bulk Add Guests" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
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
                className={`py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
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
              className={`py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
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

        {/* 1. Guest Type */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-cyan-600" />
            Guest Type for all guests <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GUEST_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGuestType(opt.value)}
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                  guestType === opt.value
                    ? 'bg-cyan-600 border-cyan-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Play Area */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-cyan-600" />
            Play Area for all guests <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PLAY_AREA_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPlayArea(opt.value)}
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                  playArea === opt.value
                    ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Socks Size */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Footprints className="w-4 h-4 text-cyan-600" />
            Socks Size for all guests <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SOCKS_SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSocksSize(opt.value)}
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                  socksSize === opt.value
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Card Type */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-amber-600" />
            Card Type for all guests <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CARD_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCardType(opt.value)}
                className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                  cardType === opt.value
                    ? 'bg-amber-600 border-amber-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
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
                className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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
              className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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
              className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 hover:text-cyan-700 hover:underline cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" /> Auto-fill {effectiveCount} names
            </button>
          </div>
          <textarea
            rows={4}
            value={namesText}
            onChange={(e) => setNamesText(e.target.value)}
            placeholder={`Rahul\nSuresh\nPriya\nAnil\n...(or leave blank to auto-create ${effectiveCount} guests)`}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-900 font-mono text-sm leading-relaxed placeholder:text-slate-400"
          />
          <p className="text-xs text-slate-400 mt-1">
            {parsedNames.length > 0 ? `${parsedNames.length} names detected` : `Will auto-create ${effectiveCount} profiles`}
          </p>
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
            placeholder="Bulk Entry"
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-cyan-500 outline-none text-slate-900 text-sm font-medium"
          />
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium animate-shake">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Users className="w-5 h-5" /> {saving ? 'Adding Guests...' : `ADD ${finalGuestCount} GUESTS`}
        </button>
      </form>
    </Modal>
  );
}
