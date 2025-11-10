# 🌱 AgriAssist - Smart Farming Assistant# 🌱 AgriAssist - Smart Farming Disease Diagnosis



A comprehensive AI-powered agricultural platform built with Next.js 15, featuring crop analysis, disease diagnosis, market prices, weather monitoring, and mobile app capabilities.A modern Next.js application with AI-powered plant disease diagnosis, featuring camera capture and Firebase integration.



## 📱 Platform Support

- **Web App**: Progressive Web App (PWA) with offline capabilities

## ✨ Features

### 🔍 Disease Diagnosis

- **Camera Capture**: Take photos directly from device camera (mobile & desktop)

- **File Upload**: Upload existing plant images

- **AI Analysis**: Powered by Google's Genkit AI flows

- **Firebase Storage**: Automatic image upload and metadata storage

- **Multi-language Support**: English, Hindi, Tamil, Telugu

## ✨ Core Features

### 🔍 AI-Powered Analysis

- **Crop Recommendation**: Get personalized crop suggestions based on soil and climate

- **Disease Diagnosis**: Upload plant images for AI-powered disease identification

- **Fertilizer Recommendations**: Optimize fertilizer usage based on crop and soil data

- **Weather Chat**: Interactive weather forecasting and advice

- Touch-friendly interface

### 📊 Real-Time Data

- **Market Prices**: Live agricultural commodity prices across India### 🚀 Modern Tech Stack

- **Weather Monitoring**: Current conditions and forecasts- **Next.js 14** with TypeScript

- **IoT Sensors**: ESP32 integration for soil moisture, temperature, and humidity- **Firebase** (Storage + Firestore)

- **Government Schemes**: Access to welfare programs and subsidies- **Tailwind CSS** for styling

- **Radix UI** components

### 👥 Community Features- **Google Genkit** for AI flows

- **Farmer Community**: Discussion forums and knowledge sharing

- **Multilingual Support**: English, Hindi, Tamil, Telugu, and more## 🛠️ Installation

- **Voice Interface**: Voice commands and text-to-speech

### Prerequisites

### 📱 Mobile Experience- Node.js 18+ 

- **PWA Installable**: Add to home screen on any device- npm or yarn

- **Offline Mode**: Core features work without internet- Firebase account

- **Camera Access**: Capture plant images directly- Google AI API key

- **Touch-Optimized**: Mobile-first responsive design

### Quick Start

## 🚀 Quick Start```bash

# Clone the repository

### Prerequisitesgit clone <repository-url>

- Node.js 18+cd firestudio

- npm or pnpm

- Firebase account# Install dependencies

- Google Gemini API keynpm install



### Installation# Set up environment variables

cp .env.local.example .env.local

```bash# Edit .env.local with your Firebase and Google AI credentials

# Clone repository

git clone <your-repo-url># Start development server

cd firestudionpm run dev

```

# Install dependencies

npm install### Environment Setup

Create `.env.local` file:

# Set up environment variables```bash

cp .env.local.example .env.localNEXT_PUBLIC_FIREBASE_API_KEY=your_api_key

# Edit .env.local with your API keysNEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com

NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# Start development serverNEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com

npm run devNEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id

```NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

GOOGLE_GENAI_API_KEY=your_google_ai_key

Open [http://localhost:3001](http://localhost:3001) in your browser.```



## 🔧 Environment Configuration## 🔥 Firebase Configuration



Create `.env.local` file with these variables:See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed Firebase setup instructions.



```bash## 📸 Camera Features

# Gemini AI API

GEMINI_API_KEY=your_gemini_api_key### Supported Browsers

- **Desktop**: Chrome 53+, Firefox 36+, Safari 11+, Edge 79+

# Firebase Main App- **Mobile**: iOS Safari 11+, Chrome Android 53+, Firefox Android 68+

NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key

NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com### Camera Implementation

NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id- Uses `getUserMedia` API with fallback support

NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com- Prefers rear camera on mobile devices

NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id- Real-time video preview with capture overlay

NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id- Automatic image compression and upload



# Firebase Sensor (IoT)### Code Example

NEXT_PUBLIC_FIREBASE_SENSOR_API_KEY=your_sensor_api_key```typescript

NEXT_PUBLIC_FIREBASE_SENSOR_AUTH_DOMAIN=sensor-project.firebaseapp.comconst startCamera = async () => {

NEXT_PUBLIC_FIREBASE_SENSOR_DATABASE_URL=https://sensor-project.firebaseio.com  const constraints = {

NEXT_PUBLIC_FIREBASE_SENSOR_PROJECT_ID=sensor-project-id    video: {

NEXT_PUBLIC_FIREBASE_SENSOR_STORAGE_BUCKET=sensor-project.appspot.com      facingMode: 'environment', // Rear camera

NEXT_PUBLIC_FIREBASE_SENSOR_MESSAGING_SENDER_ID=sensor-sender-id      width: { ideal: 1280, max: 1920 },

NEXT_PUBLIC_FIREBASE_SENSOR_APP_ID=sensor-app-id      height: { ideal: 720, max: 1080 }

    }

# Weather API  };

OPENWEATHER_API_KEY=your_openweather_key  

  const stream = await navigator.mediaDevices.getUserMedia(constraints);

# Supabase (Database)  videoRef.current.srcObject = stream;

NEXT_PUBLIC_SUPABASE_URL=your-supabase-url};

NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key```



# Optional## 🗂️ Project Structure

NEXT_PUBLIC_BASE_URL=http://localhost:3001

``````

src/

## 📂 Project Structure├── app/

│   ├── (app)/

```│   │   ├── disease-diagnosis/

firestudio/│   │   │   └── page.tsx

├── src/│   │   └── dashboard/

│   ├── app/                    # Next.js 15 app router│   │       └── page.tsx

│   │   ├── (app)/             # Main application routes│   └── api/

│   │   │   ├── crop-recommendation/├── components/

│   │   │   ├── disease-diagnosis/│   ├── disease-diagnosis-form.tsx

│   │   │   ├── market-prices/│   ├── main-nav.tsx

│   │   │   ├── weather/│   └── ui/

│   │   │   ├── community/├── lib/

│   │   │   └── dashboard/│   ├── firebase.ts

│   │   ├── api/               # API routes (Gemini, weather, etc.)│   ├── firebase-upload.ts

│   │   └── layout.tsx         # Root layout with providers│   ├── translations.ts

│   ├── components/            # Reusable React components│   └── utils.ts

│   │   ├── ui/               # Shadcn UI components└── ai/

│   │   └── mobile-navigation.tsx    └── flows/

│   ├── providers/             # React context providers        └── disease-diagnosis.ts

│   │   ├── mobile-provider.tsx```

│   │   ├── offline-provider.tsx

│   │   └── pwa-provider.tsx## 🎯 Key Components

│   ├── lib/                   # Utilities and configurations

│   │   ├── firebase.ts### Disease Diagnosis Form

│   │   ├── supabase.ts- **Location**: `src/components/disease-diagnosis-form.tsx`

│   │   └── utils.ts- **Features**: Camera capture, file upload, Firebase integration

│   └── features/              # Feature-specific code- **AI Integration**: Google Genkit disease diagnosis flow

├── public/                    # Static assets

│   ├── manifest.json          # PWA manifest### Firebase Upload Utility

│   ├── service-worker.js      # Offline functionality- **Location**: `src/lib/firebase-upload.ts`

│   └── icons/                 # App icons- **Features**: Image upload, metadata storage, unique filename generation

├── next.config.ts             # Next.js configuration

└── package.json

```

## 🚀 Deployment

### Automatic Deployment

- **Crop Recommendation**: Analyzes soil type, climate, and region# Mac/Linux

- **Disease Diagnosis**: Processes plant images with AI visionchmod +x deploy.sh && ./deploy.sh

- **Weather Bot**: Provides conversational weather advice```

- **Fertilizer Analysis**: Suggests optimal fertilizer combinations

### Manual Deployment

**Security**: API keys are never exposed to the frontend; all calls go through Next.js API routes.```bash

npm run build

### Firebase Integrationfirebase deploy --only hosting,firestore,storage

```

**Main App (Firestore + Storage)**:

- User authentication### Build Configuration

- Disease diagnosis uploads- Static export enabled for Firebase Hosting

- Community posts- Image optimization disabled for static deployment

- File storage- TypeScript and ESLint errors ignored for faster builds



**Sensor Database (Realtime Database)**:## 🧪 Testing

- ESP32 sensor data

- Real-time monitoring### Camera Test Page

- Historical dataOpen `camera-test.html` in your browser to test camera functionality independently:

- Camera access and permissions

### Supabase Database- Photo capture and preview

- Simulated Firebase upload

- Market prices data- Mobile responsiveness

- Government schemes

- Crops information### Development Server

- User profiles```bash

npm run dev

### Mobile/PWA Features# Open http://localhost:9002

```

- **Offline Mode**: Service worker caches static assets and API responses

- **Install Prompt**: One-click installation on mobile devices## 📊 Firebase Integration

- **Camera Access**: Direct photo capture for disease diagnosis

- **Bottom Navigation**: Mobile-optimized UI### Storage Structure

- **Touch Gestures**: Swipe and tap interactions```

- **Haptic Feedback**: Vibration on native devicesstorage/

└── disease_diagnosis/

    └── 2025-08-11T17-30-45-123Z_abc123_captured-leaf.jpg

```

### Firestore Collections

- Mobile-first approach

### Vercel (Recommended)- Touch-friendly controls

- Adaptive layouts for all screen sizes

1. **Push to GitHub**:

   ```bash## 🔒 Security

   git push origin main

   ```### Current Setup (Development)

- Open Firestore rules for testing

2. **Deploy on Vercel**:- Public storage access for development

   - Import your GitHub repository- No authentication required

   - Add environment variables from `.env.local`

   - Deploy### Production Recommendations

- Implement Firebase Authentication

3. **CLI Deployment**:- Restrict Firestore rules by user

   ```bash- Add storage security rules

   npm install -g vercel- Enable CORS for API endpoints

   vercel

   ```## 🤝 Contributing



### Firebase Hosting1. Fork the repository

2. Create a feature branch

```bash3. Make your changes

# Install Firebase CLI4. Test thoroughly (especially camera functionality)

npm install -g firebase-tools5. Submit a pull request



# Login to Firebase## 📝 License

firebase login

This project is licensed under the MIT License.

# Initialize Firebase

firebase init## 🆘 Support



# Deploy### Common Issues

firebase deploy1. **Camera not working**: Check HTTPS and browser permissions

```2. **Firebase errors**: Verify environment variables

3. **Build failures**: Run `npm install` and check dependencies

### Docker

### Resources

```bash- [Firebase Documentation](https://firebase.google.com/docs)

# Build image- [Next.js Documentation](https://nextjs.org/docs)

docker build -t agriassist .- [Google Genkit Documentation](https://firebase.google.com/docs/genkit)



# Run container---

docker run -p 3000:3000 agriassist

```Built with ❤️ for smart farming and agricultural technology.



## 🧪 Development CommandsTo get started, take a look at src/app/page.tsx.


```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests (if configured)
npm test

# Mobile sync
npm run mobile:sync

# Open Android Studio
npm run mobile:android
```

## 🔒 Security Best Practices

### Production Checklist

- [ ] Enable Firebase Authentication
- [ ] Configure Firestore security rules
- [ ] Set up CORS for API routes
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting on API routes
- [ ] Add CSP headers
- [ ] Implement user session management
- [ ] Set up monitoring and logging

### Firebase Rules Example

```javascript
// Firestore rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🌍 Internationalization

AgriAssist supports multiple languages:

- **English** (en)
- **Hindi** (hi)
- **Tamil** (ta)
- **Telugu** (te)
- More languages can be added in `src/lib/translations.ts`

```typescript
// Add new language
export const translations = {
  en: { welcome: "Welcome" },
  hi: { welcome: "स्वागत है" },
  ta: { welcome: "வரவேற்கிறோம்" }
};
```

## 🐛 Troubleshooting

### Common Issues

**Camera not working**:
- Ensure HTTPS in production (HTTP only works on localhost)
- Check browser permissions
- Verify device has a camera

**Firebase errors**:
- Verify all environment variables are set
- Check Firebase project configuration
- Ensure Firestore/Storage rules allow access

**Build failures**:
- Clear `.next` cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run typecheck`

**Mobile build issues**:
- Verify Android SDK is installed
- Check `ANDROID_HOME` environment variable
- Ensure Java JDK 11+ is installed

### Get Help

- Check existing [GitHub Issues](https://github.com/your-repo/issues)
- Review [Next.js Documentation](https://nextjs.org/docs)
- See [Firebase Documentation](https://firebase.google.com/docs)
- Read [Capacitor Documentation](https://capacitorjs.com/docs)

## 📊 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn UI** - Component library
- **Radix UI** - Headless components

### Backend
- **Next.js API Routes** - Serverless functions
- **Firebase** - Authentication, Storage, Realtime Database
- **Supabase** - PostgreSQL database
- **Google Gemini AI** - AI/ML capabilities

### Mobile
- **Capacitor** - Native mobile wrapper
- **PWA** - Progressive Web App
- **Service Workers** - Offline functionality

### DevOps
- **Vercel** - Hosting and deployment
- **GitHub Actions** - CI/CD (optional)
- **Docker** - Containerization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use Prettier for code formatting
- Write meaningful commit messages
- Test on both desktop and mobile
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for AI capabilities
- Firebase for backend services
- Supabase for database
- Vercel for hosting
- Open source community for amazing tools

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ for farmers and agricultural communities worldwide.**

Last updated: November 2025