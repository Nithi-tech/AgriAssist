@echo off
REM Firebase Deployment Script for Disease Diagnosis App (Windows)
echo 🚀 Starting deployment process...

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Firebase CLI not found. Installing...
    npm install -g firebase-tools
)

REM Login to Firebase (if not already logged in)
echo 🔐 Checking Firebase authentication...
firebase login --non-interactive
if errorlevel 1 (
    echo Please run: firebase login
    exit /b 1
)

REM Build the Next.js application
echo 🏗️  Building Next.js application...
npm run build
if errorlevel 1 (
    echo ❌ Build failed. Please fix errors and try again.
    exit /b 1
)

REM Deploy to Firebase Hosting
echo 📤 Deploying to Firebase...
firebase deploy --only hosting,firestore,storage
if errorlevel 1 (
    echo ❌ Deployment failed.
    exit /b 1
)

echo ✅ Deployment complete!
echo 🌐 Your app is now live on Firebase Hosting!

REM Show project info
firebase projects:list
firebase hosting:channel:list

pause
