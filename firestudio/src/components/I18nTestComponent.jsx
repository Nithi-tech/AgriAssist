// Test component to validate the language switcher integration
// This can be imported in any page to test the functionality

import React from 'react';
import { useLanguage } from '@/hooks/use-language';

export function I18nTestComponent() {
  const { t, language, setLanguage } = useLanguage();
  
  const testKeys = [
    'welcome',
    'dashboard', 
    'language',
    'settings.title',
    'settings.language_updated',
    'about.title',
    'contact.title'
  ];

  const testLanguages = ['en', 'hi', 'ta', 'ml', 'te'];

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg max-w-4xl mx-auto my-4">
      <h2 className="text-2xl font-bold mb-4">🧪 I18n System Test</h2>
      
      <div className="mb-4">
        <p><strong>Current Language:</strong> {language}</p>
        <p><strong>Storage Value:</strong> {typeof window !== 'undefined' ? localStorage.getItem('app.lang') : 'N/A'}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Language Switcher:</h3>
        <div className="flex gap-2 flex-wrap">
          {testLanguages.map(lang => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-3 py-1 rounded border ${
                language === lang 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Translation Test:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testKeys.map(key => {
            const value = getNestedValue(t, key);
            const isValid = value && typeof value === 'string' && value !== key;
            
            return (
              <div key={key} className={`p-3 rounded border ${
                isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="font-mono text-sm text-gray-600">{key}</div>
                <div className={`mt-1 ${isValid ? 'text-green-800' : 'text-red-800'}`}>
                  {isValid ? '✅' : '❌'} {value || 'MISSING'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-sm text-gray-600">
        <p>✅ = Translation found and valid</p>
        <p>❌ = Translation missing or fallback to key name</p>
      </div>
    </div>
  );
}

export default I18nTestComponent;
