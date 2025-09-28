// Backend API route for receiving and pushing sensor data to Firebase Realtime Database
import { NextRequest, NextResponse } from 'next/server';

// Client-side Firebase for now (since Admin SDK credentials are not set up)
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, set, get, Database } from 'firebase/database';

// Firebase configuration for sensor database
const sensorFirebaseConfig = {
  apiKey: "AIzaSyAXM6jW_0zvaKhzY-DND2dguaJch6vyRJg",
  authDomain: "realtime-60c4a.firebaseapp.com",
  databaseURL: "https://realtime-60c4a-default-rtdb.firebaseio.com",
  projectId: "realtime-60c4a",
  storageBucket: "realtime-60c4a.appspot.com",
  messagingSenderId: "344951946058",
  appId: "1:344951946058:web:c81cc0f3ce2edc36f21e12"
};

// Initialize Firebase for sensor data
let sensorApp;
let sensorDatabase: Database;

try {
  const existingApp = getApps().find(app => app.name === 'sensor-api-app');
  if (existingApp) {
    sensorApp = existingApp;
  } else {
    sensorApp = initializeApp(sensorFirebaseConfig, 'sensor-api-app');
  }
  
  sensorDatabase = getDatabase(sensorApp);
  console.log('🔥 Sensor Firebase initialized for API');
  
} catch (error) {
  console.error('❌ Error initializing sensor Firebase for API:', error);
}

// Expected sensor data structure
interface SensorDataInput {
  Nitrogen: number;
  Phosphorus: number;
  Potassium: number;
  pH: number;
  soilMoisture: number;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const { Nitrogen, Phosphorus, Potassium, pH, soilMoisture } = body as SensorDataInput;
    
    if (typeof Nitrogen !== 'number' || 
        typeof Phosphorus !== 'number' || 
        typeof Potassium !== 'number' || 
        typeof pH !== 'number' || 
        typeof soilMoisture !== 'number') {
      return NextResponse.json(
        { error: 'Invalid sensor data. All values must be numbers.' },
        { status: 400 }
      );
    }

    // Prepare sensor data with timestamp
    const timestamp = Date.now();
    const sensorData = {
      Nitrogen,
      Phosphorus,
      Potassium,
      pH,
      soilMoisture,
      lastUpdated: new Date().toISOString(),
      timestamp
    };

    // Push to Firebase Realtime Database
    const sensorRef = ref(sensorDatabase, 'SensorData');
    await set(sensorRef, sensorData);

    console.log('✅ Sensor data pushed to Firebase:', sensorData);

    return NextResponse.json({
      success: true,
      message: 'Sensor data successfully stored',
      data: sensorData,
      timestamp: timestamp
    });

  } catch (error) {
    console.error('❌ Error storing sensor data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to store sensor data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current sensor data
    const sensorRef = ref(sensorDatabase, 'SensorData');
    const snapshot = await get(sensorRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return NextResponse.json({
        success: true,
        data: data,
        timestamp: Date.now()
      });
    } else {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No sensor data available'
      });
    }
    
  } catch (error) {
    console.error('❌ Error retrieving sensor data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve sensor data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
