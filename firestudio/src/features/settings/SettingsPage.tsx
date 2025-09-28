import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { MessageCircle, Settings as SettingsIcon } from 'lucide-react';
import { SettingsBundle } from './types';
import { getSettings } from './mockApi';
import { ProfileCard } from './components/ProfileCard';
import { EditProfileModal } from './components/EditProfileModal';
import { ThemeCard } from './components/ThemeCard';
import { LanguageCard } from './components/LanguageCard';
import { PrivacyCard } from './components/PrivacyCard';
import { DataCard } from './components/DataCard';
import { NotificationsCard } from './components/NotificationsCard';
import { FarmingRemindersCard } from './components/FarmingRemindersCard';
import { QuickActions } from './components/QuickActions';
import { AccessibilitySettings } from '@/components/AccessibilitySettings';
import { Toaster } from '@/components/ui/toaster';
import { toast } from '@/hooks/use-toast';

// Import i18n to initialize
import './i18n';

// Settings Context
interface SettingsContextType {
  bundle: SettingsBundle | null;
  updateBundle: (bundle: SettingsBundle) => void;
  isLoading: boolean;
  error: string | null;
}

const SettingsContext = createContext<SettingsContextType>({
  bundle: null,
  updateBundle: () => {},
  isLoading: true,
  error: null,
});

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Settings Provider Component
function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [bundle, setBundle] = useState<SettingsBundle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const settingsData = await getSettings();
      setBundle(settingsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      toast({
        title: 'Error Loading Settings',
        description: 'Please refresh the page and try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateBundle = (newBundle: SettingsBundle) => {
    setBundle(newBundle);
  };

  return (
    <SettingsContext.Provider value={{ bundle, updateBundle, isLoading, error }}>
      {children}
    </SettingsContext.Provider>
  );
}

// AI Assistant Floating Button
function AIAssistantButton() {
  const { t } = useTranslation();

  const handleOpenAssistant = () => {
    // In a real app, this would open the chatbot route
    // For now, we'll show a toast with a message
    toast({
      title: t('settings.aiAssistant.title'),
      description: 'AI Assistant feature coming soon! This would open the chatbot interface.',
    });
    
    // Alternative: Open the existing chat route if available
    // window.location.href = '/chat';
  };

  return (
    <Button
      onClick={handleOpenAssistant}
      className="fixed bottom-6 right-6 rounded-full w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 z-50"
      aria-label={t('settings.aiAssistant.open')}
    >
      <MessageCircle className="w-6 h-6 text-white" />
    </Button>
  );
}

// Loading Component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-gray-600">Loading Settings...</p>
      </div>
    </div>
  );
}

// Error Component
function ErrorScreen({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md mx-auto p-6">
        <div className="text-red-600 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-red-800">Settings Error</h2>
        <p className="text-red-600">{error}</p>
        <Button onClick={onRetry} className="bg-red-600 hover:bg-red-700">
          Try Again
        </Button>
      </div>
    </div>
  );
}

// Main Settings Page Component
function SettingsPageContent() {
  const { t } = useTranslation();
  const { bundle, updateBundle, isLoading, error } = useSettings();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !bundle) {
    return <ErrorScreen error={error || 'Unknown error'} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-gradient-enhanced settings-page">
      {/* Header with better styling */}
      <div className="settings-card shadow-lg border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 p-3 rounded-xl shadow-lg">
              <SettingsIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                {t('settings.title')}
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Manage your profile and preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content with improved spacing */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Quick Actions Bar with better spacing */}
        <div className="mb-10">
          <QuickActions 
            bundle={bundle} 
            onUpdate={updateBundle}
          />
        </div>

        {/* Settings Grid with improved layout */}
        <div className="settings-grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Profile Card - Enhanced spacing */}
          <div className="lg:col-span-2 xl:col-span-2">
            <div className="h-full">
              <ProfileCard
                profile={bundle.profile}
                onUpdate={(updatedProfile) =>
                  updateBundle({ ...bundle, profile: updatedProfile })
                }
              />
            </div>
          </div>

          {/* Theme Card with consistent height */}
          <div className="h-fit">
            <ThemeCard
              settings={bundle.app}
              onUpdate={(updatedApp) =>
                updateBundle({ ...bundle, app: updatedApp })
              }
            />
          </div>

          {/* Language Card */}
          <div className="h-fit">
            <LanguageCard
              settings={bundle.app}
              onUpdate={(updatedApp) =>
                updateBundle({ ...bundle, app: updatedApp })
              }
            />
          </div>

          {/* Data & Backup Card */}
          <div className="h-fit">
            <DataCard
              settings={bundle.app}
              onUpdate={(updatedApp) =>
                updateBundle({ ...bundle, app: updatedApp })
              }
            />
          </div>

          {/* Privacy Card */}
          <div className="h-fit">
            <PrivacyCard
              privacy={bundle.privacy}
              onUpdate={(updatedPrivacy) =>
                updateBundle({ ...bundle, privacy: updatedPrivacy })
              }
            />
          </div>

          {/* Accessibility Settings Card - New addition */}
          <div className="lg:col-span-2 xl:col-span-3">
            <AccessibilitySettings />
          </div>

          {/* Notifications Card - Better column span */}
          <div className="lg:col-span-2 xl:col-span-2">
            <NotificationsCard
              notifications={bundle.notifications}
              onUpdate={(updatedNotifications) =>
                updateBundle({ ...bundle, notifications: updatedNotifications })
              }
            />
          </div>

          {/* Farming Reminders Card */}
          <div className="lg:col-span-2 xl:col-span-1">
            <FarmingRemindersCard
              reminders={bundle.reminders}
              profile={bundle.profile}
              onUpdate={(updatedReminders) =>
                updateBundle({ ...bundle, reminders: updatedReminders })
              }
            />
          </div>
        </div>

        {/* Footer with improved styling */}
        <div className="mt-16 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50">
            <p className="text-gray-600 text-sm font-medium">
              🌾 AgriAssist Settings • All data is stored locally on your device
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Your privacy and data security are our top priorities
            </p>
          </div>
        </div>
      </div>

      {/* AI Assistant Button */}
      <AIAssistantButton />

      {/* Toast Container */}
      <Toaster />
    </div>
  );
}

// Main Export - Wrapped with Provider
export default function SettingsPage() {
  return (
    <SettingsProvider>
      <SettingsPageContent />
    </SettingsProvider>
  );
}
