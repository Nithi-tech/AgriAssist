# Multi-Language Voice System Documentation

## Overview

This implementation provides comprehensive multi-language voice support for the AgriAssist farming chatbot with Speech-to-Text (STT) and Text-to-Speech (TTS) capabilities across 10+ Indian languages.

## Features

### ✅ Core Features Implemented
- **Multi-Language Support**: 10 Indian languages (Hindi, Tamil, Telugu, Malayalam, Kannada, Gujarati, Bengali, Marathi, Urdu, English)
- **Speech-to-Text (STT)**: Browser API with multiple provider fallback support
- **Text-to-Speech (TTS)**: Browser API with Google Cloud and Azure integration ready
- **Language Selection UI**: Intuitive dropdown with native language names and voice previews
- **Dynamic Language Switching**: Real-time language changes without page refresh
- **Translation Integration**: Auto-translation with Google Translate and Azure Translator APIs
- **Voice Controls**: Advanced voice input/output controls with settings
- **Low Latency**: Optimized for real-time conversation
- **Fallback System**: Multiple API provider fallbacks for reliability

### 🎯 Language Support Matrix

| Language | Code | STT | TTS | Translation | Voice Preview |
|----------|------|-----|-----|-------------|---------------|
| English | en | ✅ | ✅ | ✅ | ✅ |
| Hindi | hi | ✅ | ✅ | ✅ | ✅ |
| Tamil | ta | ✅ | ✅ | ✅ | ✅ |
| Telugu | te | ✅ | ✅ | ✅ | ✅ |
| Malayalam | ml | ✅ | ✅ | ✅ | ✅ |
| Kannada | kn | ✅ | ✅ | ✅ | ✅ |
| Gujarati | gu | ✅ | ✅ | ✅ | ✅ |
| Bengali | bn | ✅ | ✅ | ✅ | ✅ |
| Marathi | mr | ✅ | ✅ | ✅ | ✅ |
| Urdu | ur | ✅ | ✅ | ✅ | ✅ |

## Architecture

### Components Structure
```
src/
├── lib/
│   ├── multi-language-voice.ts      # Core voice service
│   ├── speech-types.ts              # TypeScript declarations
│   └── translations.ts              # Enhanced translations
├── components/
│   ├── language-selector.tsx        # Language selection dropdown
│   ├── voice-controls.tsx           # Advanced voice controls
│   └── voice-demo.tsx               # Demo/test component
└── app/
    ├── (app)/chat/page.tsx          # Enhanced chat interface
    └── api/chat/route.ts            # Enhanced API with language support
```

### Key Classes

#### `MultiLanguageVoiceService`
- Handles STT and TTS with multiple provider support
- Language-specific voice selection
- Fallback mechanisms for reliability
- Provider switching (Browser, Google Cloud, Azure, OpenAI)

#### `TranslationService`
- Google Translate API integration
- Azure Translator API integration
- Automatic language detection
- Fallback translation handling

## API Integration

### Environment Variables Required
```bash
# Optional: For enhanced TTS quality
NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY=your_key
NEXT_PUBLIC_AZURE_SPEECH_KEY=your_key
NEXT_PUBLIC_AZURE_REGION=eastus

# Optional: For translation services
NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY=your_key
NEXT_PUBLIC_AZURE_TRANSLATOR_KEY=your_key
NEXT_PUBLIC_AZURE_TRANSLATOR_REGION=global
```

### Supported API Providers

#### Speech-to-Text (STT)
1. **Browser API** (Primary) - Built-in, no key required
2. **Google Cloud Speech-to-Text** (Premium) - Requires API key
3. **Azure Speech Services** (Premium) - Requires API key
4. **OpenAI Whisper** (Premium) - Requires API key

#### Text-to-Speech (TTS)
1. **Browser API** (Primary) - Built-in, no key required
2. **Google Cloud Text-to-Speech** (Premium) - Higher quality voices
3. **Azure Speech Services** (Premium) - Neural voices
4. **ElevenLabs** (Premium) - Ultra-realistic voices

#### Translation
1. **Google Translate API** - Comprehensive language support
2. **Azure Translator** - Enterprise-grade translation

## Usage Examples

### Basic Voice Implementation
```tsx
import { VoiceControls, useSpeech } from '@/components/voice-controls';
import { SpeechResult } from '@/lib/multi-language-voice';

function MyComponent() {
  const { speak } = useSpeech();

  const handleSpeechResult = (result: SpeechResult) => {
    console.log('Recognized:', result.transcript);
    console.log('Confidence:', result.confidence);
    console.log('Language:', result.language);
  };

  return (
    <VoiceControls
      onSpeechResult={handleSpeechResult}
      showAdvancedControls={true}
    />
  );
}
```

### Language Selection
```tsx
import { LanguageSelector } from '@/components/language-selector';

function MyComponent() {
  const handleLanguageChange = (language: string) => {
    console.log('Language changed to:', language);
  };

  return (
    <LanguageSelector
      onLanguageChange={handleLanguageChange}
      compact={true}
      showVoicePreview={true}
    />
  );
}
```

### Advanced Voice Service
```tsx
import { MultiLanguageVoiceService, VoiceConfig } from '@/lib/multi-language-voice';

const config: VoiceConfig = {
  sttProvider: 'browser',
  ttsProvider: 'google-cloud',
  language: 'hi',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0
};

const voiceService = new MultiLanguageVoiceService(config);

// Speech recognition
const result = await voiceService.startListening();
console.log('User said:', result.transcript);

// Text-to-speech
await voiceService.speak({
  text: 'नमस्ते! कैसे मदद कर सकता हूं?',
  language: 'hi',
  rate: 0.9
});
```

## Chat Interface Features

### Enhanced Chat Page (`/chat`)
- **Language Selector**: Easy language switching
- **Voice Input**: Click-to-speak with visual feedback
- **Voice Output**: Auto-speak responses (optional)
- **Translation**: Auto-translate messages between languages
- **Settings Panel**: 
  - Auto-translate toggle
  - Auto-speak toggle
  - Show original text toggle
  - Voice enabled/disabled
- **Message Features**:
  - Language detection badges
  - Translation indicators
  - Speak message buttons
  - Original text display

### Chat Settings
```tsx
interface ChatSettings {
  autoTranslate: boolean;     // Auto-translate responses
  autoSpeak: boolean;         // Auto-speak AI responses
  showOriginalText: boolean;  // Show original before translation
  voiceEnabled: boolean;      // Enable/disable voice features
}
```

## Voice Quality Optimization

### TTS Voice Selection Algorithm
1. **Exact Voice Match**: If specific voice name provided
2. **Language Match**: Find exact language code match (e.g., 'hi-IN')
3. **Language Family**: Find language family match (e.g., 'hi' for Hindi)
4. **Quality Preference**: Neural > Wavenet > Standard > Basic
5. **Fallback**: Default system voice

### Voice Quality Tiers
- **Premium**: Neural voices (Azure), Wavenet (Google Cloud)
- **Standard**: Standard API voices
- **Basic**: Browser built-in voices

### Performance Optimizations
- **Voice Caching**: Cache available voices on load
- **Lazy Loading**: Load language configs on demand
- **Error Handling**: Graceful degradation with fallbacks
- **Timeout Management**: Prevent hanging operations

## Testing

### Voice Demo Component
Use the `VoiceDemo` component to test all language capabilities:

```tsx
import { VoiceDemo } from '@/components/voice-demo';

function TestPage() {
  return <VoiceDemo />;
}
```

Features:
- **Voice Support Check**: Test TTS availability for each language
- **Demo Texts**: Pre-written farming assistant greetings
- **Quick Tests**: One-click voice testing per language
- **Results Display**: Success/failure status with error details

### Manual Testing Checklist
- [ ] Language selection changes interface language
- [ ] Voice input recognizes speech in selected language
- [ ] Voice output speaks in correct language and accent
- [ ] Translation works between different languages
- [ ] Fallback providers work when primary fails
- [ ] Error handling displays helpful messages
- [ ] Performance is acceptable (< 2s response time)

## Browser Compatibility

### Speech Recognition Support
- ✅ Chrome/Chromium (Excellent)
- ✅ Edge (Excellent)
- ⚠️ Firefox (Limited - requires flag)
- ❌ Safari (Not supported)

### Speech Synthesis Support
- ✅ Chrome/Chromium (Excellent)
- ✅ Firefox (Good)
- ✅ Safari (Good)
- ✅ Edge (Excellent)

### Recommended Browser
**Chrome/Chromium** provides the best experience with:
- Full STT support for Indian languages
- High-quality TTS voices
- Low latency performance
- Advanced voice selection

## Troubleshooting

### Common Issues

#### "Speech recognition not supported"
- **Cause**: Browser doesn't support Web Speech API
- **Solution**: Use Chrome/Chromium or enable firefox flag
- **Fallback**: Text input only

#### "No voices available for language"
- **Cause**: Browser doesn't have voices for selected language
- **Solution**: Install language pack or use cloud TTS
- **Fallback**: English voice with translated text

#### "Translation failed"
- **Cause**: No API keys configured or rate limit exceeded
- **Solution**: Add API keys or use different provider
- **Fallback**: Original language text

#### Poor voice recognition accuracy
- **Cause**: Background noise, unclear speech, or language mismatch
- **Solution**: 
  - Ensure quiet environment
  - Speak clearly
  - Verify correct language is selected
  - Use headset microphone

### Debug Mode
Enable debug mode by setting:
```javascript
localStorage.setItem('voice-debug', 'true');
```

This will log detailed information about:
- Voice service initialization
- Recognition attempts and results
- TTS operations
- Language switching events
- Error details

## Future Enhancements

### Planned Features
- [ ] Offline voice recognition using WebAssembly
- [ ] Voice activity detection (VAD)
- [ ] Speaker identification
- [ ] Conversation memory across sessions
- [ ] Voice command shortcuts
- [ ] Custom voice training
- [ ] Real-time accent adaptation

### Additional Language Support
- [ ] Sanskrit (sa)
- [ ] Nepali (ne)
- [ ] Sindhi (sd)
- [ ] Maithili (mai)
- [ ] Bhojpuri (bho)

## Security Considerations

### Privacy
- Voice data is processed locally in browser when using Browser APIs
- Cloud APIs may transmit voice data - review provider privacy policies
- No voice data is stored permanently
- Conversations are ephemeral unless explicitly saved

### API Security
- Use environment variables for API keys
- Implement rate limiting
- Add API key rotation
- Monitor usage for cost control

### Content Safety
- Gemini AI includes safety filters
- Voice input is sanitized before processing
- Inappropriate content is blocked

## Performance Metrics

### Target Performance
- **Voice Recognition**: < 2 seconds from speech end to text
- **Text-to-Speech**: < 1 second from text to audio start
- **Language Switching**: < 500ms UI update
- **Translation**: < 3 seconds for typical message

### Monitoring
Track these metrics for optimal performance:
- Speech recognition accuracy rates
- TTS synthesis times
- Translation API response times
- Error rates by language and provider
- User engagement with voice features

## Support

### Getting Help
1. Check browser console for errors
2. Test with the Voice Demo component
3. Verify API keys are configured correctly
4. Review this documentation
5. Check component source code for implementation details

### Contributing
When adding new languages or features:
1. Update `LANGUAGE_CONFIGS` in `multi-language-voice.ts`
2. Add translations to `translations.ts`
3. Test with Voice Demo component
4. Update this documentation
5. Add appropriate TypeScript types

---

*This multi-language voice system provides a solid foundation for voice-enabled applications with comprehensive Indian language support. The modular architecture allows for easy extension and customization based on specific requirements.*
