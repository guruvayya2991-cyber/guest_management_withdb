import { useEffect, useMemo, useState } from 'react';
import type { Page } from '@/App';
import { idbGetAllGuests, idbDeleteGuest } from '@/lib/idb';
import type { Extension, Guest, GuestStatus, PlayArea, SocksSize, GuestType } from '@/lib/types';
import { getDayKey, formatDuration, formatTime, formatShortDate, formatSerial, toLocalInputValue } from '@/lib/time';
import { StatusBadge } from '@/components/StatusBadge';
import { Modal } from '@/components/Modal';
import { HeaderMenu } from '@/components/HeaderMenu';
import { showToast } from '@/components/Toast';
import { ArrowLeft, Download, Eye, MoreVertical, Search, Trash2, User } from 'lucide-react';

interface HistoryProps {
  onNavigate: (page: Page) => void;
}

interface HistoryRow extends Guest {
  extensions: Extension[];
}

export function History({ onNavigate }: HistoryProps) {
  const [date, setDate] = useState(() => toLocalInputValue(new Date()).slice(0, 10));
  const [viewAllDates, setViewAllDates] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<GuestStatus | 'all'>('all');
  const [playAreaFilter, setPlayAreaFilter] = useState<'all' | PlayArea>('all');
  const [guestTypeFilter, setGuestTypeFilter] = useState<'all' | GuestType>('all');
  const [socksSizeFilter, setSocksSizeFilter] = useState<'all' | SocksSize>('all');
  const [allRows, setAllRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Active action menu row id
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<HistoryRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HistoryRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadAllHistory() {
    setLoading(true);
    try {
      const all = await idbGetAllGuests();
      setAllRows(all);
    } catch (err) {
      console.error('Error loading history from IndexedDB:', err);
      setAllRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllHistory();
  }, []);

  // Filter rows by date (or all), status, search, and new criteria
  const rows = useMemo(() => {
    if (viewAllDates) return allRows;
    return allRows.filter((g) => getDayKey(g.created_at) === date);
  }, [allRows, viewAllDates, date]);

  // STRICT NUMERICAL ASCENDING ORDER BY SERIAL NUMBER (001 -> 002 -> 003...)
  const filtered = useMemo(() => {
    let list = rows;
    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (playAreaFilter !== 'all') {
      list = list.filter((r) => r.play_area === playAreaFilter);
    }
    if (guestTypeFilter !== 'all') {
      list = list.filter((r) => r.guest_type === guestTypeFilter);
    }
    if (socksSizeFilter !== 'all') {
      list = list.filter((r) => r.socks_size === socksSizeFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => r.guest_name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => a.serial_number - b.serial_number);
  }, [rows, statusFilter, playAreaFilter, guestTypeFilter, socksSizeFilter, search]);

  const stats = useMemo(() => {
    let totalMin = 0;
    let extCount = 0;
    for (const r of rows) {
      totalMin += r.duration_minutes;
      extCount += r.extensions?.length ?? 0;
    }
    return { count: rows.length, totalMin, extCount };
  }, [rows]);

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await idbDeleteGuest(deleteTarget.id);
      showToast(`Guest record for "${deleteTarget.guest_name}" deleted`, 'success');
      setDeleteTarget(null);
      await loadAllHistory();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete guest record', 'error');
    } finally {
      setIsDeleting(false);
    }
  }

  function exportCSV() {
    const headers = ['S.No', 'Guest Name', 'Guest Type', 'Play Area', 'Socks Size', 'In Time', 'Expected Out', 'Actual Out', 'Duration', 'Extensions', 'Status', 'Remarks'];
    const lines = filtered.map((r) => {
      const exts = (r.extensions ?? []).map((e) => `+${e.extension_minutes}m`).join('; ');
      const row = [
        r.serial_number,
        `"${r.guest_name.replace(/"/g, '""')}"`,
        r.guest_type === 'existing' ? 'Existing Guest' : 'New Guest',
        r.play_area === 'soft_play' ? 'Soft Play' : 'Trampoline Park',
        r.socks_size || 'medium',
        formatTime(r.in_time),
        formatTime(r.expected_out_time),
        r.actual_out_time ? formatTime(r.actual_out_time) : '—',
        formatDuration(r.duration_minutes),
        exts || '—',
        r.status,
        `"${(r.remarks ?? '').replace(/"/g, '""')}"`,
      ];
      return row.join(',');
    });
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unlimited-fun-history-${viewAllDates ? 'all-dates' : date}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50" onClick={() => setOpenMenuId(null)}>
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
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Guest Timing History
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {viewAllDates ? 'All Historical Records' : formatShortDate(`${date}T12:00:00+05:30`)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewAllDates((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                viewAllDates
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {viewAllDates ? 'Showing All Records' : 'Show All Dates'}
            </button>

            {/* Shared Three-Dot Dropdown Menu */}
            <HeaderMenu onNavigate={onNavigate} currentPage="history" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
        {/* Controls Bar */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {!viewAllDates && (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-900 font-medium text-sm"
              />
            )}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search history by guest name..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-900 placeholder:text-slate-400 text-sm font-medium"
              />
            </div>
            <button
              onClick={exportCSV}
              disabled={filtered.length === 0}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50 shrink-0 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          {/* Additional Filter Selects */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as GuestStatus | 'all')}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:border-cyan-500 outline-none text-slate-900 font-bold text-xs"
            >
              <option value="all">Status: All</option>
              <option value="active">Active</option>
              <option value="ending_soon">Ending Soon</option>
              <option value="time_over">Time Over</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={playAreaFilter}
              onChange={(e) => setPlayAreaFilter(e.target.value as 'all' | PlayArea)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:border-cyan-500 outline-none text-slate-900 font-bold text-xs"
            >
              <option value="all">Play Area: All</option>
              <option value="trampoline">Trampoline Park</option>
              <option value="soft_play">Soft Play</option>
            </select>

            <select
              value={guestTypeFilter}
              onChange={(e) => setGuestTypeFilter(e.target.value as 'all' | GuestType)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:border-cyan-500 outline-none text-slate-900 font-bold text-xs"
            >
              <option value="all">Guest Type: All</option>
              <option value="new">New Guest</option>
              <option value="existing">Existing Guest</option>
            </select>

            <select
              value={socksSizeFilter}
              onChange={(e) => setSocksSizeFilter(e.target.value as 'all' | SocksSize)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white focus:border-cyan-500 outline-none text-slate-900 font-bold text-xs"
            >
              <option value="all">Socks Size: All</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-2xl bg-white border border-slate-200 p-4 text-center shadow-sm">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Total Guests</p>
            <p className="text-2xl font-black text-slate-900 tabular-nums mt-0.5">{stats.count}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-4 text-center shadow-sm">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Total Play Hours</p>
            <p className="text-2xl font-black text-emerald-600 tabular-nums mt-0.5">{(stats.totalMin / 60).toFixed(1)}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-4 text-center shadow-sm">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Time Extensions</p>
            <p className="text-2xl font-black text-cyan-600 tabular-nums mt-0.5">{stats.extCount}</p>
          </div>
        </div>

        {/* History Table */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">
            <div className="w-10 h-10 border-3 border-slate-200 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
            Loading history records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700 mb-1">No history records found</p>
            <p className="text-sm text-slate-400">Try selecting a different date or clearing the search filter.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-3 py-3 text-center text-xs font-bold text-slate-500 uppercase">Serial</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase">Guest Name</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase">In Time</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase">Duration</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase">Expected Out</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase">Actual Out</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase">Extensions</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase">Remarks</th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const exts = (r.extensions ?? []).map((e) => `+${formatDuration(e.extension_minutes)}`).join(', ');
                    return (
                      <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-3 text-center text-sm font-extrabold text-slate-500 tabular-nums">
                          {formatSerial(r.serial_number)}
                        </td>
                        <td className="px-3 py-3 text-sm font-bold text-slate-900">
                          <span className="truncate max-w-[200px] block">{r.guest_name}</span>
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-600 tabular-nums whitespace-nowrap">{formatTime(r.in_time)}</td>
                        <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDuration(r.duration_minutes)}</td>
                        <td className="px-3 py-3 text-sm text-slate-600 tabular-nums whitespace-nowrap">{formatTime(r.expected_out_time)}</td>
                        <td className="px-3 py-3 text-sm text-slate-600 tabular-nums whitespace-nowrap">
                          {r.actual_out_time ? formatTime(r.actual_out_time) : '—'}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{exts || '—'}</td>
                        <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                        <td className="px-3 py-3 text-sm text-slate-500 max-w-[140px] truncate" title={r.remarks ?? ''}>
                          {r.remarks ?? '—'}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setOpenMenuId((cur) => (cur === r.id ? null : r.id))}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                              title="Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openMenuId === r.id && (
                              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20 animate-[fadeIn_0.1s]">
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setSelectedGuest(r);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-400" /> View Details
                                </button>
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setDeleteTarget(r);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* View Details Modal */}
      {selectedGuest && (
        <Modal open={!!selectedGuest} onClose={() => setSelectedGuest(null)} title={`Guest Details — ${selectedGuest.guest_name}`} maxWidth="max-w-md">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-slate-400">#{formatSerial(selectedGuest.serial_number)}</span>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">{selectedGuest.guest_name}</h3>
                <div className="mt-1"><StatusBadge status={selectedGuest.status} /></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-400 font-semibold uppercase">Play Area</p>
                <p className="text-slate-800 font-bold">{selectedGuest.play_area === 'soft_play' ? 'Soft Play' : 'Trampoline Park'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-400 font-semibold uppercase">Socks Size</p>
                <p className="text-slate-800 font-bold capitalize">{selectedGuest.socks_size || 'Medium'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-400 font-semibold uppercase">Guest Type</p>
                <p className="text-slate-800 font-bold">{selectedGuest.guest_type === 'existing' ? 'Existing Guest' : 'New Guest'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-400 font-semibold uppercase">In Time</p>
                <p className="text-slate-800 font-bold tabular-nums">{formatTime(selectedGuest.in_time)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-400 font-semibold uppercase">Duration</p>
                <p className="text-slate-800 font-bold">{formatDuration(selectedGuest.duration_minutes)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-400 font-semibold uppercase">Expected Out</p>
                <p className="text-slate-800 font-bold tabular-nums">{formatTime(selectedGuest.expected_out_time)}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-400 font-semibold uppercase">Actual Out</p>
                <p className="text-slate-800 font-bold tabular-nums">{selectedGuest.actual_out_time ? formatTime(selectedGuest.actual_out_time) : '—'}</p>
              </div>
            </div>

            {selectedGuest.remarks && (
              <div className="p-3 rounded-xl bg-slate-50 text-sm">
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Remarks</p>
                <p className="text-slate-700">{selectedGuest.remarks}</p>
              </div>
            )}

            {selectedGuest.extensions && selectedGuest.extensions.length > 0 && (
              <div className="p-3 rounded-xl bg-cyan-50/50 border border-cyan-100 text-sm">
                <p className="text-xs text-cyan-800 font-bold uppercase mb-1">Extensions ({selectedGuest.extensions.length})</p>
                <ul className="space-y-1">
                  {selectedGuest.extensions.map((ext, idx) => (
                    <li key={ext.id || idx} className="text-xs text-cyan-900 flex justify-between">
                      <span>Extension {idx + 1}: +{ext.extension_minutes} mins</span>
                      <span className="font-semibold">{formatTime(ext.new_out_time)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => setSelectedGuest(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Guest Record" maxWidth="max-w-md">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700">
              <Trash2 className="w-5 h-5 shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-bold">Delete this guest record?</p>
                <p className="text-xs text-red-600/90 mt-0.5">
                  Guest: <span className="font-bold">{deleteTarget.guest_name}</span> (#{formatSerial(deleteTarget.serial_number)})
                </p>
                <p className="text-xs text-red-500 mt-1">This action cannot be undone.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md shadow-red-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
