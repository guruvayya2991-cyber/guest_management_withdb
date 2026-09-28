import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchAllGuestsFromSupabase } from '@/lib/supabaseGuestOps';
import { idbGetAllGuests, type GuestRecord } from '@/lib/idb';
import type { Guest, GuestStatus } from '@/lib/types';
import { getDayKey } from '@/lib/time';

export type GuestWithExtensions = GuestRecord;

interface UseGuestsResult {
  guests: GuestWithExtensions[];
  loading: boolean;
  connected: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useGuests(): UseGuestsResult {
  const [guests, setGuests] = useState<GuestWithExtensions[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const initialLoadedRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);

  const load = useCallback(async (skipLoadingState = false) => {
    if (!skipLoadingState && !initialLoadedRef.current) {
      setLoading(true);
    }

    try {
      // 1. Fetch from central Supabase database
      const supabaseData = await fetchAllGuestsFromSupabase();

      if (!mountedRef.current) return;

      if (supabaseData.length > 0 || navigator.onLine) {
        setGuests(supabaseData);
        setConnected(true);
        setError(null);
        initialLoadedRef.current = true;
      } else {
        // Fallback to local cache if network is down
        const cached = await idbGetAllGuests();
        if (mountedRef.current) {
          setGuests(cached);
          initialLoadedRef.current = true;
        }
      }
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      console.warn('Network sync with Supabase notice:', err);
      setConnected(false);
      setError('Internet connection required to sync guest data.');

      // Load cached data
      try {
        const cached = await idbGetAllGuests();
        if (mountedRef.current && cached.length > 0) {
          setGuests(cached);
          initialLoadedRef.current = true;
        }
      } catch {}
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Debounced load for realtime events to avoid rapid flickering
  const debouncedLoad = useCallback(() => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      load(true);
    }, 200);
  }, [load]);

  useEffect(() => {
    mountedRef.current = true;

    // Load initial cached data from IndexedDB immediately for instant render
    idbGetAllGuests().then((cached) => {
      if (mountedRef.current && cached.length > 0 && !initialLoadedRef.current) {
        setGuests(cached);
        setLoading(false);
      }
    });

    // Fetch fresh live data from Supabase once on mount
    load();

    // Listen to local update events
    const handleLocalUpdate = () => {
      debouncedLoad();
    };
    window.addEventListener('unlimited_fun_guests_updated', handleLocalUpdate);

    // Online/Offline status listeners
    const handleOnline = () => {
      setConnected(true);
      load(true);
    };
    const handleOffline = () => {
      setConnected(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // ============================================================
    // Supabase Realtime Subscription (Cross-Laptop Synchronisation)
    // Setup ONCE on mount, tear down only on unmount
    // ============================================================
    const channel = supabase
      .channel('realtime_guests_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guests' },
        () => {
          debouncedLoad();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'extensions' },
        () => {
          debouncedLoad();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (mountedRef.current) setConnected(true);
        }
      });

    return () => {
      mountedRef.current = false;
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      window.removeEventListener('unlimited_fun_guests_updated', handleLocalUpdate);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      supabase.removeChannel(channel);
    };
  }, [load, debouncedLoad]);

  return { guests, loading, connected, error, refresh: () => load(true) };
}

export function computeStatus(
  guest: Guest,
  now: Date,
  endingSoonMinutes: number,
): GuestStatus {
  if (guest.status === 'completed') return 'completed';
  if (guest.status === 'cancelled') return 'cancelled';

  const expectedOut = new Date(guest.expected_out_time);
  const diff = expectedOut.getTime() - now.getTime();

  if (diff <= 0) return 'time_over';
  if (diff <= endingSoonMinutes * 60000) return 'ending_soon';
  return 'active';
}

export function nextSerialNumber(guests: Guest[]): number {
  const todayKey = getDayKey(new Date());
  const todayGuests = guests.filter((g) => getDayKey(g.created_at) === todayKey);
  if (todayGuests.length === 0) return 1;
  return Math.max(...todayGuests.map((g) => g.serial_number)) + 1;
}
