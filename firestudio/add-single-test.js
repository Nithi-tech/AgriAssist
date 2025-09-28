// Quick test to add single sensor data point
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

async function addTestData() {
  console.log('🔥 Adding test sensor data...');
  
  const testData = {
    soilMoisture: 65.5,
    pH: 7.2,
    Nitrogen: 85,
    Phosphorus: 25,
    Potassium: 195,
    NPK: 305,
    timestamp: Date.now(),
    lastUpdated: new Date().toISOString()
  };
  
  try {
    await set(ref(database, 'sensor'), testData);
    console.log('✅ Test data added successfully!');
    console.log('📊 Data:', testData);
    console.log('🌐 Check your dashboard at http://localhost:3001/dashboard');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addTestData();
