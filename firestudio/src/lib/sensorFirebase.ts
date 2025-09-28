// Clean Firebase Realtime Database configuration for sensors only
// This is completely isolated from other Firebase services (Firestore, Auth, Storage, etc.)
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database, ref, set, onValue, off } from 'firebase/database';

// Sensor Firebase configuration - ONLY for realtime sensor data
const sensorFirebaseConfig = {
  apiKey: "AIzaSyAXM6jW_0zvaKhzY-DND2dguaJch6vyRJg",
  authDomain: "realtime-60c4a.firebaseapp.com",
  databaseURL: "https://realtime-60c4a-default-rtdb.firebaseio.com/",
  projectId: "realtime-60c4a",
  storageBucket: "realtime-60c4a.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize separate Firebase app for sensors with unique name
const SENSOR_APP_NAME = 'sensor-realtime-app';

let sensorApp: FirebaseApp;
let sensorDatabase: Database;

try {
  // Check if the sensor app already exists
  const existingApps = getApps();
  const sensorAppExists = existingApps.find(app => app.name === SENSOR_APP_NAME);
  
  if (sensorAppExists) {
    sensorApp = sensorAppExists;
  } else {
    sensorApp = initializeApp(sensorFirebaseConfig, SENSOR_APP_NAME);
  }
  
  sensorDatabase = getDatabase(sensorApp);
  console.log('🔥 Sensor Firebase initialized:', sensorFirebaseConfig.databaseURL);
} catch (error) {
  console.error('❌ Error initializing sensor Firebase app:', error);
  throw error;
}

// Export the sensor database instance
export { sensorDatabase };

// Type definitions for sensor data structure
export interface SensorData {
  NPK: number;
  Nitrogen: number;
  Phosphorus: number;
  Potassium: number;
  pH: number;
  soilMoisture: number;
  timestamp?: number;
  lastUpdated?: string;
}

// Type definition for alerts data
export interface AlertsData {
  animalDetection: string;
}
