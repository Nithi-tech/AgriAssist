# 🌱 AgriAssist - Smart Farming Disease Diagnosis

A modern Next.js application with AI-powered plant disease diagnosis, featuring camera capture and Firebase integration.

## ✨ Features

### 🔍 Disease Diagnosis
- **Camera Capture**: Take photos directly from device camera (mobile & desktop)
- **File Upload**: Upload existing plant images
- **AI Analysis**: Powered by Google's Genkit AI flows
- **Firebase Storage**: Automatic image upload and metadata storage
- **Multi-language Support**: English, Hindi, Tamil, Telugu

### 📱 Mobile-First Design
- Responsive design for all screen sizes
- Progressive Web App capabilities
- Camera access with fallback support
- Touch-friendly interface

### 🚀 Modern Tech Stack
- **Next.js 14** with TypeScript
- **Firebase** (Storage + Firestore)
- **Tailwind CSS** for styling
- **Radix UI** components
- **Google Genkit** for AI flows

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account
- Google AI API key

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd firestudio

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Firebase and Google AI credentials

# Start development server
npm run dev
```

### Environment Setup
Create `.env.local` file:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
GOOGLE_GENAI_API_KEY=your_google_ai_key
```

## 🔥 Firebase Configuration

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed Firebase setup instructions.

## 📸 Camera Features

### Supported Browsers
- **Desktop**: Chrome 53+, Firefox 36+, Safari 11+, Edge 79+
- **Mobile**: iOS Safari 11+, Chrome Android 53+, Firefox Android 68+

### Camera Implementation
- Uses `getUserMedia` API with fallback support
- Prefers rear camera on mobile devices
- Real-time video preview with capture overlay
- Automatic image compression and upload

### Code Example
```typescript
const startCamera = async () => {
  const constraints = {
    video: {
      facingMode: 'environment', // Rear camera
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 }
    }
  };
  
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  videoRef.current.srcObject = stream;
};
```

## 🗂️ Project Structure

```
src/
├── app/
│   ├── (app)/
│   │   ├── disease-diagnosis/
│   │   │   └── page.tsx
│   │   └── dashboard/
│   │       └── page.tsx
│   └── api/
├── components/
│   ├── disease-diagnosis-form.tsx
│   ├── main-nav.tsx
│   └── ui/
├── lib/
│   ├── firebase.ts
│   ├── firebase-upload.ts
│   ├── translations.ts
│   └── utils.ts
└── ai/
    └── flows/
        └── disease-diagnosis.ts
```

## 🎯 Key Components

### Disease Diagnosis Form
- **Location**: `src/components/disease-diagnosis-form.tsx`
- **Features**: Camera capture, file upload, Firebase integration
- **AI Integration**: Google Genkit disease diagnosis flow

### Firebase Upload Utility
- **Location**: `src/lib/firebase-upload.ts`
- **Features**: Image upload, metadata storage, unique filename generation

### Navigation
- **Location**: `src/components/main-nav.tsx` 
- **Removed**: Soil Health, Irrigation Planner, Alerts & Warnings, Community Forum
- **Kept**: Core farming features (Crop Recommendation, Disease Diagnosis, Weather, etc.)

## 🚀 Deployment

### Automatic Deployment
```bash
# Windows
./deploy.bat

# Mac/Linux
chmod +x deploy.sh && ./deploy.sh
```

### Manual Deployment
```bash
npm run build
firebase deploy --only hosting,firestore,storage
```

### Build Configuration
- Static export enabled for Firebase Hosting
- Image optimization disabled for static deployment
- TypeScript and ESLint errors ignored for faster builds

## 🧪 Testing

### Camera Test Page
Open `camera-test.html` in your browser to test camera functionality independently:
- Camera access and permissions
- Photo capture and preview
- Simulated Firebase upload
- Mobile responsiveness

### Development Server
```bash
npm run dev
# Open http://localhost:9002
```

## 📊 Firebase Integration

### Storage Structure
```
storage/
└── disease_diagnosis/
    └── 2025-08-11T17-30-45-123Z_abc123_captured-leaf.jpg
```

### Firestore Collections
```
disease_diagnosis_uploads/
├── document_id_1/
│   ├── fileName: "captured-leaf.jpg"
│   ├── downloadURL: "https://..."
│   ├── uploadedAt: timestamp
│   ├── processed: false
│   └── metadata: { ... }
```

## 🔧 Development Scripts

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Type checking
npm run typecheck

# Genkit development
npm run genkit:dev
```

## 🌐 Browser Support

### Camera API Support
- ✅ Chrome 53+ (Desktop & Mobile)
- ✅ Firefox 36+ (Desktop & Mobile)  
- ✅ Safari 11+ (Desktop & Mobile)
- ✅ Edge 79+
- ✅ Samsung Internet 6.2+

### Responsive Design
- Mobile-first approach
- Touch-friendly controls
- Adaptive layouts for all screen sizes

## 🔒 Security

### Current Setup (Development)
- Open Firestore rules for testing
- Public storage access for development
- No authentication required

### Production Recommendations
- Implement Firebase Authentication
- Restrict Firestore rules by user
- Add storage security rules
- Enable CORS for API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (especially camera functionality)
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

### Common Issues
1. **Camera not working**: Check HTTPS and browser permissions
2. **Firebase errors**: Verify environment variables
3. **Build failures**: Run `npm install` and check dependencies

### Resources
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Google Genkit Documentation](https://firebase.google.com/docs/genkit)

---

Built with ❤️ for smart farming and agricultural technology.

To get started, take a look at src/app/page.tsx.
