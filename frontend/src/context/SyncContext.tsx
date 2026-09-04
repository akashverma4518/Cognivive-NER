import React, { createContext, useContext, useState, useEffect } from 'react';
import { offlineDb } from '../services/offlineDb';
import { apiClient } from '../services/api';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  syncStatusMessage: string | null;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  // Check pending items count
  const updatePendingCount = async () => {
    try {
      const [sessions, reminders] = await Promise.all([
        offlineDb.getQueuedSessions(),
        offlineDb.getQueuedReminderAcks()
      ]);
      const total = sessions.length + reminders.length;
      setPendingCount(total);
    } catch (e) {
      console.warn('Could not read pending sync count:', e);
    }
  };

  // Sync execution
  const triggerSync = async () => {
    if (!navigator.onLine || isSyncing) return;

    try {
      setIsSyncing(true);
      setSyncStatusMessage('Syncing...');

      const [sessions, reminderLogs] = await Promise.all([
        offlineDb.getQueuedSessions(),
        offlineDb.getQueuedReminderAcks()
      ]);

      if (sessions.length === 0 && reminderLogs.length === 0) {
        setPendingCount(0);
        setIsSyncing(false);
        setSyncStatusMessage(null);
        return;
      }

      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const res = await apiClient.post('/sync/batch', {
        batchId,
        sessions,
        reminderLogs
      });

      if (res.data.success) {
        // Clear synced items
        const sessionIds = sessions.map(s => s.id).filter(Boolean);
        const reminderIds = reminderLogs.map(r => r.reminderId).filter(Boolean);

        await Promise.all([
          offlineDb.clearQueuedSessions(sessionIds),
          offlineDb.clearQueuedReminderAcks(reminderIds)
        ]);

        await updatePendingCount();
        setSyncStatusMessage('Synced successfully');
        setTimeout(() => setSyncStatusMessage(null), 4000);
      }
    } catch (err) {
      console.error('Batch sync failed:', err);
      setSyncStatusMessage('Saved on this device (will retry shortly)');
    } finally {
      setIsSyncing(false);
    }
  };

  // Listen to network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatusMessage('Working offline. All progress saved safely on this device.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <SyncContext.Provider value={{ isOnline, isSyncing, pendingCount, syncStatusMessage, triggerSync }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};

// Elder-Friendly Sync Status Banner Component
export const SyncStatusBar: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, syncStatusMessage, triggerSync } = useSync();

  if (isOnline && pendingCount === 0 && !syncStatusMessage) {
    return null; // Clean screen when all is synchronized
  }

  return (
    <div className={`w-full py-2.5 px-4 text-center font-bold text-sm md:text-base border-b transition-all flex items-center justify-center gap-2 ${
      !isOnline
        ? 'bg-purple-100 border-purple-200 text-[#111827]'
        : isSyncing
        ? 'bg-sky-100 border-sky-300 text-sky-950 animate-pulse'
        : 'bg-emerald-100 border-emerald-300 text-emerald-950'
    }`}>
      {!isOnline ? (
        <>
          <WifiOff className="w-5 h-5 text-[#6C3EDC] shrink-0" />
          <span>Working Offline — All progress is saved on this device</span>
          {pendingCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-purple-200 text-[#6C3EDC] rounded-full text-xs font-black">
              {pendingCount} saved
            </span>
          )}
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="w-5 h-5 text-sky-700 animate-spin shrink-0" />
          <span>Syncing with server...</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{syncStatusMessage || 'Synced successfully'}</span>
        </>
      )}
    </div>
  );
};
