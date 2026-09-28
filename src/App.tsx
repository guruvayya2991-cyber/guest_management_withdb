import { useEffect, useState } from 'react';
import { SettingsProvider } from '@/context/SettingsContext';
import { IntroAnimation } from '@/components/IntroAnimation';
import { ToastContainer } from '@/components/Toast';
import { Dashboard } from '@/pages/Dashboard';
import { HostView } from '@/pages/HostView';
import { History } from '@/pages/History';
import { Stats } from '@/pages/Stats';
import { DataPage } from '@/pages/DataPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { CalendarPage } from '@/pages/CalendarPage';

export type Page = 'dashboard' | 'history' | 'settings' | 'stats' | 'data' | 'host' | 'calendar';

function getInitialPage(): Page {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.startsWith('/host') || hash.includes('host')) {
      return 'host';
    } else if (path.startsWith('/history') || hash.includes('history')) {
      return 'history';
    } else if (path.startsWith('/stats') || hash.includes('stats')) {
      return 'stats';
    } else if (path.startsWith('/data') || hash.includes('data')) {
      return 'data';
    } else if (path.startsWith('/settings') || hash.includes('settings')) {
      return 'settings';
    } else if (path.startsWith('/calendar') || hash.includes('calendar')) {
      return 'calendar';
    }
  }
  return 'dashboard';
}

function AppContent() {
  const [page, setPage] = useState<Page>(getInitialPage);
  const [showIntro, setShowIntro] = useState(() => {
    // If opening directly to a sub-route, skip intro
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.length > 1) return false;
    }
    return true;
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.startsWith('/host') || hash.includes('host')) {
        setPage('host');
      } else if (path.startsWith('/history') || hash.includes('history')) {
        setPage('history');
      } else if (path.startsWith('/stats') || hash.includes('stats')) {
        setPage('stats');
      } else if (path.startsWith('/data') || hash.includes('data')) {
        setPage('data');
      } else if (path.startsWith('/settings') || hash.includes('settings')) {
        setPage('settings');
      } else if (path.startsWith('/calendar') || hash.includes('calendar')) {
        setPage('calendar');
      } else {
        setPage('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = (newPage: Page) => {
    setPage(newPage);
    if (typeof window !== 'undefined') {
      const newPath = newPage === 'dashboard' ? '/' : `/${newPage}`;
      window.history.pushState({}, '', newPath);
    }
  };

  if (showIntro) {
    return <IntroAnimation onComplete={() => setShowIntro(false)} />;
  }

  return (
    <>
      <ToastContainer />
      {page === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
      {page === 'host' && <HostView onNavigate={handleNavigate} />}
      {page === 'history' && <History onNavigate={handleNavigate} />}
      {page === 'stats' && <Stats onNavigate={handleNavigate} />}
      {page === 'data' && <DataPage onNavigate={handleNavigate} />}
      {page === 'settings' && <SettingsPage onNavigate={handleNavigate} />}
      {page === 'calendar' && <CalendarPage onNavigate={handleNavigate} />}
    </>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}
