'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface OfflineContextType {
  isOnline: boolean;
  offlineActions: any[];
  addOfflineAction: (action: any) => void;
  syncOfflineActions: () => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineActions, setOfflineActions] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Set initial online status
      setIsOnline(navigator.onLine);

      // Listen for online/offline events
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const addOfflineAction = (action: any) => {
    setOfflineActions(prev => [...prev, action]);
  };

  const syncOfflineActions = async () => {
    if (isOnline && offlineActions.length > 0) {
      // Process offline actions when back online
      console.log('Syncing offline actions:', offlineActions);
      setOfflineActions([]);
    }
  };

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      syncOfflineActions();
    }
  }, [isOnline]);

  const value: OfflineContextType = {
    isOnline,
    offlineActions,
    addOfflineAction,
    syncOfflineActions,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}