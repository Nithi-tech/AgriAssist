'use client';

import { useState, useEffect } from 'react';

/**
 * A safe translation hook that avoids SSR issues
 * This is a simplified version that focuses on stability
 */
export function useSafeTranslation() {
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    setMounted(true);
    // Get language from localStorage after mount to avoid SSR issues
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('app.lang') || 'en';
      setLanguage(savedLanguage);
    }
  }, []);

  // Simple translation function with fallbacks
  const t = (key: string, fallback: string = key): string => {
    // During SSR or before mount, return the fallback
    if (!mounted) {
      return fallback;
    }

    // Basic translations for common keys
    const translations: Record<string, Record<string, string>> = {
      en: {
        dashboard: 'Dashboard',
        settings: 'Settings',
        settingsTitle: 'Settings',
        welcome: 'Welcome',
        language: 'Language',
        loading: 'Loading',
        success: 'Success',
        error: 'Error',
        save: 'Save',
        cancel: 'Cancel',
        close: 'Close',
        submit: 'Submit',
        farmerProfile: 'Farmer Profile',
        contactLocation: 'Contact & Location',
        phone: 'Phone',
        location: 'Location',
        farmDetails: 'Farm Details',
        landSize: 'Land Size',
        primaryCrops: 'Primary Crops',
        farmingType: 'Farming Type',
        irrigationYield: 'Irrigation & Yield',
        irrigationSource: 'Irrigation Source',
        annualYield: 'Annual Yield',
        challengesFaced: 'Challenges Faced',
        needsGoals: 'Needs & Goals',
        viewFarmActivity: 'View Farm Activity',
        editProfile: 'Edit Profile',
        viewAnalytics: 'View Analytics',
        age: 'Age',
        appName: 'AgriAssist'
      },
      hi: {
        dashboard: 'डैशबोर्ड',
        settings: 'सेटिंग्स',
        welcome: 'स्वागत',
        language: 'भाषा',
        farmerProfile: 'किसान प्रोफाइल',
        appName: 'एग्रीअसिस्ट'
      },
      ta: {
        dashboard: 'டாஷ்போர்டு',
        settings: 'அமைப்புகள்',
        welcome: 'வரவேற்கிறோம்',
        language: 'மொழி',
        farmerProfile: 'விவசாயி சுயவிவரம்',
        appName: 'அக்ரிஅசிஸ்ட்'
      }
    };

    const currentTranslations = translations[language] || translations.en;
    return currentTranslations[key] || fallback;
  };

  return {
    t,
    language,
    mounted,
    setLanguage: (newLanguage: string) => {
      setLanguage(newLanguage);
      if (typeof window !== 'undefined') {
        localStorage.setItem('app.lang', newLanguage);
      }
    }
  };
}
