// Simple test script to add sensor data to Firebase Realtime Database
// Run with: node test-realtime-sensor.js

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, onValue } = require('firebase/database');

// Firebase configuration for the new sensor database
const firebaseConfig = {
  apiKey: "AIzaSyAXM6jW_0zvaKhzY-DND2dguaJch6vyRJg",
  authDomain: "realtime-60c4a.firebaseapp.com",
  databaseURL: "https://realtime-60c4a-default-rtdb.firebaseio.com/",
  projectId: "realtime-60c4a",
  storageBucket: "realtime-60c4a.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Function to generate realistic sensor data
function generateSensorData() {
  const baseTime = Date.now();
  
  return {
    soilMoisture: Math.round((Math.random() * 40 + 30) * 10) / 10, // 30-70%
    pH: Math.round((Math.random() * 2 + 6) * 100) / 100, // 6.0-8.0
    Nitrogen: Math.round(Math.random() * 50 + 50), // 50-100 mg/kg
    Phosphorus: Math.round(Math.random() * 30 + 15), // 15-45 mg/kg
    Potassium: Math.round(Math.random() * 100 + 150), // 150-250 mg/kg
    timestamp: baseTime,
    lastUpdated: new Date().toISOString()
  };
}

// Test the connection and add initial data
async function testConnection() {
  console.log('🔗 Testing connection to Firebase Realtime Database...');
  console.log('📍 Database URL: https://realtime-60c4a-default-rtdb.firebaseio.com/');
  
  try {
    // Generate initial sensor data
    const sensorData = generateSensorData();
    sensorData.NPK = sensorData.Nitrogen + sensorData.Phosphorus + sensorData.Potassium;
    
    // Write to sensor path
    const sensorRef = ref(database, 'sensor');
    await set(sensorRef, sensorData);
    
    console.log('✅ Initial sensor data added successfully:', {
      soilMoisture: `${sensorData.soilMoisture}%`,
      pH: sensorData.pH,
      N: sensorData.Nitrogen,
      P: sensorData.Phosphorus,
      K: sensorData.Potassium,
      NPK: sensorData.NPK
    });
    
    // Add alert data
    const alertRef = ref(database, 'alerts');
    await set(alertRef, {
      animalDetection: "No animal detected",
      lastCheck: new Date().toISOString()
    });
    
    console.log('✅ Alert data added successfully');
    
    // Set up listener to verify real-time updates
    console.log('👂 Setting up real-time listener...');
    onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log('📊 Real-time update received:', {
          soilMoisture: `${data.soilMoisture}%`,
          pH: data.pH,
          N: data.Nitrogen,
          P: data.Phosphorus,
          K: data.Potassium,
          time: new Date().toLocaleTimeString()
        });
      }
    });
    
    // Simulate real-time updates
    console.log('🔄 Starting real-time simulation (every 5 seconds)...');
    let updateCount = 0;
    
    const updateInterval = setInterval(async () => {
      updateCount++;
      const newData = generateSensorData();
      newData.NPK = newData.Nitrogen + newData.Phosphorus + newData.Potassium;
      
      await set(sensorRef, newData);
      console.log(`🔄 Update #${updateCount} sent at ${new Date().toLocaleTimeString()}`);
    }, 5000);
    
    // Stop after 30 seconds
    setTimeout(() => {
      clearInterval(updateInterval);
      console.log('🛑 Simulation completed');
      process.exit(0);
    }, 30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the test
testConnection();
