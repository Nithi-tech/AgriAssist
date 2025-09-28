// Separate Firebase Realtime Database configuration for sensor data ONLY
// This does not interfere with existing Firebase services
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

// Unique Firebase configuration for sensor data only
const sensorRealtimeConfig = {
  apiKey: "AIzaSyAXM6jW_0zvaKhzY-DND2dguaJch6vyRJg",
  authDomain: "realtime-60c4a.firebaseapp.com",
  databaseURL: "https://realtime-60c4a-default-rtdb.firebaseio.com",
  projectId: "realtime-60c4a",
  storageBucket: "realtime-60c4a.appspot.com",
  messagingSenderId: "344951946058",
  appId: "1:344951946058:web:c81cc0f3ce2edc36f21e12"
};

// Unique app name to avoid conflicts with main Firebase app
const SENSOR_REALTIME_APP_NAME = 'sensor-realtime-database-app';

let sensorRealtimeApp: FirebaseApp;
let sensorRealtimeDatabase: Database;

// Initialize separate Firebase app instance for sensor realtime data
try {
  // Check if sensor app already exists to avoid re-initialization
  const existingApp = getApps().find(app => app.name === SENSOR_REALTIME_APP_NAME);
  
  if (existingApp) {
    sensorRealtimeApp = existingApp;
  } else {
    sensorRealtimeApp = initializeApp(sensorRealtimeConfig, SENSOR_REALTIME_APP_NAME);
  }
  
  // Get Realtime Database instance for sensors
  sensorRealtimeDatabase = getDatabase(sensorRealtimeApp);
  
  console.log('✅ Sensor Firebase Realtime Database initialized successfully');
  console.log('🔗 Database URL:', sensorRealtimeConfig.databaseURL);
} catch (error) {
  console.error('❌ Error initializing sensor Firebase Realtime Database:', error);
  throw error;
}

export { sensorRealtimeDatabase, sensorRealtimeApp };
export default sensorRealtimeDatabase;
