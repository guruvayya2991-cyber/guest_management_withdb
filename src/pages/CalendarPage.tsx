import { useEffect, useMemo, useState } from 'react';
import type { Page } from '@/App';
import { useGuests } from '@/hooks/useGuests';
import { formatDuration, formatSerial, formatTime, getDayKey } from '@/lib/time';
import { StatusBadge } from '@/components/StatusBadge';
import { HeaderMenu } from '@/components/HeaderMenu';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  RotateCcw,
  Users,
} from 'lucide-react';
import type { GuestRecord } from '@/lib/idb';

interface CalendarPageProps {
  onNavigate: (page: Page) => void;
}

export function CalendarPage({ onNavigate }: CalendarPageProps) {
  const { guests: allGuests, loading } = useGuests();

  // Current view year & month
  const today = new Date();
  const [viewYear, setViewYear] = useState(() => today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => today.getMonth()); // 0-indexed

  // Selected date ISO string 'YYYY-MM-DD'
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => getDayKey(today));

  // Map of YYYY-MM-DD -> list of guest records
  const guestsByDate = useMemo(() => {
    const map = new Map<string, GuestRecord[]>();
    for (const g of allGuests) {
      const dateKey = getDayKey(g.created_at);
      const list = map.get(dateKey) || [];
      list.push(g);
      map.set(dateKey, list);
    }
    return map;
  }, [allGuests]);

  // Navigate month
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDateStr(getDayKey(now));
  };

  // Calendar days grid generation
  const calendarDays = useMemo(() => {
    const days: Array<{ date: Date; dateStr: string; isCurrentMonth: boolean }> = [];

    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
    const totalDaysInMonth = lastDayOfMonth.getDate();

    // Previous month padding days
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, prevMonthLastDay - i);
      days.push({ date: d, dateStr: getDayKey(d), isCurrentMonth: false });
    }

    // Current month days
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      days.push({ date: d, dateStr: getDayKey(d), isCurrentMonth: true });
    }

    // Next month padding days to complete 6 weeks grid (42 days) or 5 weeks
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const d = new Date(viewYear, viewMonth + 1, i);
      days.push({ date: d, dateStr: getDayKey(d), isCurrentMonth: false });
    }

    return days;
  }, [viewYear, viewMonth]);

  // Records for selected date — SORTED NUMERICALLY ASCENDING BY SERIAL NUMBER
  const selectedDateRecords = useMemo(() => {
    const records = guestsByDate.get(selectedDateStr) || [];
    // Strict numerical ascending sort (001 -> 002 -> 003 ...)
    return [...records].sort((a, b) => a.serial_number - b.serial_number);
  }, [guestsByDate, selectedDateStr]);

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long' });

  // Format selected date header
  const selectedDateHeader = useMemo(() => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    if (!y || !m || !d) return selectedDateStr;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, [selectedDateStr]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">
                Guest Timing Calendar
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Central Supabase Monthly History & Guest Counts
              </p>
            </div>
          </div>

          <HeaderMenu onNavigate={onNavigate} currentPage="calendar" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
        {/* Calendar Navigation & Month Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {monthName} {viewYear}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToday}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" /> TODAY
              </button>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-all cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-all cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center font-extrabold text-xs text-slate-400 uppercase tracking-wider mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map(({ date, dateStr, isCurrentMonth }) => {
              const dayNum = date.getDate();
              const dayGuests = guestsByDate.get(dateStr) || [];
              const count = dayGuests.length;
              const isToday = dateStr === getDayKey(today);
              const isSelected = dateStr === selectedDateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`min-h-[72px] sm:min-h-[84px] p-2 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500 shadow-md'
                      : isToday
                      ? 'border-cyan-400 bg-cyan-50/50 hover:bg-cyan-100/50'
                      : isCurrentMonth
                      ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      : 'border-slate-100 bg-slate-50/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs sm:text-sm font-extrabold tabular-nums ${
                        isSelected
                          ? 'text-amber-900'
                          : isToday
                          ? 'text-cyan-700'
                          : isCurrentMonth
                          ? 'text-slate-700'
                          : 'text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="px-1.5 py-0.5 rounded-md bg-cyan-500 text-white font-black text-[9px] uppercase tracking-wider">
                        Today
                      </span>
                    )}
                  </div>

                  {count > 0 ? (
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[10px] sm:text-xs font-black shadow-xs whitespace-nowrap">
                        <Users className="w-3 h-3 hidden sm:inline" />
                        {count} Guest{count > 1 ? 's' : ''}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-300 font-medium hidden sm:inline">No guests</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date History Detail View */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Date Selected</span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 uppercase">
                {selectedDateHeader}
              </h3>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white font-extrabold text-xs sm:text-sm tabular-nums">
              {selectedDateRecords.length} GUEST{selectedDateRecords.length === 1 ? '' : 'S'}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
              Loading date history...
            </div>
          ) : selectedDateRecords.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200/60 p-6">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-700 mb-1">No guest entries for {selectedDateHeader}</p>
              <p className="text-xs text-slate-400">Select another date with registered guests on the calendar grid.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-3 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wide">Serial</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Guest Name</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">In Time</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Duration</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Expected Out</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Actual Out</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDateRecords.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                      <td className="px-3 py-3 text-center text-sm font-extrabold text-slate-500 tabular-nums">
                        {formatSerial(r.serial_number)}
                      </td>
                      <td className="px-3 py-3 text-sm font-bold text-slate-900">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[170px] font-bold text-slate-900">{r.guest_name}</span>
                            {r.guest_type && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase shrink-0 ${
                                r.guest_type === 'new' ? 'bg-cyan-100 text-cyan-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {r.guest_type === 'new' ? 'New' : 'Exist'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-medium">
                            <span className={`px-1.5 py-0.2 rounded font-semibold ${
                              r.play_area === 'soft_play' ? 'bg-pink-50 text-pink-700 border border-pink-200/60' : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                            }`}>
                              {r.play_area === 'soft_play' ? 'Soft Play' : 'Trampoline'}
                            </span>
                            <span>•</span>
                            <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-semibold border border-indigo-200/60 uppercase">
                              Socks: {r.socks_size ? r.socks_size.charAt(0).toUpperCase() + r.socks_size.slice(1) : 'Medium'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-600 tabular-nums whitespace-nowrap">{formatTime(r.in_time)}</td>
                      <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDuration(r.duration_minutes)}</td>
                      <td className="px-3 py-3 text-sm text-slate-600 tabular-nums whitespace-nowrap">{formatTime(r.expected_out_time)}</td>
                      <td className="px-3 py-3 text-sm text-slate-600 tabular-nums whitespace-nowrap">
                        {r.actual_out_time ? formatTime(r.actual_out_time) : '—'}
                      </td>
                      <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                      <td className="px-3 py-3 text-sm text-slate-500 max-w-[160px] truncate" title={r.remarks ?? ''}>
                        {r.remarks ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
