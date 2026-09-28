import { useEffect, useState } from 'react';
import type { Page } from '@/App';
import { fetchAllGuestsFromSupabase, clearTodayGuestsFromSupabase, clearAllGuestsFromSupabase } from '@/lib/supabaseGuestOps';
import { idbGetAllGuests } from '@/lib/idb';
import type { GuestRecord } from '@/lib/idb';
import { HeaderMenu } from '@/components/HeaderMenu';
import { Modal } from '@/components/Modal';
import { showToast } from '@/components/Toast';
import { ArrowLeft, Database, Download, FileText, HardDrive, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';

interface DataPageProps {
  onNavigate: (page: Page) => void;
}

export function DataPage({ onNavigate }: DataPageProps) {
  const [allGuests, setAllGuests] = useState<GuestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Clear data modals
  const [showClearTodayModal, setShowClearTodayModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const list = await fetchAllGuestsFromSupabase();
      if (list.length > 0) {
        setAllGuests(list);
      } else {
        const cached = await idbGetAllGuests();
        setAllGuests(cached);
      }
    } catch (err) {
      console.error(err);
      const cached = await idbGetAllGuests();
      setAllGuests(cached);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const totalGuests = allGuests.length;
  const activeGuests = allGuests.filter((g) => g.status === 'active' || g.status === 'ending_soon' || g.status === 'time_over').length;
  const completedGuests = allGuests.filter((g) => g.status === 'completed').length;

  function exportJSON() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(allGuests, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `unlimited_fun_guest_data_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function handleClearTodayConfirm() {
    try {
      setIsClearing(true);
      await clearTodayGuestsFromSupabase();
      showToast("Today's guest data cleared successfully", 'success');
      setShowClearTodayModal(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to clear today's data.";
      showToast(msg, 'error');
    } finally {
      setIsClearing(false);
    }
  }

  async function handleClearAllConfirm() {
    try {
      setIsClearing(true);
      await clearAllGuestsFromSupabase();
      showToast('All guest data and history cleared successfully', 'success');
      setShowClearAllModal(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to clear all guest data.';
      showToast(msg, 'error');
    } finally {
      setIsClearing(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-none">Data Management</h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Supabase Central DB & Local IndexedDB Cache</p>
            </div>
          </div>

          <HeaderMenu onNavigate={onNavigate} currentPage="data" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Status Card */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Database Engine</h2>
              <p className="text-xs text-slate-500 font-medium">Supabase Central Source of Truth with Realtime Sync & IndexedDB cache.</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Stored</p>
              <p className="text-2xl font-black text-slate-900 tabular-nums mt-1">{totalGuests}</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Active Guests</p>
              <p className="text-2xl font-black text-emerald-700 tabular-nums mt-1">{activeGuests}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Completed</p>
              <p className="text-2xl font-black text-slate-700 tabular-nums mt-1">{completedGuests}</p>
            </div>
            <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-100 text-center">
              <p className="text-xs font-semibold text-cyan-700 uppercase tracking-wide">History Records</p>
              <p className="text-2xl font-black text-cyan-800 tabular-nums mt-1">{totalGuests}</p>
            </div>
          </div>
        </div>

        {/* Data Backup & Export Options */}
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm mb-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">Backup & Export</h3>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-sm font-bold text-slate-800">Export Complete JSON Backup</p>
                <p className="text-xs text-slate-500">Download all guest timing records in JSON format.</p>
              </div>
            </div>
            <button
              onClick={exportJSON}
              disabled={loading || totalGuests === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download Backup (.json)
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-cyan-600" />
              <div>
                <p className="text-sm font-bold text-slate-800">View Full History & CSV Export</p>
                <p className="text-xs text-slate-500">Filter by date, search guests, export spreadsheet, and manage individual records.</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Open History Page
            </button>
          </div>
        </div>

        {/* Clear Data Section */}
        <div className="rounded-2xl bg-white border border-red-200/80 p-6 shadow-sm mb-6 space-y-4">
          <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider">Clear Data & Reset</h3>

          <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50/60 border border-amber-200/70 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-900">Clear Today's Data</p>
                <p className="text-xs text-amber-700 font-medium">Remove today's guest records from central database. Previous dates will remain safe.</p>
              </div>
            </div>
            <button
              onClick={() => setShowClearTodayModal(true)}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              Clear Today's Data
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-red-50/60 border border-red-200/70 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-900">Clear All Data</p>
                <p className="text-xs text-red-700 font-medium">Permanently remove all guest records and history. Application settings will be preserved.</p>
              </div>
            </div>
            <button
              onClick={() => setShowClearAllModal(true)}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              Clear All Data
            </button>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </main>

      {/* Confirmation Modal: Clear Today's Data */}
      {showClearTodayModal && (
        <Modal open={showClearTodayModal} onClose={() => setShowClearTodayModal(false)} title="Clear today's guest data?" maxWidth="max-w-md">
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
              <p className="font-bold mb-1">Are you sure you want to clear today's guest data?</p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Only today's guest records will be cleared. Previous dates' history will remain completely safe.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearTodayModal(false)}
                disabled={isClearing}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearTodayConfirm}
                disabled={isClearing}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold transition-all shadow-md shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isClearing ? 'Clearing...' : 'Clear Today'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Modal: Clear All Data */}
      {showClearAllModal && (
        <Modal open={showClearAllModal} onClose={() => setShowClearAllModal(false)} title="Clear all guest data?" maxWidth="max-w-md">
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-sm">
              <p className="font-bold mb-1">Clear all guest data?</p>
              <p className="text-xs text-red-800 leading-relaxed">
                This will permanently remove all guest records and history. Application settings will be preserved.
              </p>
              <p className="text-xs font-bold text-red-600 mt-2">This action cannot be undone.</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllModal(false)}
                disabled={isClearing}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAllConfirm}
                disabled={isClearing}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold transition-all shadow-md shadow-red-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isClearing ? 'Clearing All...' : 'Clear All Data'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
