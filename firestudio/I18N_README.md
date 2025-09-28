# Internationalization (i18n) System

This application uses a unified internationalization system that supports multiple Indian languages with robust fallback handling and persistence.

## Supported Languages

- **English (en)** - Default/fallback language
- **Hindi (hi)** - हिंदी
- **Tamil (ta)** - தமிழ்
- **Malayalam (ml)** - മലയാളം
- **Telugu (te)** - తెలుగు
- **Bengali (bn)** - বাংলা
- **Gujarati (gu)** - ગુજરાતી
- **Assamese (as)** - অসমীয়া

## System Architecture

### Dual System Approach

The app uses **both** systems for maximum compatibility:

1. **Custom LanguageProvider** (`src/providers/language-provider.tsx`)
   - Used by most React components via `useLanguage()` hook
   - Handles custom translations in `src/lib/translations.ts`
   - Provides type-safe translation keys

2. **i18next Integration** (`src/lib/i18n.js`) 
   - Used by settings page via `useTranslation()` hook
   - Loads translations from JSON files in `src/locales/`
   - Industry-standard i18n solution

### Synchronization

Both systems are synchronized via:
- **localStorage persistence** with key `app.lang`
- **Custom events** for same-tab synchronization
- **Storage events** for cross-tab synchronization

## Usage

### For React Components (Recommended)

```tsx
import { useLanguage } from '@/hooks/use-language';

function MyComponent() {
  const { t, language, setLanguage } = useLanguage();
  
  return (
    <div>
      <h1>{t.welcome}</h1>
      <p>{t.dashboard}</p>
      <button onClick={() => setLanguage('hi')}>
        Switch to Hindi
      </button>
    </div>
  );
}
```

### For i18next Components

```jsx
import { useTranslation } from 'react-i18next';

function SettingsComponent() {
  const { t, i18n } = useTranslation('common');
  
  return (
    <div>
      <h1>{t('settings.title')}</h1>
      <p>{t('settings.subtitle')}</p>
    </div>
  );
}
```

## Adding New Translation Keys

### Method 1: Custom Translations (Recommended for new features)

1. Add the key to `src/lib/translations.ts` in the English section:

```typescript
export const translations = {
  en: {
    // ... existing keys
    myNewFeature: {
      title: 'My New Feature',
      description: 'This is a new feature'
    }
  },
  // ... other languages
}
```

2. Add translations for other languages in the same structure
3. Use in components: `{t.myNewFeature.title}`

### Method 2: JSON Files (For i18next compatibility)

1. Add keys to `src/locales/en/common.json`:

```json
{
  "my_new_key": "My new text",
  "nested": {
    "key": "Nested value"
  }
}
```

2. Add the same structure to other language files
3. Use in components: `{t('my_new_key')}` or `{t('nested.key')}`

## Adding New Languages

1. **Add to supported list** in `src/providers/language-provider.tsx`:
```typescript
const SUPPORTED_LANGUAGES = ['hi', 'ta', 'te', 'en', 'bn', 'gu', 'as', 'new_lang'] as const;
```

2. **Create JSON file**: `src/locales/new_lang/common.json`

3. **Import in i18n.js**: 
```javascript
import newLangCommon from '../locales/new_lang/common.json';
```

4. **Add to resources**:
```javascript
const resources = {
  // ... existing
  new_lang: {
    common: newLangCommon,
  },
};
```

5. **Add to translations.ts**:
```typescript
export const translations = {
  // ... existing
  new_lang: {
    // Add translations here
  }
}
```

## Fallback System

The system provides robust fallbacks:

1. **Primary**: Current language translation
2. **Secondary**: English translation for the same key  
3. **Tertiary**: Key name itself (for debugging)

### Example Fallback Flow

```
User selects Tamil (ta) → Look for key in Tamil → 
Key missing? → Look for key in English → 
Still missing? → Return key name
```

## Persistence

Language selection is automatically:
- ✅ Saved to `localStorage` as `app.lang`
- ✅ Restored on page reload
- ✅ Synced across browser tabs
- ✅ Applied immediately without page refresh

## Debugging

Enable debug mode by setting localStorage:

```javascript
localStorage.setItem('DEBUG_I18N', 'true');
```

This will:
- Log language changes to console
- Show missing translation warnings
- Display fallback usage
- Print missing keys table

## Performance Optimizations

1. **300ms Debouncing**: Prevents rapid language switching issues
2. **Memoized Translations**: React re-renders are minimized
3. **Lazy Loading**: Only active language is processed
4. **Memory Caching**: Dictionaries cached in memory

## DOM Integration (For non-React elements)

### Using data-i18n attributes (Future enhancement):

```html
<button data-i18n="submit">Submit</button>
<input data-i18n-placeholder="enter_name" placeholder="Enter name">
<img data-i18n-alt="logo_alt" alt="Logo">
```

### Using MutationObserver (Future enhancement):

The system can automatically translate dynamically inserted elements by monitoring DOM changes.

## Error Handling

The system gracefully handles:
- ❌ **Missing translation files** → Fallback to English
- ❌ **Corrupted localStorage** → Reset to default
- ❌ **Invalid language codes** → Show user-friendly message
- ❌ **Network errors** → Use cached translations
- ❌ **Rapid language switching** → Debounced to prevent freezing

## Translation Scope Rules

### DO Translate:
- ✅ UI labels and buttons
- ✅ Form placeholders and validation messages
- ✅ Navigation menus
- ✅ Static headings and descriptions
- ✅ Error and success messages

### DON'T Translate:
- ❌ User-generated content
- ❌ Dashboard data and analytics
- ❌ API responses and database content  
- ❌ Elements with `data-i18n-skip="true"`
- ❌ Log files and debug output

## File Structure

```
src/
├── locales/                    # i18next JSON files
│   ├── en/common.json         # English (fallback)
│   ├── hi/common.json         # Hindi
│   ├── ta/common.json         # Tamil
│   ├── ml/common.json         # Malayalam
│   ├── te/common.json         # Telugu
│   └── ...
├── lib/
│   ├── i18n.js               # i18next configuration
│   └── translations.ts       # Custom translations
├── providers/
│   └── language-provider.tsx # Custom context provider
├── hooks/
│   └── use-language.ts       # Custom hook
└── components/
    └── ModernLanguageSelector.jsx # Language switcher
```

## Troubleshooting

### Language doesn't change
1. Check browser console for errors
2. Verify translation files exist and are valid JSON
3. Clear localStorage and refresh page
4. Enable debug mode to see detailed logs

### Translations show as keys
1. Check if the key exists in translation files
2. Verify proper nested structure
3. Check for typos in key names
4. Enable debug mode to see fallback attempts

### Performance issues
1. Disable debug mode in production
2. Check for infinite re-renders with React DevTools
3. Verify debouncing is working (300ms delay)

## Contributing

When adding new features:
1. Always add English translations first
2. Use descriptive, nested key names
3. Test with at least 2 languages
4. Verify fallback behavior works
5. Update this README if adding new concepts

## Testing Checklist

- [ ] Language changes instantly without errors
- [ ] Language persists after page reload  
- [ ] Missing keys show English fallback
- [ ] Rapid switching doesn't freeze UI
- [ ] Cross-tab sync works
- [ ] Settings page i18next integration works
- [ ] Custom provider integration works
- [ ] Error boundaries don't break on language errors
