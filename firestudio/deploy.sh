#!/bin/bash

# Firebase Deployment Script for Disease Diagnosis App
echo "🚀 Starting deployment process..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Login to Firebase (if not already logged in)
echo "🔐 Checking Firebase authentication..."
firebase login --non-interactive || {
    echo "Please run: firebase login"
    exit 1
}

# Build the Next.js application
echo "🏗️  Building Next.js application..."
npm run build || {
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
}

# Initialize Firebase project (if not already initialized)
if [ ! -f "firebase.json" ]; then
    echo "🔧 Initializing Firebase project..."
    firebase init hosting firestore storage
fi

# Deploy to Firebase Hosting
echo "📤 Deploying to Firebase..."
firebase deploy --only hosting,firestore,storage || {
    echo "❌ Deployment failed."
    exit 1
}

echo "✅ Deployment complete!"
echo "🌐 Your app is now live on Firebase Hosting!"

# Show project info
firebase projects:list
firebase hosting:channel:list
