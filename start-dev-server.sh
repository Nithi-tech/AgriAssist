#!/bin/bash

# Navigate to the correct directory and start the development server
echo "🚀 Starting Next.js Development Server for FireStudio..."
echo "📍 Project Directory: firestudio"
echo "🌐 Server will start on: http://localhost:9005"
echo ""

cd firestudio

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies first..."
    npm install
fi

# Start the development server
echo "🔄 Starting development server..."
npm run dev
