import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
const enTranslations = {
  "settings": {
    "title": "Settings",
    "profile": {
      "title": "Profile",
      "editProfile": "Edit Profile",
      "name": "Name",
      "mobile": "Mobile Number",
      "village": "Village",
      "district": "District",
      "state": "State",
      "farmArea": "Farm Area (Acres)",
      "primaryCrop": "Primary Crop",
      "soilType": "Soil Type",
      "profilePicture": "Profile Picture",
      "completion": "Profile Completion",
      "save": "Save",
      "cancel": "Cancel"
    },
    "language": {
      "title": "Language",
      "english": "English",
      "hindi": "हिंदी",
      "tamil": "தமிழ்",
      "telugu": "తెలుగు"
    },
    "theme": {
      "title": "Theme",
      "light": "Light",
      "dark": "Dark",
      "system": "System"
    },
    "notifications": {
      "title": "Notifications",
      "priceAlerts": "Price Alerts",
      "weatherWarnings": "Weather Warnings",
      "schemeUpdates": "Scheme Updates",
      "cropReminders": "Crop Reminders",
      "expertAdvice": "Expert Advice",
      "channels": "Notification Channels",
      "sms": "SMS",
      "whatsapp": "WhatsApp",
      "inapp": "In-App",
      "familyContacts": "Family Contacts",
      "addContact": "Add Contact",
      "removeContact": "Remove"
    },
    "reminders": {
      "title": "Farming Reminders",
      "irrigation": "Irrigation Reminders",
      "enabled": "Enabled",
      "frequency": "Frequency (Days)",
      "timeOfDay": "Best Time",
      "morning": "Morning",
      "evening": "Evening",
      "suggestFrequency": "Suggest Frequency",
      "fertilizer": "Fertilizer Schedule",
      "pesticide": "Pesticide Schedule",
      "nextDate": "Next Date"
    },
    "privacy": {
      "title": "Privacy & Data",
      "shareProduction": "Share Production Data",
      "expertContact": "Allow Expert Contact",
      "privacyPolicy": "Privacy Policy"
    },
    "data": {
      "title": "Data & Backup",
      "exportData": "Export Data",
      "importData": "Import Data",
      "lastBackup": "Last Backup",
      "offlineMode": "Offline Mode",
      "autoSync": "Auto-sync Govt Schemes",
      "onlineFeatures": "Online features limited while offline"
    },
    "quickActions": {
      "title": "Quick Actions",
      "exportBackup": "Export Backup",
      "importBackup": "Import Backup",
      "switchLanguage": "Switch Language",
      "exportPDF": "Export PDF Report",
      "savedLocally": "Your changes are saved locally"
    },
    "aiAssistant": {
      "title": "AI Assistant",
      "open": "Open Assistant"
    },
    "messages": {
      "profileUpdated": "Profile updated successfully",
      "settingsSaved": "Settings saved",
      "backupExported": "Backup exported successfully",
      "backupImported": "Backup imported successfully",
      "languageChanged": "Language changed",
      "themeChanged": "Theme changed",
      "offlineModeEnabled": "Offline mode enabled",
      "offlineModeDisabled": "Offline mode disabled",
      "error": "An error occurred. Please try again.",
      "invalidFile": "Invalid backup file",
      "networkError": "Network error - please try again"
    }
  }
};

const hiTranslations = {
  "settings": {
    "title": "सेटिंग्स",
    "profile": {
      "title": "प्रोफ़ाइल",
      "editProfile": "प्रोफ़ाइल संपादित करें",
      "name": "नाम",
      "mobile": "मोबाइल नंबर",
      "village": "गाँव",
      "district": "जिला",
      "state": "राज्य",
      "farmArea": "खेत का क्षेत्रफल (एकड़)",
      "primaryCrop": "मुख्य फसल",
      "soilType": "मिट्टी का प्रकार",
      "profilePicture": "प्रोफ़ाइल चित्र",
      "completion": "प्रोफ़ाइल पूर्णता",
      "save": "सहेजें",
      "cancel": "रद्द करें"
    },
    "language": {
      "title": "भाषा",
      "english": "English",
      "hindi": "हिंदी",
      "tamil": "தமிழ்",
      "telugu": "తెలుగు"
    },
    "theme": {
      "title": "थीम",
      "light": "उजला",
      "dark": "गहरा",
      "system": "सिस्टम"
    },
    "notifications": {
      "title": "सूचनाएं",
      "priceAlerts": "मूल्य अलर्ट",
      "weatherWarnings": "मौसम चेतावनी",
      "schemeUpdates": "योजना अपडेट",
      "cropReminders": "फसल अनुस्मारक",
      "expertAdvice": "विशेषज्ञ सलाह",
      "channels": "सूचना चैनल",
      "sms": "SMS",
      "whatsapp": "WhatsApp",
      "inapp": "ऐप में",
      "familyContacts": "पारिवारिक संपर्क",
      "addContact": "संपर्क जोड़ें",
      "removeContact": "हटाएं"
    },
    "reminders": {
      "title": "कृषि अनुस्मारक",
      "irrigation": "सिंचाई अनुस्मारक",
      "enabled": "सक्षम",
      "frequency": "आवृत्ति (दिन)",
      "timeOfDay": "सबसे अच्छा समय",
      "morning": "सुबह",
      "evening": "शाम",
      "suggestFrequency": "आवृत्ति सुझाएं",
      "fertilizer": "उर्वरक कार्यक्रम",
      "pesticide": "कीटनाशक कार्यक्रम",
      "nextDate": "अगली तारीख"
    },
    "privacy": {
      "title": "गोपनीयता और डेटा",
      "shareProduction": "उत्पादन डेटा साझा करें",
      "expertContact": "विशेषज्ञ संपर्क की अनुमति दें",
      "privacyPolicy": "गोपनीयता नीति"
    },
    "data": {
      "title": "डेटा और बैकअप",
      "exportData": "डेटा निर्यात करें",
      "importData": "डेटा आयात करें",
      "lastBackup": "अंतिम बैकअप",
      "offlineMode": "ऑफ़लाइन मोड",
      "autoSync": "सरकारी योजनाओं का ऑटो-सिंक",
      "onlineFeatures": "ऑफ़लाइन होने पर ऑनलाइन सुविधाएं सीमित"
    },
    "quickActions": {
      "title": "त्वरित क्रियाएं",
      "exportBackup": "बैकअप निर्यात करें",
      "importBackup": "बैकअप आयात करें",
      "switchLanguage": "भाषा बदलें",
      "exportPDF": "PDF रिपोर्ट निर्यात करें",
      "savedLocally": "आपके बदलाव स्थानीय रूप से सहेजे गए हैं"
    },
    "aiAssistant": {
      "title": "AI सहायक",
      "open": "सहायक खोलें"
    },
    "messages": {
      "profileUpdated": "प्रोफ़ाइल सफलतापूर्वक अपडेट की गई",
      "settingsSaved": "सेटिंग्स सहेजी गईं",
      "backupExported": "बैकअप सफलतापूर्वक निर्यात किया गया",
      "backupImported": "बैकअप सफलतापूर्वक आयात किया गया",
      "languageChanged": "भाषा बदली गई",
      "themeChanged": "थीम बदली गई",
      "offlineModeEnabled": "ऑफ़लाइन मोड सक्षम किया गया",
      "offlineModeDisabled": "ऑफ़लाइन मोड अक्षम किया गया",
      "error": "एक त्रुटि हुई। कृपया पुनः प्रयास करें।",
      "invalidFile": "अमान्य बैकअप फ़ाइल",
      "networkError": "नेटवर्क त्रुटि - कृपया पुनः प्रयास करें"
    }
  }
};

// Add abbreviated versions for other languages
const taTranslations = enTranslations; // Use English as fallback for now
const teTranslations = enTranslations; // Use English as fallback for now

const resources = {
  en: { translation: enTranslations },
  hi: { translation: hiTranslations },
  ta: { translation: taTranslations },
  te: { translation: teTranslations },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
