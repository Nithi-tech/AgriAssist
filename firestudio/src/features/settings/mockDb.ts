import { SettingsBundle, FarmerProfile, AppSettings, NotificationPreferences, FarmingReminders, Privacy } from './types';

const STORAGE_KEY = 'agriassist.settings';

const DEFAULTS: SettingsBundle = {
  profile: {
    id: 'farmer-001',
    name: 'John Farmer',
    mobileNumber: '+91-9876543210',
    village: 'Kharif Village',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    farmAreaAcres: 5,
    primaryCrop: 'Wheat',
    soilType: 'Loamy',
    profilePicBase64: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  app: {
    language: 'en',
    theme: 'light',
    offlineMode: false,
    autoSyncSchemes: true,
    backupTimestamp: undefined,
  },
  notifications: {
    priceAlerts: true,
    weatherWarnings: true,
    schemeUpdates: true,
    cropReminders: true,
    expertAdvice: false,
    channels: ['inapp'],
    familyContacts: [],
  },
  reminders: {
    irrigation: {
      enabled: true,
      frequencyDays: 3,
      bestTimeOfDay: 'morning',
    },
    fertilizer: {
      enabled: false,
      nextDate: undefined,
    },
    pesticide: {
      enabled: false,
      nextDate: undefined,
    },
  },
  privacy: {
    shareProductionData: true,
    expertContact: true,
  },
};

// Simulate network delay
const delay = (ms: number = 350) => new Promise(resolve => setTimeout(resolve, ms));

export async function getBundle(): Promise<SettingsBundle> {
  await delay();
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    // Initialize with defaults on first run
    await setBundle(DEFAULTS);
    return DEFAULTS;
  }
  
  try {
    const parsed = JSON.parse(stored);
    // Merge with defaults to handle any missing fields
    return {
      ...DEFAULTS,
      ...parsed,
      profile: { ...DEFAULTS.profile, ...parsed.profile },
      app: { ...DEFAULTS.app, ...parsed.app },
      notifications: { ...DEFAULTS.notifications, ...parsed.notifications },
      reminders: { ...DEFAULTS.reminders, ...parsed.reminders },
      privacy: { ...DEFAULTS.privacy, ...parsed.privacy },
    };
  } catch (error) {
    console.error('Failed to parse stored settings:', error);
    return DEFAULTS;
  }
}

export async function setBundle(bundle: SettingsBundle): Promise<void> {
  await delay();
  
  const updatedBundle = {
    ...bundle,
    profile: {
      ...bundle.profile,
      updatedAt: new Date().toISOString(),
    },
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBundle));
}

export async function updateProfile(patch: Partial<FarmerProfile>): Promise<FarmerProfile> {
  await delay();
  
  const bundle = await getBundle();
  const updatedProfile = {
    ...bundle.profile,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  
  await setBundle({
    ...bundle,
    profile: updatedProfile,
  });
  
  return updatedProfile;
}

export async function updateApp(patch: Partial<AppSettings>): Promise<AppSettings> {
  await delay();
  
  const bundle = await getBundle();
  const updatedApp = {
    ...bundle.app,
    ...patch,
  };
  
  await setBundle({
    ...bundle,
    app: updatedApp,
  });
  
  return updatedApp;
}

export async function updateNotifications(patch: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
  await delay();
  
  const bundle = await getBundle();
  const updatedNotifications = {
    ...bundle.notifications,
    ...patch,
  };
  
  await setBundle({
    ...bundle,
    notifications: updatedNotifications,
  });
  
  return updatedNotifications;
}

export async function updateReminders(patch: Partial<FarmingReminders>): Promise<FarmingReminders> {
  await delay();
  
  const bundle = await getBundle();
  const updatedReminders = {
    ...bundle.reminders,
    ...patch,
    irrigation: { ...bundle.reminders.irrigation, ...patch.irrigation },
    fertilizer: { ...bundle.reminders.fertilizer, ...patch.fertilizer },
    pesticide: { ...bundle.reminders.pesticide, ...patch.pesticide },
  };
  
  await setBundle({
    ...bundle,
    reminders: updatedReminders,
  });
  
  return updatedReminders;
}

export async function updatePrivacy(patch: Partial<Privacy>): Promise<Privacy> {
  await delay();
  
  const bundle = await getBundle();
  const updatedPrivacy = {
    ...bundle.privacy,
    ...patch,
  };
  
  await setBundle({
    ...bundle,
    privacy: updatedPrivacy,
  });
  
  return updatedPrivacy;
}

export async function backup(): Promise<Blob> {
  await delay(500);
  
  const bundle = await getBundle();
  const backupData = {
    ...bundle,
    app: {
      ...bundle.app,
      backupTimestamp: new Date().toISOString(),
    },
  };
  
  // Update the backup timestamp
  await setBundle(backupData);
  
  const jsonString = JSON.stringify(backupData, null, 2);
  return new Blob([jsonString], { type: 'application/json' });
}

export async function restore(file: File): Promise<void> {
  await delay(500);
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Validate the structure (basic check)
        if (!data.profile || !data.app || !data.notifications || !data.reminders) {
          throw new Error('Invalid backup file format');
        }
        
        await setBundle(data);
        resolve();
      } catch (error) {
        reject(new Error('Failed to restore backup: ' + (error as Error).message));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read backup file'));
    reader.readAsText(file);
  });
}

// Utility to reset all data
export async function resetToDefaults(): Promise<void> {
  await delay();
  localStorage.removeItem(STORAGE_KEY);
}
