import { useEffect, useState } from 'react';
import type { Page } from '@/App';
import { useSettings } from '@/context/SettingsContext';
import { requestNotificationPermission } from '@/lib/notify';
import { HeaderMenu } from '@/components/HeaderMenu';
import { ArrowLeft, Bell, Clock, Save, Volume2 } from 'lucide-react';

interface SettingsPageProps {
  onNavigate: (page: Page) => void;
}

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const { settings, updateSettings } = useSettings();

  const [parkName, setParkName] = useState(settings.park_name);
  const [endingSoon, setEndingSoon] = useState(settings.ending_soon_minutes);
  const [sound, setSound] = useState(settings.notification_sound);
  const [notif, setNotif] = useState(settings.browser_notifications);
  const [theme, setTheme] = useState(settings.theme);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setParkName(settings.park_name);
    setEndingSoon(settings.ending_soon_minutes);
    setSound(settings.notification_sound);
    setNotif(settings.browser_notifications);
    setTheme(settings.theme);
  }, [settings]);

  async function handleSave() {
    setBusy(true);
    setMsg(null);
    if (notif && !settings.browser_notifications) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setMsg('Browser notification permission was not granted.');
      }
    }
    const { error } = await updateSettings({
      park_name: parkName.trim() || 'Unlimited Fun',
      ending_soon_minutes: endingSoon,
      notification_sound: sound,
      browser_notifications: notif,
      theme,
    });
    setBusy(false);
    setMsg(error ? error : 'Settings saved successfully.');
    setTimeout(() => setMsg(null), 2500);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('dashboard')} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer" title="Back to Dashboard">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">Settings</h1>
          </div>

          <HeaderMenu onNavigate={onNavigate} currentPage="settings" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-4">
        {/* Park Info */}
        <Section title="Park Information">
          <Field label="Park Name">
            <input
              type="text"
              value={parkName}
              onChange={(e) => setParkName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-900"
            />
          </Field>
          <Field label="Time Zone">
            <div className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" /> Asia/Kolkata (IST)
            </div>
          </Field>
        </Section>

        {/* Alerts */}
        <Section title="Alert Settings">
          <Field label="Ending Soon Warning (minutes)">
            <input
              type="number"
              value={endingSoon}
              onChange={(e) => setEndingSoon(Number(e.target.value) || 10)}
              min={1}
              max={60}
              className="w-32 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all text-slate-900"
            />
            <p className="text-xs text-slate-400 mt-1">Guests within this many minutes of their out time show as "Ending Soon".</p>
          </Field>

          <ToggleRow
            icon={<Volume2 className="w-5 h-5 text-cyan-600" />}
            label="Notification Sound"
            desc="Play a short alert when a guest's time is over."
            value={sound}
            onChange={setSound}
          />
          <ToggleRow
            icon={<Bell className="w-5 h-5 text-cyan-600" />}
            label="Browser Notifications"
            desc="Show a desktop notification when time is over."
            value={notif}
            onChange={setNotif}
          />
        </Section>

        {/* Theme */}
        <Section title="Appearance">
          <Field label="Theme">
            <div className="flex gap-2">
              {(['light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold border capitalize transition-all cursor-pointer ${
                    theme === t ? 'bg-cyan-500 border-cyan-500 text-white' : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">Light theme is active.</p>
          </Field>
        </Section>

        {msg && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${
            msg.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {msg}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-60 cursor-pointer"
        >
          <Save className="w-5 h-5" /> {busy ? 'Saving...' : 'Save Settings'}
        </button>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ToggleRow({ icon, label, desc, value, onChange }: {
  icon: React.ReactNode; label: string; desc: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">{icon}</div>
        <div>
          <p className="text-sm font-bold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6.5 rounded-full transition-colors shrink-0 cursor-pointer ${value ? 'bg-cyan-500' : 'bg-slate-300'}`}
        style={{ height: '26px' }}
      >
        <span className={`absolute top-0.5 w-5.5 h-5.5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-0.5'}`} style={{ width: '22px', height: '22px' }} />
      </button>
    </div>
  );
}
