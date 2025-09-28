# AgriAssist Settings Feature

A comprehensive farmer-friendly settings interface with profile management, preferences, and farming utilities.

## Features

- **Profile Management**: Complete farmer profile with image upload and completion tracking
- **Multi-language Support**: English, Hindi, Tamil, Telugu with i18next
- **Theme System**: Light, Dark, and System preference themes
- **Notifications**: Configurable alerts with multiple channels (SMS, WhatsApp, In-app)
- **Farming Reminders**: Irrigation, Fertilizer, and Pesticide scheduling
- **Data Management**: Backup/Restore functionality with JSON export/import
- **Offline Mode**: Service worker for offline functionality
- **Privacy Controls**: Data sharing and expert contact preferences
- **PDF Export**: Generate farm profile reports
- **Quick Actions**: Easy access to common tasks

## Architecture

### Data Flow

```
UI Components → mockApi → mockDb → localStorage
     ↑                              ↓
     ←────── Context/State ←─────────┘
```

1. **mockDb.ts**: localStorage-backed data persistence
2. **mockApi.ts**: Async API wrappers with simulated network delays
3. **SettingsContext**: React context for state management
4. **Components**: Individual feature cards with local state sync

### Storage Schema

All data is stored under the `agriassist.settings` localStorage key:

```javascript
{
  profile: FarmerProfile,
  app: AppSettings,
  notifications: NotificationPreferences,
  reminders: FarmingReminders,
  privacy: Privacy
}
```

## File Structure

```
src/features/settings/
├── types.ts                    # TypeScript interfaces
├── mockDb.ts                   # localStorage data layer
├── mockApi.ts                  # API simulation layer
├── SettingsPage.tsx            # Main page component
├── i18n/                       # Internationalization
│   ├── index.ts               # i18next configuration
│   ├── en.json                # English translations
│   ├── hi.json                # Hindi translations
│   ├── ta.json                # Tamil translations
│   └── te.json                # Telugu translations
├── components/                 # Feature components
│   ├── ProfileCard.tsx        # Profile display & edit trigger
│   ├── EditProfileModal.tsx   # Profile editing modal
│   ├── ThemeCard.tsx          # Theme selection
│   ├── LanguageCard.tsx       # Language selection
│   ├── PrivacyCard.tsx        # Privacy preferences
│   ├── DataCard.tsx           # Backup/restore & offline mode
│   ├── NotificationsCard.tsx  # Notification preferences
│   ├── FarmingRemindersCard.tsx # Farming schedules
│   ├── QuickActions.tsx       # Quick action buttons
│   └── ProgressBar.tsx        # Profile completion indicator
└── pdf/
    └── exportFarmReport.ts     # PDF generation
```

## Development Notes

### Mock Implementation

All functionality uses mock data with localStorage persistence. To replace with real backend:

1. Replace `mockApi.ts` functions with actual HTTP calls
2. Update error handling for real network conditions
3. Replace localStorage with secure server storage
4. Implement real authentication and user context

### Component Design

- **Color-coded Cards**: Green (Profile), Blue (Data), Red (Privacy), Yellow (Notifications), Purple (Theme), Indigo (Actions)
- **Responsive Grid**: Adapts from mobile to desktop layouts
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Loading States**: All async operations show loading indicators
- **Error Handling**: User-friendly error messages with retry options

## Usage

### Basic Setup

```tsx
import SettingsPage from '@/features/settings/SettingsPage';

// Use as a route component
<Route path="/settings" component={SettingsPage} />
```

### Manual Data Management

```javascript
// Reset all settings
localStorage.removeItem('agriassist.settings');

// Export current settings
const data = localStorage.getItem('agriassist.settings');
console.log(JSON.parse(data));

// Import settings
localStorage.setItem('agriassist.settings', JSON.stringify(settingsData));
```

## Testing Scenarios

### Profile Management
1. Edit profile → change name + upload picture → Save → ProfileCard updates
2. Reload page → verify data persists
3. Complete all fields → verify 100% completion

### Language & Theme
1. Switch language to Hindi → verify all labels update immediately
2. Toggle Dark Mode → verify theme applies
3. Select System theme → verify follows device preference

### Farming Features
1. Enable Irrigation reminder → click "Suggest frequency" (Loamy → 3 days)
2. Add fertilizer schedule → set future date
3. Verify reminders persist on reload

### Data Management
1. Export Backup JSON → verify file downloads
2. Clear localStorage → Import JSON → verify full state restored
3. Toggle Offline Mode → verify service worker registration

### Notifications
1. Add WhatsApp channel + family number → verify validation
2. Toggle various notification types → verify persistence
3. Remove family contact → verify updates immediately

## Dependencies

- React 18+
- TypeScript
- Tailwind CSS
- Lucide React (icons)
- i18next + react-i18next
- jsPDF (for PDF export)
- Radix UI components (via shadcn/ui)

## Performance Considerations

- **Debounced Updates**: Form changes are debounced to reduce localStorage writes
- **Lazy Loading**: Components load data only when needed
- **Memoization**: Expensive calculations are memoized
- **Bundle Splitting**: Feature can be code-split at route level

## Security Notes

- **Base64 Images**: Profile pictures stored as base64 (consider file size limits)
- **Input Validation**: All form inputs validated client-side and should be validated server-side
- **localStorage**: Consider encryption for sensitive data in production
- **CSP**: Ensure Content Security Policy allows inline styles for Tailwind

## Future Enhancements

1. **Real-time Sync**: WebSocket connections for live updates
2. **Push Notifications**: Real notification delivery via service worker
3. **Advanced Scheduling**: Recurring reminders with timezone support
4. **Data Analytics**: Usage tracking and insights
5. **Integration APIs**: Weather services, market prices, government schemes
6. **Mobile App**: React Native version with native features

## Troubleshooting

### Common Issues

**Settings not loading**: Clear browser cache and localStorage
```javascript
localStorage.clear();
location.reload();
```

**Language not switching**: Check i18next initialization
```javascript
import './i18n';  // Ensure this import is present
```

**PDF export failing**: Verify jsPDF dependency installation
```bash
npm install jspdf
```

**Service worker issues**: Unregister and re-register
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

---

**Note**: This is a complete mock implementation for demonstration. Replace mock data persistence with secure backend APIs for production use.
