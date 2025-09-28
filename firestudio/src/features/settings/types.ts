export type NotificationChannel = 'sms' | 'whatsapp' | 'inapp';

export interface FarmerProfile {
  id: string;
  name: string;
  mobileNumber?: string;
  village?: string;
  district?: string;
  state?: string;
  farmAreaAcres?: number;
  primaryCrop?: string;
  soilType?: string;
  profilePicBase64?: string; // store as base64 string
  additionalInfo?: string; // additional information about the farm
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  language: 'en' | 'hi' | 'ta' | 'te';
  theme: 'light' | 'dark' | 'system';
  offlineMode: boolean;
  autoSyncSchemes: boolean;
  backupTimestamp?: string;
}

export interface NotificationPreferences {
  priceAlerts: boolean;
  weatherWarnings: boolean;
  schemeUpdates: boolean;
  cropReminders: boolean;
  expertAdvice: boolean;
  channels: NotificationChannel[]; // e.g., ['inapp','whatsapp']
  familyContacts: string[];        // phone numbers
}

export interface FarmingReminders {
  irrigation: {
    enabled: boolean;
    frequencyDays?: number;  // computed suggestion OK
    bestTimeOfDay?: 'morning'|'evening';
  };
  fertilizer: {
    enabled: boolean;
    nextDate?: string;       // ISO
  };
  pesticide: {
    enabled: boolean;
    nextDate?: string;       // ISO
  };
}

export interface Privacy {
  shareProductionData: boolean;
  expertContact: boolean;
}

export interface SettingsBundle {
  profile: FarmerProfile;
  app: AppSettings;
  notifications: NotificationPreferences;
  reminders: FarmingReminders;
  privacy: Privacy;
}
