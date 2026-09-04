import { Reminder, GameItem } from '../types';

const DB_NAME = 'CogniviveOfflineDB';
const DB_VERSION = 1;

// IndexedDB stores: 'sessions_queue', 'reminders_queue', 'cached_data'
const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sessions_queue')) {
        db.createObjectStore('sessions_queue', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('reminders_queue')) {
        db.createObjectStore('reminders_queue', { keyPath: 'reminderId' });
      }
      if (!db.objectStoreNames.contains('cached_data')) {
        db.createObjectStore('cached_data', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const offlineDb = {
  // 1. Cache Reminders locally
  cacheReminders: async (reminders: Reminder[]): Promise<void> => {
    try {
      const db = await openDb();
      const tx = db.transaction('cached_data', 'readwrite');
      tx.objectStore('cached_data').put({ key: 'today_reminders', data: reminders, updatedAt: Date.now() });
    } catch (err) {
      console.warn('Failed to cache reminders in IndexedDB:', err);
      // Fallback to localStorage
      localStorage.setItem('cached_today_reminders', JSON.stringify(reminders));
    }
  },

  getCachedReminders: async (): Promise<Reminder[]> => {
    try {
      const db = await openDb();
      const tx = db.transaction('cached_data', 'readonly');
      const req = tx.objectStore('cached_data').get('today_reminders');
      return new Promise((resolve) => {
        req.onsuccess = () => resolve(req.result ? req.result.data : []);
        req.onerror = () => resolve([]);
      });
    } catch (err) {
      const fallback = localStorage.getItem('cached_today_reminders');
      return fallback ? JSON.parse(fallback) : [];
    }
  },

  // 2. Queue Game Session Offline
  queueSession: async (sessionPayload: any): Promise<void> => {
    const sessionWithId = {
      ...sessionPayload,
      id: sessionPayload.id || `offline_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      queuedAt: new Date().toISOString()
    };

    try {
      const db = await openDb();
      const tx = db.transaction('sessions_queue', 'readwrite');
      tx.objectStore('sessions_queue').put(sessionWithId);
    } catch (err) {
      console.warn('IndexedDB unavailable, storing session in localStorage queue');
      const current = JSON.parse(localStorage.getItem('offline_sessions_queue') || '[]');
      current.push(sessionWithId);
      localStorage.setItem('offline_sessions_queue', JSON.stringify(current));
    }
  },

  getQueuedSessions: async (): Promise<any[]> => {
    try {
      const db = await openDb();
      const tx = db.transaction('sessions_queue', 'readonly');
      const req = tx.objectStore('sessions_queue').getAll();
      return new Promise((resolve) => {
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch (err) {
      return JSON.parse(localStorage.getItem('offline_sessions_queue') || '[]');
    }
  },

  clearQueuedSessions: async (idsToRemove: string[]): Promise<void> => {
    try {
      const db = await openDb();
      const tx = db.transaction('sessions_queue', 'readwrite');
      const store = tx.objectStore('sessions_queue');
      for (const id of idsToRemove) {
        store.delete(id);
      }
    } catch (err) {
      const current = JSON.parse(localStorage.getItem('offline_sessions_queue') || '[]');
      const filtered = current.filter((s: any) => !idsToRemove.includes(s.id));
      localStorage.setItem('offline_sessions_queue', JSON.stringify(filtered));
    }
  },

  // 3. Queue Reminder Acknowledgement Offline
  queueReminderAck: async (reminderId: string, status: string = 'TAKEN', voiceConfirmed = false, notes = ''): Promise<void> => {
    const item = {
      reminderId,
      status,
      voiceConfirmed,
      notes,
      scheduledDate: new Date().toISOString().split('T')[0],
      acknowledgedAt: new Date().toISOString()
    };

    try {
      const db = await openDb();
      const tx = db.transaction('reminders_queue', 'readwrite');
      tx.objectStore('reminders_queue').put(item);
    } catch (err) {
      const current = JSON.parse(localStorage.getItem('offline_reminders_queue') || '[]');
      const existingIdx = current.findIndex((r: any) => r.reminderId === reminderId);
      if (existingIdx >= 0) current[existingIdx] = item;
      else current.push(item);
      localStorage.setItem('offline_reminders_queue', JSON.stringify(current));
    }
  },

  getQueuedReminderAcks: async (): Promise<any[]> => {
    try {
      const db = await openDb();
      const tx = db.transaction('reminders_queue', 'readonly');
      const req = tx.objectStore('reminders_queue').getAll();
      return new Promise((resolve) => {
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch (err) {
      return JSON.parse(localStorage.getItem('offline_reminders_queue') || '[]');
    }
  },

  clearQueuedReminderAcks: async (reminderIds: string[]): Promise<void> => {
    try {
      const db = await openDb();
      const tx = db.transaction('reminders_queue', 'readwrite');
      const store = tx.objectStore('reminders_queue');
      for (const id of reminderIds) {
        store.delete(id);
      }
    } catch (err) {
      const current = JSON.parse(localStorage.getItem('offline_reminders_queue') || '[]');
      const filtered = current.filter((r: any) => !reminderIds.includes(r.reminderId));
      localStorage.setItem('offline_reminders_queue', JSON.stringify(filtered));
    }
  }
};
