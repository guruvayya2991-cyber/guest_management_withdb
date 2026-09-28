import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { idbGetSettings, idbSaveSettings } from '@/lib/idb';
import { DEFAULT_SETTINGS, type Settings } from '@/lib/types';

interface SettingsContextValue {
  settings: Settings;
  loading: boolean;
  updateSettings: (patch: Partial<Settings>) => Promise<{ error: string | null }>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({
    id: 1,
    ...DEFAULT_SETTINGS,
    updated_at: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const data = await idbGetSettings();
      if (mounted) {
        setSettings(data);
        setLoading(false);
      }
    }
    load();

    return () => {
      mounted = false;
    };
  }, []);

  async function updateSettings(patch: Partial<Settings>) {
    const updated = { ...settings, ...patch, updated_at: new Date().toISOString() };
    setSettings(updated);
    await idbSaveSettings(updated);
    return { error: null };
  }

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
