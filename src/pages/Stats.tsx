import { useEffect, useMemo, useState } from 'react';
import type { Page } from '@/App';
import { idbGetAllGuests } from '@/lib/idb';
import type { Extension, Guest, GuestStatus } from '@/lib/types';
import { getDayKey, formatShortDate } from '@/lib/time';
import { HeaderMenu } from '@/components/HeaderMenu';
import { ArrowLeft, Activity, AlertTriangle, CheckCircle2, Clock, TrendingUp, Users, CreditCard } from 'lucide-react';

interface StatsProps {
  onNavigate: (page: Page) => void;
}

interface StatsRow extends Guest {
  extensions: Extension[];
}

export function Stats({ onNavigate }: StatsProps) {
  const [rows, setRows] = useState<StatsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const todayKey = getDayKey(new Date());

  useEffect(() => {
    async function load() {
      try {
        const all = await idbGetAllGuests();
        const todayRows = all.filter((g) => getDayKey(g.created_at) === todayKey);
        setRows(todayRows);
      } catch (err) {
        console.error('Error loading stats from IndexedDB:', err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [todayKey]);

  const stats = useMemo(() => {
    let active = 0, completed = 0, timeOver = 0, totalMin = 0, extCount = 0;
    let trampoline = 0, softPlay = 0, newGuest = 0, existingGuest = 0;
    let basicCard = 0, premiumCard = 0;
    for (const r of rows) {
      const s = r.status as GuestStatus;
      if (s === 'active' || s === 'ending_soon') active++;
      else if (s === 'completed') completed++;
      else if (s === 'time_over') timeOver++;
      totalMin += r.duration_minutes;
      extCount += r.extensions?.length ?? 0;

      if (r.play_area === 'soft_play') softPlay++;
      else trampoline++;

      if (r.guest_type === 'existing') existingGuest++;
      else newGuest++;

      if (r.card_type === 'premium') premiumCard++;
      else basicCard++;
    }
    const totalGuests = rows.length;
    const avgMin = totalGuests > 0 ? Math.round(totalMin / totalGuests) : 0;
    return { totalGuests, active, completed, timeOver, totalMin, avgMin, extCount, trampoline, softPlay, newGuest, existingGuest, basicCard, premiumCard };
  }, [rows]);

  const cards = [
    { label: 'Total Guests', value: stats.totalGuests, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Trampoline Park', value: stats.trampoline, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Soft Play', value: stats.softPlay, icon: TrendingUp, color: 'text-pink-600', bg: 'bg-pink-50' },
    { label: 'New Guests', value: stats.newGuest, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { label: 'Existing Guests', value: stats.existingGuest, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Basic Cards', value: stats.basicCard, icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Premium Cards', value: stats.premiumCard, icon: CreditCard, color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'Active', value: stats.active, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-slate-500', bg: 'bg-slate-50' },
    { label: 'Time Over', value: stats.timeOver, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Total Play Hours', value: (stats.totalMin / 60).toFixed(1), icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  // Bar chart: guests by status
  const statusBars = [
    { label: 'Active', count: stats.active, color: 'bg-emerald-500' },
    { label: 'Completed', count: stats.completed, color: 'bg-slate-400' },
    { label: 'Time Over', count: stats.timeOver, color: 'bg-red-500' },
  ];
  const maxBar = Math.max(...statusBars.map((b) => b.count), 1);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('dashboard')} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer" title="Back to Dashboard">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">Daily Statistics</h1>
              <p className="text-xs text-slate-500 font-medium">{formatShortDate(new Date())}</p>
            </div>
          </div>

          <HeaderMenu onNavigate={onNavigate} currentPage="stats" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading statistics...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
              {cards.map((c) => (
                <div key={c.label} className={`rounded-2xl border border-slate-200 ${c.bg} p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <c.icon className={`w-4 h-4 ${c.color}`} />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{c.label}</span>
                  </div>
                  <p className={`text-2xl font-extrabold ${c.color} tabular-nums`}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Guests by Status</h2>
              <div className="space-y-3">
                {statusBars.map((b) => (
                  <div key={b.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-semibold text-slate-600">{b.label}</span>
                      <span className="font-bold text-slate-900 tabular-nums">{b.count}</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full ${b.color} rounded-full transition-all duration-500`} style={{ width: `${(b.count / maxBar) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
