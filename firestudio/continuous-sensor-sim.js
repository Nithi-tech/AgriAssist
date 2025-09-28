// Continuous sensor data simulation for real-time dashboard testing
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');

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

function generateRealisticSensorData() {
  // Generate realistic sensor data with slight variations
  const baseValues = {
    soilMoisture: 55 + (Math.random() - 0.5) * 20, // 45-65%
    pH: 6.8 + (Math.random() - 0.5) * 0.8, // 6.4-7.2
    Nitrogen: 80 + (Math.random() - 0.5) * 30, // 65-95 mg/kg
    Phosphorus: 25 + (Math.random() - 0.5) * 15, // 17.5-32.5 mg/kg
    Potassium: 180 + (Math.random() - 0.5) * 40 // 160-200 mg/kg
  };
  
  return {
    soilMoisture: Math.round(baseValues.soilMoisture * 10) / 10,
    pH: Math.round(baseValues.pH * 100) / 100,
    Nitrogen: Math.round(baseValues.Nitrogen),
    Phosphorus: Math.round(baseValues.Phosphorus),
    Potassium: Math.round(baseValues.Potassium),
    NPK: Math.round(baseValues.Nitrogen + baseValues.Phosphorus + baseValues.Potassium),
    timestamp: Date.now(),
    lastUpdated: new Date().toISOString()
  };
}

async function startContinuousUpdates() {
  console.log('🌾 Starting continuous sensor data simulation...');
  console.log('🔥 Database: https://realtime-60c4a-default-rtdb.firebaseio.com/');
  console.log('📊 Dashboard: http://localhost:3001/dashboard');
  console.log('⏰ Updates every 3 seconds');
  console.log('🛑 Press Ctrl+C to stop\n');
  
  let updateCount = 0;
  
  const updateSensorData = async () => {
    try {
      const sensorData = generateRealisticSensorData();
      updateCount++;
      
      await set(ref(database, 'SensorData'), sensorData);
      
      console.log(`🔄 Update #${updateCount} at ${new Date().toLocaleTimeString()}:`);
      console.log(`   💧 Soil Moisture: ${sensorData.soilMoisture}%`);
      console.log(`   ⚗️  pH Level: ${sensorData.pH}`);
      console.log(`   🌿 N-P-K: ${sensorData.Nitrogen}-${sensorData.Phosphorus}-${sensorData.Potassium} (Total: ${sensorData.NPK})`);
      console.log('');
      
    } catch (error) {
      console.error('❌ Error updating sensor data:', error.message);
    }
  };
  
  // Initial update
  await updateSensorData();
  
  // Set up interval for continuous updates
  const interval = setInterval(updateSensorData, 3000);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping sensor simulation...');
    clearInterval(interval);
    console.log('✅ Sensor simulation stopped.');
    process.exit(0);
  });
}

startContinuousUpdates().catch(console.error);
