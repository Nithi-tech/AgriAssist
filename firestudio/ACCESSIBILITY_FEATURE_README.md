# Accessibility Feature for Visually Impaired Users

## Overview

This accessibility feature provides gesture-based navigation for visually impaired users in the farmer web application. It includes touch gesture detection, audio feedback, and a dedicated navigation mode that overlays the existing interface without interfering with standard functionality.

## 🌟 Features

- **Double-tap activation**: Double-tap anywhere on the dashboard to activate visually impaired mode
- **Gesture-based navigation**: Navigate through app features using intuitive touch gestures
- **Audio feedback**: Spoken instructions and confirmations for all actions
- **Non-intrusive design**: Completely separate from existing app logic
- **Configurable settings**: Enable/disable features through the settings page

## 📱 Gesture Mapping

| Gesture | Feature | Description |
|---------|---------|-------------|
| Single Tap | Crop Recommendation | Get personalized crop suggestions |
| Double Tap | Disease Diagnosis | Diagnose plant diseases with AI |
| Triple Tap | Weather Forecast | View weather conditions and forecasts |
| Four Taps | Government Schemes | Browse welfare schemes and subsidies |
| Swipe Down | Market Prices | Check current market prices |
| Swipe Up | Farmer Community | Connect with other farmers |
| Swipe Left | Chat Support | Access chat and support |
| Swipe Right | Settings | Open app settings |
| Five Taps | My Crops | Manage your crop portfolio |
| Six Taps | About | Learn about the application |
| **Three-Finger Drag Down** | **AI Assistant** | Access the AI farming assistant |

## 🏗️ Architecture

### Component Structure

```
src/
├── hooks/
│   └── useGestureDetection.ts          # Custom hook for gesture detection
├── components/
│   ├── DoubleTapDetector.tsx           # Dashboard activation component
│   ├── VisuallyImpairedMode.tsx        # Main accessibility overlay
│   └── AccessibilitySettings.tsx       # Settings configuration
└── app/(app)/dashboard/page.tsx        # Updated dashboard with accessibility
```

### Key Components

#### 1. `useGestureDetection.ts`
- **Purpose**: Custom React hook for detecting touch gestures
- **Features**: 
  - Multi-tap detection (1-6 taps)
  - Swipe direction detection
  - Three-finger gesture recognition
  - Configurable thresholds and delays
- **Non-intrusive**: Only activates when accessibility mode is enabled

#### 2. `DoubleTapDetector.tsx`
- **Purpose**: Wraps dashboard content to detect activation gesture
- **Features**:
  - Double-tap detection for mode activation
  - Prevents zoom on double-tap
  - Transparent overlay that doesn't affect UI

#### 3. `VisuallyImpairedMode.tsx`
- **Purpose**: Main accessibility interface overlay
- **Features**:
  - Full-screen gesture area
  - Audio instructions and feedback
  - Visual confirmation of actions
  - Feature previews before navigation
  - Close button for easy exit

#### 4. `AccessibilitySettings.tsx`
- **Purpose**: Configuration panel in settings
- **Features**:
  - Toggle gesture navigation on/off
  - Audio feedback controls
  - Spoken instructions
  - Visual gesture reference guide

## 🚀 Installation & Setup

### 1. Dependencies
The feature uses only built-in browser APIs and existing project dependencies:
- React hooks for state management
- Next.js router for navigation
- Tailwind CSS for styling
- Browser's Web Speech API for audio feedback

### 2. Integration Steps

The accessibility feature is already integrated. To verify installation:

1. **Check Dashboard Integration**:
   ```tsx
   // src/app/(app)/dashboard/page.tsx
   import { DoubleTapDetector } from '@/components/DoubleTapDetector';
   import { VisuallyImpairedMode } from '@/components/VisuallyImpairedMode';
   ```

2. **Check Settings Integration**:
   ```tsx
   // src/features/settings/SettingsPage.tsx
   import { AccessibilitySettings } from '@/components/AccessibilitySettings';
   ```

3. **Verify Hook Implementation**:
   ```tsx
   // src/hooks/useGestureDetection.ts
   export const useGestureDetection = (handlers: GestureHandlers) => {
     // Gesture detection logic
   };
   ```

## 🎯 Usage Instructions

### For End Users

1. **Enable the Feature**:
   - Go to Settings page
   - Find "Accessibility Settings" section
   - Toggle "Touch Gesture Navigation" ON
   - Optionally enable "Audio Feedback"

2. **Activate on Dashboard**:
   - Navigate to the Dashboard page
   - Double-tap anywhere on the screen
   - Listen for audio confirmation

3. **Navigate with Gestures**:
   - Use the gesture mapping table above
   - Listen for audio feedback after each gesture
   - Tap the X button or close button to exit

### For Developers

1. **Adding New Features**:
   ```tsx
   // Add to features array in VisuallyImpairedMode.tsx
   const features: Feature[] = [
     // ... existing features
     {
       id: 'new-feature',
       name: 'New Feature',
       route: '/new-feature',
       icon: NewIcon,
       description: 'Description of the new feature'
     }
   ];
   ```

2. **Adding New Gestures**:
   ```tsx
   // Add to useGestureDetection hook
   interface GestureHandlers {
     // ... existing handlers
     onNewGesture?: () => void;
   }
   
   // Use in VisuallyImpairedMode component
   useGestureDetection({
     // ... existing handlers
     onNewGesture: () => navigateToFeature(featureIndex),
   });
   ```

3. **Customizing Audio Feedback**:
   ```tsx
   const speak = (text: string) => {
     if ('speechSynthesis' in window) {
       const utterance = new SpeechSynthesisUtterance(text);
       utterance.rate = 0.8; // Adjust speed
       utterance.volume = 0.8; // Adjust volume
       speechSynthesis.speak(utterance);
     }
   };
   ```

## 🔧 Configuration Options

### Gesture Sensitivity
```typescript
// In useGestureDetection.ts
const DOUBLE_TAP_DELAY = 300; // ms between taps
const TAP_THRESHOLD = 10; // pixels for tap vs swipe
const SWIPE_THRESHOLD = 50; // pixels for swipe detection
```

### Audio Settings
```typescript
// In VisuallyImpairedMode.tsx
const speak = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.8; // Speech speed (0.1 - 10)
  utterance.volume = 0.8; // Volume (0 - 1)
  utterance.pitch = 1; // Pitch (0 - 2)
  speechSynthesis.speak(utterance);
};
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Dashboard double-tap activates accessibility mode
- [ ] All gesture mappings work correctly
- [ ] Audio feedback plays for each action
- [ ] Settings toggles work properly
- [ ] Mode can be closed successfully
- [ ] No interference with normal app functionality
- [ ] Responsive design works on different screen sizes

### Gesture Testing
1. Test each gesture type in isolation
2. Verify gesture recognition accuracy
3. Check audio feedback timing
4. Test three-finger gesture specifically
5. Verify swipe direction detection

### Browser Compatibility
- ✅ Chrome (recommended)
- ✅ Safari (iOS/macOS)
- ✅ Firefox
- ✅ Edge
- ⚠️ Internet Explorer (limited audio support)

## 🛠️ Troubleshooting

### Common Issues

1. **Gestures Not Detected**:
   - Ensure accessibility mode is enabled in settings
   - Check if double-tap activated the mode properly
   - Verify touch events are not blocked by other elements

2. **Audio Not Playing**:
   - Check browser audio permissions
   - Verify audio feedback is enabled in settings
   - Some browsers require user interaction before playing audio

3. **Three-Finger Gesture Not Working**:
   - Ensure you're using exactly three fingers
   - Try a slower drag motion
   - Check if the device supports multi-touch

### Debug Mode
```typescript
// Add to useGestureDetection.ts for debugging
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Gesture detected:', gestureType, {
    touchCount: activeTouches.current?.length,
    deltaX,
    deltaY,
    distance
  });
}
```

## 🚀 Future Enhancements

### Planned Features
- [ ] Voice commands integration
- [ ] Haptic feedback for supported devices
- [ ] Customizable gesture mappings
- [ ] Keyboard navigation fallback
- [ ] Screen reader optimization
- [ ] Multi-language audio support

### Advanced Gestures
- [ ] Circular gestures for navigation
- [ ] Pinch-to-zoom for content
- [ ] Long-press actions
- [ ] Custom gesture recording

## 📄 License & Contributing

This accessibility feature is part of the farmer web application and follows the same licensing terms. Contributions are welcome, especially:

- Testing on different devices and browsers
- Improving gesture recognition accuracy
- Adding support for additional languages
- Enhancing audio feedback quality
- Accessibility compliance improvements

## 📞 Support

For questions or issues related to the accessibility feature:

1. Check this documentation first
2. Review the component source code
3. Test with browser developer tools
4. Report issues with device/browser details

---

*This accessibility feature demonstrates a commitment to inclusive design and ensures that farming technology is accessible to all users, regardless of visual ability.*
