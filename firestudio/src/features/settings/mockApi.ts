import { 
  getBundle, 
  setBundle, 
  updateProfile, 
  updateApp, 
  updateNotifications, 
  updateReminders, 
  updatePrivacy,
  backup, 
  restore 
} from './mockDb';
import { FarmerProfile, SettingsBundle } from './types';

// Simulate occasional failures for error handling testing
const shouldFail = () => Math.random() < 0.05; // 5% chance

const withErrorHandling = async <T>(operation: () => Promise<T>): Promise<T> => {
  if (shouldFail()) {
    throw new Error('Network error - please try again');
  }
  return operation();
};

export async function getFarmer(id: string): Promise<FarmerProfile> {
  return withErrorHandling(async () => {
    const bundle = await getBundle();
    return bundle.profile;
  });
}

export async function putFarmer(id: string, patch: Partial<FarmerProfile>): Promise<FarmerProfile> {
  return withErrorHandling(async () => {
    return updateProfile(patch);
  });
}

export async function getSettings(): Promise<SettingsBundle> {
  return withErrorHandling(async () => {
    return getBundle();
  });
}

export async function postSettings(partial: Partial<SettingsBundle>): Promise<SettingsBundle> {
  return withErrorHandling(async () => {
    const bundle = await getBundle();
    const merged: SettingsBundle = {
      ...bundle,
      ...partial,
      profile: { ...bundle.profile, ...partial.profile },
      app: { ...bundle.app, ...partial.app },
      notifications: { ...bundle.notifications, ...partial.notifications },
      reminders: { 
        ...bundle.reminders, 
        ...partial.reminders,
        irrigation: { ...bundle.reminders.irrigation, ...partial.reminders?.irrigation },
        fertilizer: { ...bundle.reminders.fertilizer, ...partial.reminders?.fertilizer },
        pesticide: { ...bundle.reminders.pesticide, ...partial.reminders?.pesticide },
      },
      privacy: { ...bundle.privacy, ...partial.privacy },
    };
    
    await setBundle(merged);
    return merged;
  });
}

export async function updateAppSettings(patch: Partial<SettingsBundle['app']>): Promise<SettingsBundle['app']> {
  return withErrorHandling(async () => {
    return updateApp(patch);
  });
}

export async function updateNotificationSettings(patch: Partial<SettingsBundle['notifications']>): Promise<SettingsBundle['notifications']> {
  return withErrorHandling(async () => {
    return updateNotifications(patch);
  });
}

export async function updateReminderSettings(patch: Partial<SettingsBundle['reminders']>): Promise<SettingsBundle['reminders']> {
  return withErrorHandling(async () => {
    return updateReminders(patch);
  });
}

export async function updatePrivacySettings(patch: Partial<SettingsBundle['privacy']>): Promise<SettingsBundle['privacy']> {
  return withErrorHandling(async () => {
    return updatePrivacy(patch);
  });
}

export const exportBackup = backup;
export const importBackup = restore;
