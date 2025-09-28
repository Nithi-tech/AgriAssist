// Test script to add sensor data to the new Firebase Realtime Database
// Run with: node add-realtime-sensor-data.js

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with the new database
const serviceAccount = {
  "type": "service_account",
  "project_id": "realtime-60c4a",
  "private_key_id": "test-key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@realtime-60c4a.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40realtime-60c4a.iam.gserviceaccount.com"
};

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://realtime-60c4a-default-rtdb.firebaseio.com/"
  });
}

const db = admin.database();

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

// Function to simulate real-time sensor updates
async function simulateRealTimeSensorData() {
  console.log('🌾 Starting real-time sensor data simulation...');
  console.log('🔗 Database URL: https://realtime-60c4a-default-rtdb.firebaseio.com/');
  
  let updateCount = 0;
  
  const updateData = async () => {
    try {
      const sensorData = generateSensorData();
      
      // Add NPK calculation
      sensorData.NPK = sensorData.Nitrogen + sensorData.Phosphorus + sensorData.Potassium;
      
      await db.ref('sensor').set(sensorData);
      
      updateCount++;
      console.log(`📊 Update #${updateCount} - Sensor data updated:`, {
        soilMoisture: `${sensorData.soilMoisture}%`,
        pH: sensorData.pH,
        N: sensorData.Nitrogen,
        P: sensorData.Phosphorus,
        K: sensorData.Potassium,
        NPK: sensorData.NPK,
        time: new Date().toLocaleTimeString()
      });
      
      // Also update alerts (for complete data structure)
      await db.ref('alerts').set({
        animalDetection: Math.random() > 0.8 ? "Animal detected!" : "No animal detected",
        lastCheck: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error updating sensor data:', error.message);
    }
  };
  
  // Initial update
  await updateData();
  
  // Update every 3 seconds to simulate real-time sensor readings
  const interval = setInterval(updateData, 3000);
  
  console.log('⏰ Real-time updates started (every 3 seconds)');
  console.log('🔴 Press Ctrl+C to stop the simulation');
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping real-time sensor simulation...');
    clearInterval(interval);
    process.exit(0);
  });
}

// Run the simulation
simulateRealTimeSensorData().catch(console.error);
