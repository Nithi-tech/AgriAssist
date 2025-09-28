// Firebase Realtime Database Sensor Test
// Simple script to test the sensor Firebase connection and add test data
// Database: https://realtime-60c4a-default-rtdb.firebaseio.com/

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, onValue } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyAXM6jW_0zvaKhzY-DND2dguaJch6vyRJg",
  authDomain: "realtime-60c4a.firebaseapp.com",
  databaseURL: "https://realtime-60c4a-default-rtdb.firebaseio.com/",
  projectId: "realtime-60c4a",
  storageBucket: "realtime-60c4a.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

function generateTestSensorData() {
  return {
    soilMoisture: Math.round((Math.random() * 40 + 30) * 10) / 10, // 30-70%
    pH: Math.round((Math.random() * 2 + 6) * 100) / 100, // 6.0-8.0
    Nitrogen: Math.round(Math.random() * 50 + 50), // 50-100 mg/kg
    Phosphorus: Math.round(Math.random() * 30 + 15), // 15-45 mg/kg
    Potassium: Math.round(Math.random() * 100 + 150), // 150-250 mg/kg
    timestamp: Date.now(),
    lastUpdated: new Date().toISOString()
  };
}

async function testSensorConnection() {
  console.log('🌾 Testing Firebase Realtime Database for Sensors');
  console.log('🔗 Database URL:', firebaseConfig.databaseURL);
  console.log('📊 Dashboard URL: http://localhost:3001/dashboard');
  console.log('');
  
  try {
    // Add test sensor data
    const testData = generateTestSensorData();
    await set(ref(database, 'SensorData'), testData);
    
    console.log('✅ Test sensor data added successfully:');
    console.log(`   💧 Soil Moisture: ${testData.soilMoisture}%`);
    console.log(`   ⚗️ pH Level: ${testData.pH}`);
    console.log(`   🌿 Nitrogen: ${testData.Nitrogen} mg/kg`);
    console.log(`   🌿 Phosphorus: ${testData.Phosphorus} mg/kg`);
    console.log(`   🌿 Potassium: ${testData.Potassium} mg/kg`);
    console.log('');
    
    // Add alert data
    await set(ref(database, 'alerts'), {
      animalDetection: "No animal detected",
      lastCheck: new Date().toISOString()
    });
    
    console.log('✅ Alert data added successfully');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Open http://localhost:3001/dashboard in your browser');
    console.log('   2. Check the "Real-time Sensor Data" section');
    console.log('   3. You should see the Live indicator and sensor values');
    console.log('');
    console.log('🔄 To simulate continuous updates, run:');
    console.log('   node continuous-sensor-sim.js');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testSensorConnection();
