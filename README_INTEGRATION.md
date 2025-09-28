# Smart Farming Dashboard - Integration Guide

## 🚨 Security Warning
**Replace the testing secrets before production:**
- `ESP32_SHARED_SECRET` (currently: `sljFmt8YWrExo6AiEiFQJD8lDuNnH5aX1M7t8AyF`)
- Firebase project configuration (currently using test project: `sensor-data-f9ac2`)
- Rotate secrets every 30-90 days in production

## 📋 Prerequisites
- Node.js 18+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- Next.js 14 project with Tailwind CSS
- ESP32 development environment (Arduino IDE or PlatformIO)

## 🚀 Step-by-Step Setup

### 1. Environment Configuration

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Update `.env.local` with your Firebase project values:
   ```bash
   # Replace with your actual Firebase project configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ESP32_SHARED_SECRET=your-strong-secret-here
   ```

### 2. Firebase Project Setup

1. Login to Firebase CLI:
   ```bash
   firebase login
   ```

2. Initialize Firebase in your project root:
   ```bash
   firebase init
   ```
   - Select "Firestore", "Functions", and "Hosting" (if needed)
   - Choose TypeScript for Functions
   - Use existing project or create new one

3. Set up Firestore Security Rules:
   ```javascript
   // firestore.rules
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Development: Allow public read access
       // Production: Require authentication for reads
       match /sensorReadings/{document} {
         allow read: if true;  // Change to: request.auth != null; for production
         allow write: if false; // Only Cloud Functions can write
       }
     }
   }
   ```

4. Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

5. Create Firestore index (if needed):
   ```bash
   # Create composite index for serverTimestamp DESC queries
   firebase firestore:indexes
   ```
   Add this index configuration to `firestore.indexes.json`:
   ```json
   {
     "indexes": [
       {
         "collectionGroup": "sensorReadings",
         "queryScope": "COLLECTION",
         "fields": [
           {
             "fieldPath": "serverTimestamp",
             "order": "DESCENDING"
           }
         ]
       }
     ]
   }
   ```

### 3. Firebase Functions Setup

1. Navigate to functions directory:
   ```bash
   cd functions
   npm install
   ```

2. Set the ESP32 shared secret:
   ```bash
   firebase functions:config:set esp32.shared_secret="sljFmt8YWrExo6AiEiFQJD8lDuNnH5aX1M7t8AyF"
   ```

3. Build and deploy functions:
   ```bash
   npm run build
   firebase deploy --only functions
   ```

4. Note your Cloud Function URL (will be displayed after deployment):
   ```
   https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api
   ```

### 4. Next.js Dashboard Setup

1. Install dependencies in project root:
   ```bash
   npm install firebase
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Access dashboard at:
   ```
   http://localhost:3000/dashboard
   ```

### 5. ESP32 Configuration

1. Update the ESP32 code (`esp32/esp32_post_example.ino`):
   ```cpp
   // Update these values:
   const char* serverURL = "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api/ingest";
   const char* sharedSecret = "your-shared-secret-here";
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```

2. Install required Arduino libraries:
   - ArduinoJson
   - WiFi (built-in)
   - HTTPClient (built-in)

3. Upload to ESP32 and monitor serial output

## 🧪 Testing the Complete Pipeline

### Manual cURL Test

Test the Cloud Function directly with proper HMAC signature:

```bash
# 1. Create test payload
PAYLOAD='{"deviceId":"TEST_DEVICE","ph":6.8,"moisture":45.3,"npk":{"n":25,"p":15,"k":20}}'

# 2. Generate HMAC-SHA256 signature (requires openssl)
SECRET="sljFmt8YWrExo6AiEiFQJD8lDuNnH5aX1M7t8AyF"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" -hex | cut -d' ' -f2)

# 3. Post to Cloud Function
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-esp32-signature: $SIGNATURE" \
  -d "$PAYLOAD" \
  "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api/ingest"

# Expected response:
# {"ok":true,"id":"document-id-here","timestamp":"2025-08-20T..."}
```

### Verification Checklist

- [ ] ESP32 connects to WiFi successfully
- [ ] ESP32 posts data with valid HMAC signature
- [ ] Cloud Function receives and validates requests
- [ ] Data appears in Firestore `sensorReadings` collection
- [ ] Dashboard displays real-time updates
- [ ] Alerts trigger when thresholds are exceeded
- [ ] All environment variables are configured correctly

## 🔧 Deployment to Production

### Vercel Deployment (Next.js)

1. Push code to Git repository

2. Connect to Vercel and add environment variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

3. Deploy via Vercel dashboard or CLI

### Firebase Functions Production

1. Update Firestore security rules for production:
   ```javascript
   allow read: if request.auth != null; // Require authentication
   ```

2. Rotate secrets:
   ```bash
   firebase functions:config:set esp32.shared_secret="new-production-secret"
   firebase deploy --only functions
   ```

## 🚨 Common Issues & Solutions

### Issue: "Missing signature header" (401)
**Fix:** Ensure ESP32 sends `x-esp32-signature` header with HMAC-SHA256

### Issue: "Invalid signature" (401)
**Fix:** Verify shared secret matches between ESP32 and Functions config

### Issue: Dashboard shows "Loading..." forever
**Fix:** Check browser console for Firebase config errors and network issues

### Issue: "CORS error" in browser
**Fix:** Ensure `cors({ origin: true })` is configured in Cloud Function

### Issue: Functions deployment fails
**Fix:** Run `npm install` in functions directory and check Node.js version (18+)

### Issue: ESP32 HTTP error -1
**Fix:** Check WiFi connection, verify Cloud Function URL, and ensure valid JSON payload

## 📊 Data Structure Example

### Firestore Document Structure:
```json
{
  "deviceId": "ESP32_001",
  "ph": 6.8,
  "moisture": 45.3,
  "npk": {
    "n": 25,
    "p": 15,
    "k": 20
  },
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "serverTimestamp": "2025-08-20T10:30:00.123Z"
}
```

## 🔒 Production Security Recommendations

1. **Rotate Secrets**: Change `ESP32_SHARED_SECRET` every 30-90 days
2. **Per-Device Tokens**: Consider unique secrets per device for better security
3. **Rate Limiting**: Implement rate limiting in Cloud Functions
4. **Authentication**: Require user authentication for dashboard access
5. **HTTPS Only**: Ensure all communications use HTTPS
6. **Input Validation**: Validate all sensor data ranges and types
7. **Monitoring**: Set up Firebase monitoring and alerting
8. **Backup**: Implement regular Firestore backups

## 📈 Performance Optimizations

1. **Firestore Queries**: Use composite indexes for complex queries
2. **Caching**: Implement client-side caching for dashboard data
3. **Batch Writes**: Consider batching multiple sensor readings
4. **Connection Pooling**: Reuse HTTP connections in ESP32 code
5. **Offline Support**: Store readings locally when offline

## 🆚 Firestore vs Realtime Database

**Firestore (Recommended)**:
- Better querying capabilities
- Automatic scaling
- Better security rules
- Suitable for complex applications

**Realtime Database**:
- Lower latency for simple operations
- Simpler pricing model
- Better for simple real-time features
- Use if you need minimal setup

## 📞 Support

For issues:
1. Check Firebase Console for errors
2. Monitor Cloud Function logs: `firebase functions:log`
3. Verify ESP32 serial monitor output
4. Check browser developer console for client errors
