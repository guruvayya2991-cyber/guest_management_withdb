import { useMemo, useState, useRef, useEffect } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDuration, formatRemaining, formatSerial, formatTime } from '@/lib/time';
import type { Guest, GuestStatus } from '@/lib/types';
import { Clock, Edit, MoreVertical, Plus, X } from 'lucide-react';

interface GuestRowProps {
  guest: Guest;
  status: GuestStatus;
  remainingMs: number;
  extensionCount: number;
  onExtend: () => void;
  onEdit: () => void;
  onMarkOut: () => void;
  onCancel: () => void;
  isAdmin?: boolean;
}

export function GuestRow({ guest, status, remainingMs, extensionCount, onExtend, onEdit, onMarkOut, onCancel }: GuestRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const rowTint = useMemo(() => {
    switch (status) {
      case 'time_over': return 'bg-red-50 hover:bg-red-100/80 border-l-4 border-l-red-600';
      case 'ending_soon': return 'bg-amber-50/70 hover:bg-amber-100 border-l-4 border-l-amber-500';
      case 'completed': return 'bg-slate-50/40 hover:bg-slate-50';
      case 'cancelled': return 'bg-slate-50/40 opacity-60 hover:opacity-100';
      default: return 'hover:bg-slate-50';
    }
  }, [status]);

  const isActive = status === 'active' || status === 'ending_soon' || status === 'time_over';
  const remainingColor = status === 'time_over' ? 'text-red-700 font-extrabold' : status === 'ending_soon' ? 'text-amber-700 font-bold' : 'text-slate-800 font-semibold';

  return (
    <tr className={`border-b border-slate-100 transition-colors ${rowTint}`}>
      <td className="px-3 py-3 text-center text-sm font-extrabold text-slate-500 tabular-nums">
        {formatSerial(guest.serial_number)}
      </td>
      <td className="px-3 py-3 text-sm font-bold text-slate-900">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="truncate max-w-[170px] font-bold text-slate-900">{guest.guest_name}</span>
            {guest.guest_type && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 ${
                guest.guest_type === 'new' ? 'bg-cyan-100 text-cyan-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {guest.guest_type === 'new' ? 'New' : 'Exist'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-medium flex-wrap">
            <span className={`px-1.5 py-0.2 rounded font-semibold ${
              guest.play_area === 'soft_play' ? 'bg-pink-50 text-pink-700 border border-pink-200/60' : 'bg-purple-50 text-purple-700 border border-purple-200/60'
            }`}>
              {guest.play_area === 'soft_play' ? 'Soft Play' : 'Trampoline'}
            </span>
            <span>•</span>
            <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-semibold border border-indigo-200/60 uppercase">
              Socks: {guest.socks_size ? guest.socks_size.charAt(0).toUpperCase() + guest.socks_size.slice(1) : 'Medium'}
            </span>
            <span>•</span>
            <span className={`px-1.5 py-0.2 rounded font-semibold border ${
              guest.card_type === 'premium' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {guest.card_type === 'premium' ? 'Premium Card' : 'Basic Card'}
            </span>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-sm text-slate-600 tabular-nums whitespace-nowrap">{formatTime(guest.in_time)}</td>
      <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDuration(guest.duration_minutes)}</td>
      <td className="px-3 py-3 text-sm text-slate-600 tabular-nums whitespace-nowrap">{formatTime(guest.expected_out_time)}</td>
      <td className="px-3 py-3 text-sm tabular-nums whitespace-nowrap">
        {isActive ? (
          <span className={remainingColor}>{formatRemaining(remainingMs)}</span>
        ) : guest.actual_out_time ? (
          <span className="text-slate-400">{formatTime(guest.actual_out_time)}</span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
      <td className="px-3 py-3"><StatusBadge status={status} /></td>
      <td className="px-3 py-3 text-sm text-slate-500 max-w-[150px] truncate" title={guest.remarks ?? ''}>
        {guest.remarks ?? '—'}
        {extensionCount > 0 && <span className="ml-1 text-cyan-600 font-semibold" title={`${extensionCount} extension(s)`}>+{extensionCount}ext</span>}
      </td>
      <td className="px-3 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          {isActive && (
            <>
              <button onClick={onExtend} title="Extend Time" className="p-2 rounded-lg text-cyan-600 hover:bg-cyan-50 transition-colors cursor-pointer">
                <Plus className="w-4 h-4" />
              </button>
              <button onClick={onMarkOut} title="Mark As Out" className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer">
                <Clock className="w-4 h-4" />
              </button>
            </>
          )}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen((v) => !v)} title="More actions" className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer">
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-10 animate-[fadeIn_0.1s]">
                <button onClick={() => { setMenuOpen(false); onEdit(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => { setMenuOpen(false); onCancel(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors">
                  <X className="w-4 h-4" /> Cancel Guest
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}
