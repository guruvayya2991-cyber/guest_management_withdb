import type { Guest, Extension, Settings } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/types';

export interface GuestRecord extends Guest {
  extensions: Extension[];
}

const DB_NAME = 'UnlimitedFunDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Guests object store
      if (!db.objectStoreNames.contains('guests')) {
        const guestStore = db.createObjectStore('guests', { keyPath: 'id' });
        guestStore.createIndex('created_at', 'created_at', { unique: false });
        guestStore.createIndex('serial_number', 'serial_number', { unique: false });
        guestStore.createIndex('status', 'status', { unique: false });
      }

      // 2. Settings object store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
}

// ---------------- GUEST OPERATIONS ----------------

export async function idbGetAllGuests(): Promise<GuestRecord[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('guests', 'readonly');
      const store = tx.objectStore('guests');
      const request = store.getAll();

      request.onsuccess = () => {
        const list = (request.result || []) as GuestRecord[];
        // Sort ascending by in_time / serial_number
        list.sort((a, b) => a.serial_number - b.serial_number);
        resolve(list);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('idbGetAllGuests error:', err);
    return [];
  }
}

export async function idbSaveGuest(guest: GuestRecord): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('guests', 'readwrite');
    const store = tx.objectStore('guests');
    const request = store.put(guest);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function idbBatchSaveGuests(guests: GuestRecord[]): Promise<void> {
  if (guests.length === 0) return;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('guests', 'readwrite');
    const store = tx.objectStore('guests');

    for (const guest of guests) {
      store.put(guest);
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function idbClearAllGuests(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('guests', 'readwrite');
    const store = tx.objectStore('guests');
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function idbClearTodayGuests(): Promise<void> {
  const all = await idbGetAllGuests();
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayIds = all.filter((g) => g.created_at.slice(0, 10) === todayStr).map((g) => g.id);
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('guests', 'readwrite');
    const store = tx.objectStore('guests');
    for (const id of todayIds) {
      store.delete(id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbUpdateGuest(id: string, patch: Partial<GuestRecord>): Promise<GuestRecord | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('guests', 'readwrite');
    const store = tx.objectStore('guests');
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const existing = getReq.result as GuestRecord | undefined;
      if (!existing) {
        resolve(null);
        return;
      }
      const updated: GuestRecord = {
        ...existing,
        ...patch,
        updated_at: new Date().toISOString(),
      };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve(updated);
      putReq.onerror = () => reject(putReq.error);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

export async function idbBatchUpdateGuests(ids: string[], patch: Partial<GuestRecord>): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('guests', 'readwrite');
    const store = tx.objectStore('guests');
    const nowIso = new Date().toISOString();

    for (const id of ids) {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const existing = getReq.result as GuestRecord | undefined;
        if (existing) {
          store.put({
            ...existing,
            ...patch,
            updated_at: nowIso,
          });
        }
      };
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}


export async function idbDeleteGuest(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('guests', 'readwrite');
    const store = tx.objectStore('guests');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function idbDeleteCompletedGuests(): Promise<void> {
  const all = await idbGetAllGuests();
  const completedIds = all.filter((g) => g.status === 'completed').map((g) => g.id);
  if (completedIds.length === 0) return;
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('guests', 'readwrite');
    const store = tx.objectStore('guests');
    for (const id of completedIds) {
      store.delete(id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------------- SETTINGS OPERATIONS ----------------

export async function idbGetSettings(): Promise<Settings> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const request = store.get(1);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result as Settings);
        } else {
          const initial: Settings = {
            id: 1,
            ...DEFAULT_SETTINGS,
            updated_at: new Date().toISOString(),
          };
          resolve(initial);
        }
      };

      request.onerror = () => {
        resolve({
          id: 1,
          ...DEFAULT_SETTINGS,
          updated_at: new Date().toISOString(),
        });
      };
    });
  } catch {
    return {
      id: 1,
      ...DEFAULT_SETTINGS,
      updated_at: new Date().toISOString(),
    };
  }
}

export async function idbSaveSettings(settings: Settings): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const request = store.put(settings);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('idbSaveSettings error:', err);
  }
}
