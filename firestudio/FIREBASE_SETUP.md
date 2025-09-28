# Disease Diagnosis App - Firebase Setup Guide

## 🔥 Firebase Configuration

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name (e.g., "agri-disease-diagnosis")
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Required Services

#### Firestore Database
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a region close to your users
5. Click "Done"

#### Storage
1. Go to "Storage" in Firebase Console
2. Click "Get started"
3. Choose "Start in test mode"
4. Select the same region as Firestore
5. Click "Done"

#### Hosting (Optional - for deployment)
1. Go to "Hosting" in Firebase Console
2. Click "Get started"
3. Follow the setup instructions

### Step 3: Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (</>) to add web app
4. Enter app nickname: "Disease Diagnosis Web App"
5. Click "Register app"
6. Copy the configuration object

### Step 4: Environment Variables
Create a `.env.local` file in your project root:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Google AI API Key (for Genkit flows)
GOOGLE_GENAI_API_KEY=your_google_ai_api_key
```

### Step 5: Security Rules (Production)

#### Firestore Rules (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to disease diagnosis uploads
    match /disease_diagnosis_uploads/{document} {
      allow read, write: if request.time < timestamp.date(2026, 1, 1);
    }
  }
}
```

#### Storage Rules (`storage.rules`):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow uploads to disease_diagnosis folder
    match /disease_diagnosis/{allPaths=**} {
      allow read, write: if request.resource.size < 10 * 1024 * 1024; // 10MB limit
    }
  }
}
```

## 🚀 Deployment Instructions

### Method 1: Automatic Deployment
Run the deployment script:
```bash
# On Windows
./deploy.bat

# On Mac/Linux
chmod +x deploy.sh
./deploy.sh
```

### Method 2: Manual Deployment
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Build the app
npm run build

# Deploy
firebase deploy --only hosting,firestore,storage
```

## 📱 Camera Features

### Desktop Support
- Chrome 53+
- Firefox 36+
- Safari 11+
- Edge 79+

### Mobile Support
- iOS Safari 11+
- Chrome Android 53+
- Firefox Android 68+
- Samsung Internet 6.2+

### Permissions Required
- Camera access
- Storage access (for file uploads)

## 🧪 Testing the App

### Local Development
```bash
npm run dev
```

### Test Camera Functionality
Open the `camera-test.html` file in your browser to test camera features without running the full Next.js app.

### Firebase Emulators (Optional)
```bash
# Install emulators
firebase init emulators

# Start emulators
firebase emulators:start
```

## 📊 Monitoring

### Firebase Analytics
1. Enable Analytics in Firebase Console
2. View usage data in "Analytics" section
3. Monitor uploads in "Storage" section
4. Check database entries in "Firestore" section

### Error Monitoring
Check browser console for any JavaScript errors or Firebase connection issues.

## 🔧 Troubleshooting

### Camera Not Working
- Check HTTPS (required for camera access)
- Verify browser permissions
- Test on different devices/browsers

### Firebase Upload Errors
- Verify environment variables
- Check Firebase quotas
- Review Storage rules

### Build Errors
- Run `npm install` to ensure dependencies
- Check TypeScript errors
- Verify environment file exists

## 🎯 Next Steps

1. **Security**: Implement proper authentication
2. **Analytics**: Add Google Analytics tracking
3. **Performance**: Optimize image compression
4. **Features**: Add disease history tracking
5. **AI**: Integrate more advanced disease detection models

## 📞 Support

For issues or questions:
1. Check Firebase Console for error messages
2. Review browser developer tools
3. Test with the standalone camera-test.html file
4. Verify all environment variables are set correctly
