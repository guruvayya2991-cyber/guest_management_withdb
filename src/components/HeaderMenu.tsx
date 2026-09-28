import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Calendar as CalendarIcon,
  Database,
  History as HistoryIcon,
  Lock,
  MoreVertical,
  Settings as SettingsIcon,
} from 'lucide-react';
import type { Page } from '@/App';

interface HeaderMenuProps {
  onNavigate: (page: Page) => void;
  currentPage?: Page;
}

export function HeaderMenu({ onNavigate, currentPage }: HeaderMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const items = [
    { label: 'History', page: 'history' as Page, icon: HistoryIcon, iconColor: 'text-cyan-600' },
    { label: 'Statistics', page: 'stats' as Page, icon: BarChart3, iconColor: 'text-emerald-600' },
    { label: 'Data', page: 'data' as Page, icon: Database, iconColor: 'text-indigo-600' },
    { label: 'Settings', page: 'settings' as Page, icon: SettingsIcon, iconColor: 'text-slate-500' },
    { label: 'Calendar', page: 'calendar' as Page, icon: CalendarIcon, iconColor: 'text-amber-600' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        title="Menu"
        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-50 animate-[fadeIn_0.1s]">
          {items.map((item) => (
            <button
              key={item.page}
              onClick={() => {
                setMenuOpen(false);
                onNavigate(item.page);
              }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                currentPage === item.page
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className={`w-4 h-4 ${item.iconColor}`} /> {item.label}
            </button>
          ))}
          <div className="my-1 border-t border-slate-100" />
          <button
            onClick={() => {
              setMenuOpen(false);
              onNavigate('host');
            }}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
              currentPage === 'host'
                ? 'bg-purple-100 text-purple-900 font-bold'
                : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            <Lock className="w-4 h-4 text-purple-600" /> Host / Admin
          </button>
        </div>
      )}
    </div>
  );
}
