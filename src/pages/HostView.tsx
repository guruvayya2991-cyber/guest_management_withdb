import { useEffect, useMemo, useRef, useState } from 'react';
import type { Page } from '@/App';
import { useNow } from '@/hooks/useNow';
import { useGuests, computeStatus } from '@/hooks/useGuests';
import { useSettings } from '@/context/SettingsContext';
import { formatLongDate, formatTimeWithSeconds, getDayKey } from '@/lib/time';
import { playAlertSound, showBrowserNotification } from '@/lib/notify';
import type { Guest, PlayArea, SocksSize, GuestType } from '@/lib/types';
import { AddGuestModal } from '@/components/AddGuestModal';
import { BulkAddModal } from '@/components/BulkAddModal';
import { ExtendTimeModal } from '@/components/ExtendTimeModal';
import { EditGuestModal } from '@/components/EditGuestModal';
import { MarkOutModal } from '@/components/MarkOutModal';
import { CancelGuestModal } from '@/components/CancelGuestModal';
import { TimeOverAlert } from '@/components/TimeOverAlert';
import { MarkAllOverdueModal } from '@/components/MarkAllOverdueModal';
import { DeleteCompletedModal } from '@/components/DeleteCompletedModal';
import { GuestRow } from '@/components/GuestRow';
import { GuestCard } from '@/components/GuestCard';
import { HeaderMenu } from '@/components/HeaderMenu';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Search,
  Trash2,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface HostViewProps {
  onNavigate?: (page: Page) => void;
}

type TabFilter = 'all' | 'active' | 'time_over' | 'completed';

export function HostView({ onNavigate }: HostViewProps) {
  const now = useNow(1000);
  const { guests, loading: guestsLoading, connected, refresh } = useGuests();
  const { settings } = useSettings();

  // Dashboard state
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [search, setSearch] = useState('');
  const [playAreaFilter, setPlayAreaFilter] = useState<'all' | PlayArea>('all');
  const [guestTypeFilter, setGuestTypeFilter] = useState<'all' | GuestType>('all');
  const [socksSizeFilter, setSocksSizeFilter] = useState<'all' | SocksSize>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [markAllOverdueOpen, setMarkAllOverdueOpen] = useState(false);
  const [deleteCompletedOpen, setDeleteCompletedOpen] = useState(false);
  const [extendGuest, setExtendGuest] = useState<Guest | null>(null);
  const [editGuest, setEditGuest] = useState<Guest | null>(null);
  const [markOutGuest, setMarkOutGuest] = useState<Guest | null>(null);
  const [cancelGuest, setCancelGuest] = useState<Guest | null>(null);
  const [alertGuest, setAlertGuest] = useState<Guest | null>(null);

  const alertedRef = useRef<Set<string>>(new Set());
  const endingSoonRef = useRef<Set<string>>(new Set());

  // Compute live status + remaining for all guests
  const liveGuests = useMemo(() => {
    return guests.map((g) => {
      const status = computeStatus(g, now, settings.ending_soon_minutes);
      const remaining = new Date(g.expected_out_time).getTime() - now.getTime();
      return { guest: g, status, remaining, extensionCount: g.extensions?.length ?? 0 };
    });
  }, [guests, now, settings.ending_soon_minutes]);

  // Overdue guest IDs for bulk mark out
  const overdueGuestIds = useMemo(() => {
    return liveGuests
      .filter(({ status }) => status === 'time_over')
      .map(({ guest }) => guest.id);
  }, [liveGuests]);

  // Audio/Popup alert for Time Over and Ending Soon
  useEffect(() => {
    for (const { guest, status } of liveGuests) {
      if (status === 'ending_soon' && !endingSoonRef.current.has(guest.id)) {
        endingSoonRef.current.add(guest.id);
        const remaining = new Date(guest.expected_out_time).getTime() - now.getTime();
        const minLeft = Math.max(1, Math.ceil(remaining / 60000));
        showBrowserNotification('Ending Soon', `${guest.guest_name} — ${minLeft} minutes remaining.`);
      }

      if (status === 'time_over' && !alertedRef.current.has(guest.id)) {
        alertedRef.current.add(guest.id);
        const remaining = new Date(guest.expected_out_time).getTime() - now.getTime();
        if (remaining > -90000 && remaining <= 0) {
          setAlertGuest(guest);
          if (settings.notification_sound) playAlertSound();
          if (settings.browser_notifications) {
            showBrowserNotification('TIME OVER', `${guest.guest_name}'s play time has ended.`);
          }
        }
      }

      if (status === 'active') {
        alertedRef.current.delete(guest.id);
        endingSoonRef.current.delete(guest.id);
      }
    }
  }, [liveGuests, now, settings.notification_sound, settings.browser_notifications]);

  // Counts for tabs
  const counts = useMemo(() => {
    let active = 0, timeOver = 0, completed = 0, total = 0;
    const todayKey = getDayKey(now);
    for (const { guest, status } of liveGuests) {
      if (getDayKey(guest.created_at) !== todayKey) continue;
      total++;
      if (status === 'active' || status === 'ending_soon') active++;
      else if (status === 'time_over') timeOver++;
      else if (status === 'completed') completed++;
    }
    return { active, timeOver, completed, total };
  }, [liveGuests, now]);

  // Filtered list based on activeTab, search, playAreaFilter, guestTypeFilter, socksSizeFilter
  // STRICT NUMERICAL ASCENDING ORDER BY SERIAL NUMBER (001 -> 002 -> 003...)
  const filtered = useMemo(() => {
    const todayKey = getDayKey(now);
    let list = liveGuests.filter(({ guest }) => getDayKey(guest.created_at) === todayKey);

    if (activeTab === 'active') {
      list = list.filter((i) => i.status === 'active' || i.status === 'ending_soon');
    } else if (activeTab === 'time_over') {
      list = list.filter((i) => i.status === 'time_over');
    } else if (activeTab === 'completed') {
      list = list.filter((i) => i.status === 'completed');
    }

    if (playAreaFilter !== 'all') {
      list = list.filter(({ guest }) => guest.play_area === playAreaFilter);
    }
    if (guestTypeFilter !== 'all') {
      list = list.filter(({ guest }) => guest.guest_type === guestTypeFilter);
    }
    if (socksSizeFilter !== 'all') {
      list = list.filter(({ guest }) => guest.socks_size === socksSizeFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(({ guest }) => guest.guest_name.toLowerCase().includes(q));
    }

    return list.sort((a, b) => a.guest.serial_number - b.guest.serial_number);
  }, [liveGuests, now, activeTab, playAreaFilter, guestTypeFilter, socksSizeFilter, search]);

  // Direct Admin/Host Console Dashboard
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Host Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {onNavigate && (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="Back to Dashboard"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                <Users className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">
                    UNLIMITED FUN
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-[10px] tracking-widest uppercase">
                    HOST CONSOLE
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Central Supabase Database Connected</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                connected ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{connected ? 'Live Sync Active' : 'Offline'}</span>
              </div>

              <div className="text-right hidden sm:block">
                <p className="text-base font-black text-slate-900 tabular-nums leading-none">
                  {formatTimeWithSeconds(now)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{formatLongDate(now)}</p>
              </div>

              {/* Shared Three-Dot Dropdown Menu */}
              {onNavigate && <HeaderMenu onNavigate={onNavigate} currentPage="host" />}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
        {/* Offline Warning Banner */}
        {!connected && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 text-amber-600" />
            Internet connection required to sync guest data across other laptops/computers.
          </div>
        )}

        {/* Tab Filters & Action Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1.5 rounded-2xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ALL GUESTS ({counts.total})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'active'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-700 hover:bg-emerald-100/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              ACTIVE GUESTS ({counts.active})
            </button>
            <button
              onClick={() => setActiveTab('time_over')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'time_over'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-red-700 hover:bg-red-100/50'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              TIME OVER ({counts.timeOver})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              COMPLETED ({counts.completed})
            </button>
          </div>

          {/* Action Buttons: [ MARK ALL OVERDUE OUT ] [ DELETE ALL COMPLETED ] [ + ADD GUEST ] [ + BULK ADD ] */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {overdueGuestIds.length > 0 && (
              <button
                onClick={() => setMarkAllOverdueOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-black text-xs sm:text-sm shadow-md shadow-red-600/30 hover:bg-red-700 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> MARK ALL OVERDUE OUT ({overdueGuestIds.length})
              </button>
            )}
            {activeTab === 'completed' && counts.completed > 0 && (
              <button
                onClick={() => setDeleteCompletedOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-black text-xs sm:text-sm shadow-md shadow-red-600/30 hover:bg-red-700 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> DELETE ALL ({counts.completed})
              </button>
            )}
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-extrabold text-sm shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> ADD GUEST
            </button>
            <button
              onClick={() => setBulkOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-md hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" /> BULK ADD
            </button>
          </div>
        </div>

        {/* Completed Section Action Banner when viewing Completed Tab */}
        {activeTab === 'completed' && counts.completed > 0 && (
          <div className="flex items-center justify-between p-3.5 mb-5 bg-red-50 border border-red-200/80 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-red-900">
              <Trash2 className="w-4 h-4 text-red-600 shrink-0" />
              <span>Completed Guests Section ({counts.completed} record{counts.completed === 1 ? '' : 's'})</span>
            </div>
            <button
              onClick={() => setDeleteCompletedOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md shadow-red-600/20 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete All Completed
            </button>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-2.5 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search host guest records by name..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-900 placeholder:text-slate-400 text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <select
              value={playAreaFilter}
              onChange={(e) => setPlayAreaFilter(e.target.value as 'all' | PlayArea)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-cyan-500 text-slate-900 font-bold text-xs outline-none"
            >
              <option value="all">Play Area: All</option>
              <option value="trampoline">Trampoline Park</option>
              <option value="soft_play">Soft Play</option>
            </select>

            <select
              value={guestTypeFilter}
              onChange={(e) => setGuestTypeFilter(e.target.value as 'all' | GuestType)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-cyan-500 text-slate-900 font-bold text-xs outline-none"
            >
              <option value="all">Guest Type: All</option>
              <option value="new">New Guest</option>
              <option value="existing">Existing Guest</option>
            </select>

            <select
              value={socksSizeFilter}
              onChange={(e) => setSocksSizeFilter(e.target.value as 'all' | SocksSize)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-cyan-500 text-slate-900 font-bold text-xs outline-none"
            >
              <option value="all">Socks: All</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>

        {/* Guest List Content */}
        {guestsLoading ? (
          <div className="text-center py-16 text-slate-400">
            <div className="w-10 h-10 border-3 border-slate-200 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
            Syncing guests with Supabase...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-1">
              {search ? 'No guests found' : 'No guests in this category'}
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              {search
                ? 'Try searching with a different name.'
                : 'Click [ADD GUEST] or [BULK ADD] to add guests.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wide">Serial</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Guest Name</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">In Time</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Duration</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Expected Out</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Remaining</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Remarks</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(({ guest, status, remaining, extensionCount }) => (
                      <GuestRow
                        key={guest.id}
                        guest={guest}
                        status={status}
                        remainingMs={remaining}
                        extensionCount={extensionCount}
                        onExtend={() => setExtendGuest(guest)}
                        onEdit={() => setEditGuest(guest)}
                        onMarkOut={() => setMarkOutGuest(guest)}
                        onCancel={() => setCancelGuest(guest)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-3">
              {filtered.map(({ guest, status, remaining, extensionCount }) => (
                <GuestCard
                  key={guest.id}
                  guest={guest}
                  status={status}
                  remainingMs={remaining}
                  extensionCount={extensionCount}
                  onExtend={() => setExtendGuest(guest)}
                  onEdit={() => setEditGuest(guest)}
                  onMarkOut={() => setMarkOutGuest(guest)}
                  onCancel={() => setCancelGuest(guest)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      <AddGuestModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={refresh} />
      <BulkAddModal open={bulkOpen} onClose={() => setBulkOpen(false)} onAdded={refresh} />
      <MarkAllOverdueModal
        open={markAllOverdueOpen}
        onClose={() => setMarkAllOverdueOpen(false)}
        overdueGuestIds={overdueGuestIds}
        onDone={refresh}
      />
      <DeleteCompletedModal
        open={deleteCompletedOpen}
        onClose={() => setDeleteCompletedOpen(false)}
        count={counts.completed}
        onDone={refresh}
      />
      <ExtendTimeModal open={!!extendGuest} onClose={() => setExtendGuest(null)} guest={extendGuest} onDone={refresh} />
      <EditGuestModal open={!!editGuest} onClose={() => setEditGuest(null)} guest={editGuest} onDone={refresh} />
      <MarkOutModal open={!!markOutGuest} onClose={() => setMarkOutGuest(null)} guest={markOutGuest} onDone={refresh} />
      <CancelGuestModal open={!!cancelGuest} onClose={() => setCancelGuest(null)} guest={cancelGuest} onDone={refresh} isAdmin={true} />
      <TimeOverAlert
        guest={alertGuest}
        onClose={() => setAlertGuest(null)}
        onMarkOut={refresh}
        onExtend={(g) => setExtendGuest(g)}
      />
    </div>
  );
}
