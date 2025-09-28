// lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Initialize Firebase only if no apps exist (prevents re-initialization in development)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore, Auth, and Realtime Database
export const db = getFirestore(app);
export const auth = getAuth(app);
export const realtimeDb = getDatabase(app);

// Connect to Firebase Emulator if in development mode
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
  // Only connect to emulator if not already connected
  try {
    connectFirestoreEmulator(db, 'localhost', 9005);
    connectAuthEmulator(auth, 'http://localhost:9099');
    console.log('🔥 Connected to Firebase Emulator');
  } catch (error) {
    console.log('Firebase Emulator already connected or connection failed');
  }
}

export default app;

// Type definitions for sensor readings according to requirements
export interface SensorReading {
  id?: string;
  ph: number;
  moisture: number;
  npk: {
    n: number;
    p: number;
    k: number;
  };
  esp32: string; // device id
  timestamp: any; // Firestore Timestamp
}

// Example document structure for sensorData collection:
/*
{
  "ph": 6.8,
  "moisture": 45.3,
  "npk": {
    "n": 25,
    "p": 15,
    "k": 20
  },
  "esp32": "ESP32_001",
  "timestamp": "2025-08-20T10:30:00Z" // Firestore server timestamp
}
*/
