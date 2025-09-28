import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Database, Download, Upload, WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { AppSettings } from '../types';
import { updateAppSettings, exportBackup, importBackup } from '../mockApi';
import { toast } from '@/hooks/use-toast';

interface DataCardProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
}

export function DataCard({ settings, onUpdate }: DataCardProps) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOfflineModeToggle = async (enabled: boolean) => {
    try {
      const updatedSettings = await updateAppSettings({ offlineMode: enabled });
      onUpdate(updatedSettings);

      // Handle service worker registration/unregistration
      if (enabled) {
        await registerServiceWorker();
      } else {
        await unregisterServiceWorker();
      }

      toast({
        title: enabled ? t('settings.messages.offlineModeEnabled') : t('settings.messages.offlineModeDisabled'),
        description: enabled 
          ? 'You can now use some features offline' 
          : 'All features require internet connection',
      });
    } catch (error) {
      toast({
        title: t('settings.messages.error'),
        description: error instanceof Error ? error.message : 'Failed to toggle offline mode',
        variant: 'destructive',
      });
    }
  };

  const handleAutoSyncToggle = async (enabled: boolean) => {
    try {
      const updatedSettings = await updateAppSettings({ autoSyncSchemes: enabled });
      onUpdate(updatedSettings);

      toast({
        title: 'Auto-sync Updated',
        description: enabled 
          ? 'Government schemes will sync automatically' 
          : 'Manual sync required for scheme updates',
      });
    } catch (error) {
      toast({
        title: t('settings.messages.error'),
        description: error instanceof Error ? error.message : 'Failed to update auto-sync setting',
        variant: 'destructive',
      });
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const blob = await exportBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agriassist-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: t('settings.messages.backupExported'),
        description: 'Your data has been exported successfully',
      });
    } catch (error) {
      toast({
        title: t('settings.messages.error'),
        description: error instanceof Error ? error.message : 'Failed to export data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      await importBackup(file);
      
      // Reload the page to reflect imported data
      window.location.reload();
      
      toast({
        title: t('settings.messages.backupImported'),
        description: 'Your data has been restored successfully',
      });
    } catch (error) {
      toast({
        title: t('settings.messages.invalidFile'),
        description: error instanceof Error ? error.message : 'Failed to import backup file',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (error) {
        console.warn('Service worker registration failed:', error);
      }
    }
  };

  const unregisterServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
        // Clear caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
      } catch (error) {
        console.warn('Service worker unregistration failed:', error);
      }
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Database className="w-5 h-5" />
            {t('settings.data.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export/Import Data */}
          <div className="space-y-4">
            <h4 className="font-medium text-blue-800">Backup & Restore</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleExportData}
                disabled={isExporting}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : t('settings.data.exportData')}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleImportData}
                disabled={isImporting}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isImporting ? 'Importing...' : t('settings.data.importData')}
              </Button>
            </div>

            {settings.backupTimestamp && (
              <p className="text-sm text-blue-600">
                {t('settings.data.lastBackup')}: {new Date(settings.backupTimestamp).toLocaleString()}
              </p>
            )}
          </div>

          {/* Offline Mode */}
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="offline-mode" className="font-medium text-blue-800 cursor-pointer">
                  {t('settings.data.offlineMode')}
                </Label>
                <Badge variant={settings.offlineMode ? 'destructive' : 'default'} className="text-xs">
                  {settings.offlineMode ? (
                    <>
                      <WifiOff className="w-3 h-3 mr-1" />
                      Offline
                    </>
                  ) : (
                    <>
                      <Wifi className="w-3 h-3 mr-1" />
                      Online
                    </>
                  )}
                </Badge>
              </div>
              <Switch
                id="offline-mode"
                checked={settings.offlineMode}
                onCheckedChange={handleOfflineModeToggle}
              />
            </div>
            {settings.offlineMode && (
              <p className="text-sm text-blue-600">{t('settings.data.onlineFeatures')}</p>
            )}
          </div>

          {/* Auto-sync Government Schemes */}
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="auto-sync" className="font-medium text-blue-800 cursor-pointer">
                {t('settings.data.autoSync')}
              </Label>
              <Switch
                id="auto-sync"
                checked={settings.autoSyncSchemes}
                onCheckedChange={handleAutoSyncToggle}
              />
            </div>
            <p className="text-sm text-blue-600">
              Automatically download and update government scheme information
            </p>
          </div>

          {/* Data Usage Info */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>Storage:</strong> All your data is stored locally on your device. 
              Enable offline mode to use core features without internet connection.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}
