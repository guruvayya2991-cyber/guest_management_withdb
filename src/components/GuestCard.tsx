import { StatusBadge } from '@/components/StatusBadge';
import { formatDuration, formatRemaining, formatSerial, formatTime } from '@/lib/time';
import type { Guest, GuestStatus } from '@/lib/types';
import { Clock, Edit, Plus, X } from 'lucide-react';

interface GuestCardProps {
  guest: Guest;
  status: GuestStatus;
  remainingMs: number;
  extensionCount: number;
  onExtend: () => void;
  onEdit: () => void;
  onMarkOut: () => void;
  onCancel: () => void;
}

export function GuestCard({ guest, status, remainingMs, extensionCount, onExtend, onEdit, onMarkOut, onCancel }: GuestCardProps) {
  const isActive = status === 'active' || status === 'ending_soon' || status === 'time_over';

  const cardTint =
    status === 'time_over' ? 'border-red-400 bg-red-50/90 shadow-red-100'
    : status === 'ending_soon' ? 'border-amber-400 bg-amber-50/70 shadow-amber-100'
    : status === 'completed' ? 'border-slate-200 bg-slate-50/40'
    : status === 'cancelled' ? 'border-slate-200 bg-slate-50/40 opacity-70'
    : 'border-slate-200 bg-white';

  const remainingColor = status === 'time_over' ? 'text-red-700 font-black' : status === 'ending_soon' ? 'text-amber-700 font-bold' : 'text-slate-900 font-semibold';

  return (
    <div className={`rounded-2xl border-2 ${cardTint} p-4 shadow-sm transition-colors`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              #{formatSerial(guest.serial_number)}
            </span>
            <h3 className="text-base font-bold text-slate-900">{guest.guest_name}</h3>
            {guest.guest_type && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                guest.guest_type === 'new' ? 'bg-cyan-100 text-cyan-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {guest.guest_type === 'new' ? 'New Guest' : 'Existing'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs">
            <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
              guest.play_area === 'soft_play' ? 'bg-pink-100 text-pink-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {guest.play_area === 'soft_play' ? 'Soft Play' : 'Trampoline Park'}
            </span>
            <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-semibold text-[11px]">
              Socks: {guest.socks_size ? guest.socks_size.charAt(0).toUpperCase() + guest.socks_size.slice(1) : 'Medium'}
            </span>
            {extensionCount > 0 && (
              <span className="text-xs text-cyan-600 font-semibold inline-block">+{extensionCount} ext</span>
            )}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Entry</p>
          <p className="text-slate-700 font-semibold tabular-nums">{formatTime(guest.in_time)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Duration</p>
          <p className="text-slate-700 font-semibold">{formatDuration(guest.duration_minutes)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Expected Out</p>
          <p className="text-slate-700 font-semibold tabular-nums">{formatTime(guest.expected_out_time)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{isActive ? 'Remaining' : 'Actual Out'}</p>
          {isActive ? (
            <p className={`font-bold tabular-nums ${remainingColor}`}>{formatRemaining(remainingMs)}</p>
          ) : guest.actual_out_time ? (
            <p className="text-slate-500 font-semibold tabular-nums">{formatTime(guest.actual_out_time)}</p>
          ) : (
            <p className="text-slate-300">—</p>
          )}
        </div>
      </div>

      {guest.remarks && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-slate-50 text-sm text-slate-600">
          <span className="font-semibold">Remarks:</span> {guest.remarks}
        </div>
      )}

      {isActive ? (
        <div className="grid grid-cols-3 gap-2">
          <button onClick={onExtend} className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-cyan-50 text-cyan-700 font-semibold text-xs border border-cyan-200 hover:bg-cyan-100 transition-colors">
            <Plus className="w-4 h-4" /> Extend
          </button>
          <button onClick={onMarkOut} className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200 hover:bg-emerald-100 transition-colors">
            <Clock className="w-4 h-4" /> Mark Out
          </button>
          <button onClick={onEdit} className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-slate-50 text-slate-600 font-semibold text-xs border border-slate-200 hover:bg-slate-100 transition-colors">
            <Edit className="w-4 h-4" /> Edit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onEdit} className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-slate-50 text-slate-600 font-semibold text-xs border border-slate-200 hover:bg-slate-100 transition-colors">
            <Edit className="w-4 h-4" /> Edit
          </button>
          <button onClick={onCancel} className="flex items-center justify-center gap-1 py-2.5 rounded-xl bg-amber-50 text-amber-700 font-semibold text-xs border border-amber-200 hover:bg-amber-100 transition-colors">
            <X className="w-4 h-4" /> Cancel
          </button>
        </div>
      )}
    </div>
  );
}
