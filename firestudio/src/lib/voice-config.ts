// Voice configuration for supported languages
export const SUPPORTED_LANGUAGES = {
  'hi': {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    fallbackVoices: ['hi-IN', 'en-IN']
  },
  'ta': {
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    fallbackVoices: ['ta-IN', 'en-IN']
  },
  'te': {
    code: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    fallbackVoices: ['te-IN', 'en-IN']
  },
  'en': {
    code: 'en-US',
    name: 'English',
    nativeName: 'English',
    fallbackVoices: ['en-US', 'en-GB', 'en-IN']
  },
  'bn': {
    code: 'bn-IN',
    name: 'Bengali',
    nativeName: 'বাংলা',
    fallbackVoices: ['bn-IN', 'en-IN']
  },
  'gu': {
    code: 'gu-IN',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    fallbackVoices: ['gu-IN', 'en-IN']
  },
  'as': {
    code: 'as-IN',
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    fallbackVoices: ['as-IN', 'en-IN']
  }
} as const;

// Optimal speech settings for each language
export const LANGUAGE_SPEECH_SETTINGS = {
  'hi': { rate: 0.95, pitch: 1.05 },
  'ta': { rate: 0.9, pitch: 1.1 },
  'te': { rate: 0.9, pitch: 1.1 },
  'en': { rate: 1.0, pitch: 1.0 },
  'bn': { rate: 0.95, pitch: 1.05 },
  'gu': { rate: 0.95, pitch: 1.05 },
  'as': { rate: 0.95, pitch: 1.05 }
} as const;

// Natural pause markers for each language
export const PAUSE_MARKERS = {
  'hi': ['।', ',', '?', '!'],
  'ta': ['।', ',', '?', '!'],
  'te': ['।', ',', '?', '!'],
  'en': ['.', ',', '?', '!', ';'],
  'bn': ['।', ',', '?', '!'],
  'gu': ['।', ',', '?', '!'],
  'as': ['।', ',', '?', '!']
} as const;

// Add natural pauses to text based on language
export function addNaturalPauses(text: string, language: keyof typeof SUPPORTED_LANGUAGES): string {
  const markers = PAUSE_MARKERS[language];
  let result = text;
  
  markers.forEach(marker => {
    result = result.replace(new RegExp(`\\${marker}\\s*`, 'g'), `${marker} <break time="500ms"/> `);
  });
  
  return result;
}

// Validate language support and get voice settings
export function getVoiceSettings(language: string) {
  const langKey = language.split('-')[0] as keyof typeof SUPPORTED_LANGUAGES;
  if (!SUPPORTED_LANGUAGES[langKey]) {
    throw new Error(`Language ${language} is not supported. Please select from: Hindi, Tamil, Telugu, English, Bengali, Gujarati, or Assamese.`);
  }
  
  return {
    ...LANGUAGE_SPEECH_SETTINGS[langKey],
    language: SUPPORTED_LANGUAGES[langKey].code,
    fallbackVoices: SUPPORTED_LANGUAGES[langKey].fallbackVoices
  };
}
