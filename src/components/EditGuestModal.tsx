import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/Modal';
import {
  DURATION_PRESETS,
  PLAY_AREA_OPTIONS,
  SOCKS_SIZE_OPTIONS,
  GUEST_TYPE_OPTIONS,
  type Guest,
  type PlayArea,
  type SocksSize,
  type GuestType,
} from '@/lib/types';
import { addMinutes, formatTime, parseTimeOnDate, toLocalInputValue } from '@/lib/time';
import { updateGuest } from '@/lib/guestOps';
import { showToast } from '@/components/Toast';
import { Save, User, MapPin, Footprints, UserCheck } from 'lucide-react';

interface EditGuestModalProps {
  open: boolean;
  onClose: () => void;
  guest: Guest | null;
  onDone: () => void;
}

export function EditGuestModal({ open, onClose, guest, onDone }: EditGuestModalProps) {
  const [name, setName] = useState('');
  const [guestType, setGuestType] = useState<GuestType>('new');
  const [playArea, setPlayArea] = useState<PlayArea>('trampoline');
  const [socksSize, setSocksSize] = useState<SocksSize>('medium');
  const [inTime, setInTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [customDuration, setCustomDuration] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && guest) {
      setName(guest.guest_name);
      setGuestType(guest.guest_type || 'new');
      setPlayArea(guest.play_area || 'trampoline');
      setSocksSize(guest.socks_size || 'medium');
      setInTime(toLocalInputValue(guest.in_time));
      const preset = DURATION_PRESETS.find((d) => d.value === guest.duration_minutes);
      if (preset) {
        setDuration(guest.duration_minutes);
        setUseCustom(false);
      } else {
        setUseCustom(true);
        setCustomDuration(String(guest.duration_minutes));
      }
      setRemarks(guest.remarks ?? '');
      setSaving(false);
      setError(null);
    }
  }, [open, guest]);

  const effDuration = useMemo(() => {
    if (useCustom) return parseInt(customDuration, 10) || 0;
    return duration;
  }, [useCustom, customDuration, duration]);

  const inDate = useMemo(() => parseTimeOnDate(inTime || '00:00'), [inTime]);
  const expectedOut = useMemo(() => addMinutes(inDate, effDuration), [inDate, effDuration]);

  if (!guest) return null;

  async function handleSave() {
    if (!name.trim()) { setError('Please enter guest name.'); return; }
    if (effDuration <= 0) { setError('Please select play duration.'); return; }
    setError(null);

    try {
      setSaving(true);
      await updateGuest(guest!.id, {
        guest_name: name.trim(),
        guest_type: guestType,
        play_area: playArea,
        socks_size: socksSize,
        in_time: inDate.toISOString(),
        duration_minutes: effDuration,
        expected_out_time: expectedOut.toISOString(),
        remarks: remarks.trim() || null,
      });
      showToast('Guest Updated Successfully', 'success');
      onDone();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Unable to save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Edit Guest — ${guest.guest_name}`} maxWidth="max-w-lg">
      <div className="space-y-4">
        {/* Guest Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Guest Name</label>
          <div className="relative">
            <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-900 font-medium text-sm"
            />
          </div>
        </div>

        {/* Guest Type */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-cyan-600" />
            Guest Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GUEST_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGuestType(opt.value)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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

        {/* Play Area */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-cyan-600" />
            Play Area
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PLAY_AREA_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPlayArea(opt.value)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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

        {/* Socks Size */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Footprints className="w-4 h-4 text-cyan-600" />
            Socks Size
          </label>
          <div className="grid grid-cols-3 gap-2">
            {SOCKS_SIZE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSocksSize(opt.value)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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

        {/* In Time */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">In Time</label>
          <input
            type="time"
            value={inTime}
            onChange={(e) => setInTime(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-900 text-sm font-medium"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Play Duration</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DURATION_PRESETS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => { setDuration(d.value); setUseCustom(false); }}
                className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                  !useCustom && duration === d.value ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {d.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUseCustom(true)}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${useCustom ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              Custom
            </button>
          </div>
          {useCustom && (
            <div className="mt-2 flex items-center gap-2">
              <input type="number" value={customDuration} onChange={(e) => setCustomDuration(e.target.value)} placeholder="Minutes" min={1} className="w-32 px-4 py-2 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-900 text-sm font-medium" />
              <span className="text-sm text-slate-500">minutes</span>
            </div>
          )}
        </div>

        {/* Expected Out Time */}
        <div className="px-4 py-3 rounded-xl bg-cyan-50 border border-cyan-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-cyan-900">Expected Out Time</span>
            <span className="text-base sm:text-lg font-bold text-cyan-700 tabular-nums">{formatTime(expectedOut)}</span>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Remarks</label>
          <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-900 text-sm font-medium" />
        </div>

        {error && <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">{error}</div>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white font-extrabold text-sm hover:bg-slate-800 transition-all disabled:opacity-50 shadow-md cursor-pointer"
        >
          <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </Modal>
  );
}
