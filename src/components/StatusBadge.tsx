import type { GuestStatus } from '@/lib/types';

const STYLES: Record<GuestStatus, { label: string; dot: string; badge: string }> = {
  active: {
    label: 'ACTIVE',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  ending_soon: {
    label: 'ENDING SOON',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  time_over: {
    label: 'TIME OVER',
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200',
  },
  completed: {
    label: 'COMPLETED',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  cancelled: {
    label: 'CANCELLED',
    dot: 'bg-slate-300',
    badge: 'bg-slate-50 text-slate-400 border-slate-200',
  },
};

export function StatusBadge({ status, size = 'sm' }: { status: GuestStatus; size?: 'sm' | 'xs' }) {
  const s = STYLES[status];
  const pad = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 ${pad} font-bold rounded-full border ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
