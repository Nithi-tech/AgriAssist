# Farmer Community Chat Feature

A real-time chat system for farmers to communicate, share experiences, and support each other. Features text messaging, voice messages, and a WhatsApp-like interface.

## ✨ Features

### 🔄 Real-time Chat
- Instant message delivery across all connected farmers
- Online/offline status indicators
- Typing indicators
- Message read receipts (sent, delivered, read)

### 🎤 Voice Messaging
- Record and send voice messages up to 2 minutes
- High-quality audio recording with noise suppression
- Voice message playback with progress indicators
- Isolated from AI Assistant voice features

### 👥 Farmer Identity
- Farmers identified by unique Farmer IDs (F001, F002, etc.)
- No personal names displayed for privacy
- Avatar system with initials
- Online status tracking

### 📱 WhatsApp-like UI
- Message bubbles with sender differentiation
- Timestamp display
- Voice message waveform visualization
- Responsive design for mobile and desktop

### 🔒 Privacy & Security
- Row Level Security (RLS) policies
- Secure voice message storage
- Farmer ID-based authentication
- No personal information exposure

## 🏗️ Architecture

### Frontend Components

1. **FarmerCommunityPage** (`src/app/(app)/farmer-community/page.tsx`)
   - Main chat interface
   - Message handling and state management
   - Real-time connection management

2. **VoiceMessageRecorder** (`src/components/voice-message-recorder.tsx`)
   - Voice recording functionality
   - Audio preview and playback
   - Upload handling

3. **VoiceMessagePlayer** (same file)
   - Voice message playback
   - Progress tracking
   - Audio controls

### Backend Services

1. **FarmerCommunityService** (`src/lib/farmer-community-service.ts`)
   - Supabase real-time integration
   - Message CRUD operations
   - Voice file upload/storage
   - Online presence management

2. **Database Schema** (`FARMER_COMMUNITY_CHAT_SCHEMA.sql`)
   - Message storage
   - Farmer profiles
   - Online status tracking
   - Voice message metadata

## 🚀 Setup Instructions

### 1. Database Setup
```sql
-- Run the schema in Supabase SQL editor
\i FARMER_COMMUNITY_CHAT_SCHEMA.sql

-- Enable real-time
alter publication supabase_realtime add table farmer_community_messages;
alter publication supabase_realtime add table farmer_profiles;
```

### 2. Storage Setup
```sql
-- Create storage bucket for voice messages
INSERT INTO storage.buckets (id, name, public) 
VALUES ('farmer-voice-messages', 'farmer-voice-messages', true);
```

### 3. Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Navigation Update
The feature is already integrated into the main navigation under "Farmer Community".

## 🎯 Usage

### Sending Text Messages
1. Navigate to Farmer Community page
2. Type message in input field
3. Press Enter or click Send button
4. Message appears with delivery status

### Sending Voice Messages
1. Click and hold the microphone button
2. Speak your message (max 2 minutes)
3. Release to stop recording
4. Preview and edit if needed
5. Click send to share

### Voice Playback
1. Click play button on voice messages
2. See playback progress
3. Click pause to stop

## 🔧 Technical Details

### Real-time Communication
- Uses Supabase real-time subscriptions
- WebSocket connections for instant delivery
- Automatic reconnection handling

### Voice Technology
- MediaRecorder API for recording
- WebM/Opus codec for compression
- Supabase Storage for file hosting
- Automatic cleanup and optimization

### Performance Optimizations
- Message pagination
- Audio file compression
- Efficient real-time subscriptions
- Memory management for voice playback

### Security Features
- Row Level Security (RLS)
- Authenticated uploads only
- CORS protection
- Input validation and sanitization

## 📱 Mobile Compatibility

- Responsive design for all screen sizes
- Touch-friendly voice recording
- Mobile microphone permissions
- Optimized for mobile networks

## 🔍 Monitoring & Analytics

### Key Metrics
- Active farmers online
- Message volume per day
- Voice message usage
- Average session duration

### Health Checks
- Real-time connection status
- Voice recording success rate
- Message delivery confirmation
- Storage usage monitoring

## 🐛 Troubleshooting

### Common Issues

1. **Microphone Not Working**
   - Check browser permissions
   - Ensure HTTPS (required for microphone)
   - Test with different browsers

2. **Messages Not Appearing**
   - Check internet connection
   - Verify real-time subscription status
   - Refresh the page

3. **Voice Messages Not Playing**
   - Check audio codec support
   - Verify file accessibility
   - Clear browser cache

### Debug Tools
- Browser developer console
- Supabase dashboard logs
- Network activity monitoring
- Audio API error handling

## 🔄 Future Enhancements

### Planned Features
- Message reactions (like, love, etc.)
- Reply to specific messages
- Message search functionality
- Farmer groups/communities
- Image/file sharing
- Push notifications
- Offline message sync

### Technical Improvements
- Voice message transcription
- Multi-language support
- Message encryption
- Advanced moderation tools
- Analytics dashboard

## 🤝 Contributing

When contributing to the Farmer Community feature:

1. Test real-time functionality across multiple browsers
2. Verify voice recording on different devices
3. Ensure mobile compatibility
4. Test with various network conditions
5. Validate security policies
6. Check performance with large message volumes

## 📄 License

Part of the AgriAssist farming assistant application.
