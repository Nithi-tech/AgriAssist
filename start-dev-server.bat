@echo off
REM Navigate to the correct directory and start the development server
echo 🚀 Starting Next.js Development Server for FireStudio...
echo 📍 Project Directory: firestudio  
echo 🌐 Server will start on: http://localhost:9005
echo.

cd firestudio

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies first...
    npm install
)

REM Start the development server
echo 🔄 Starting development server...
npm run dev
