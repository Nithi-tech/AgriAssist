// Firebase Sensor Debug Tool
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, onValue, set, push } = require('firebase/database');

// Firebase configuration for sensor database
const sensorFirebaseConfig = {
  apiKey: "AIzaSyDA3p5sH-HxjwlPNQoscdQNmQv-N3AGYOI",
  authDomain: "sensor-data-f9ac2.firebaseapp.com", 
  databaseURL: "https://sensor-data-f9ac2-default-rtdb.firebaseio.com/",
  projectId: "sensor-data-f9ac2",
  storageBucket: "sensor-data-f9ac2.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
};

async function debugSensorData() {
  try {
    console.log('🔧 Starting Firebase Sensor Debug...');
    
    // Initialize Firebase
    const app = initializeApp(sensorFirebaseConfig);
    const database = getDatabase(app);
    
    console.log('✅ Firebase initialized successfully');
    
    // Check current data at /sensor
    const sensorRef = ref(database, 'sensor');
    
    console.log('📡 Listening for current sensor data...');
    onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      console.log('📊 Current sensor data:', data);
      
      if (!data) {
        console.log('📝 No data found. Adding test sensor data...');
        
        // Add test sensor data
        const testData = {
          NPK: 25.5,
          Nitrogen: 15.2,
          Phosphorus: 8.1,
          Potassium: 12.8,
          pH: 6.5,
          soilMoisture: 45.3,
          timestamp: Date.now(),
          lastUpdated: new Date().toISOString()
        };
        
        // Set test data
        set(sensorRef, testData)
          .then(() => {
            console.log('✅ Test sensor data added successfully');
            console.log('📊 Test data:', testData);
          })
          .catch((error) => {
            console.error('❌ Error adding test data:', error);
          });
      }
    }, (error) => {
      console.error('❌ Error reading sensor data:', error);
    });
    
    // Also check the root to see full database structure
    const rootRef = ref(database, '/');
    onValue(rootRef, (snapshot) => {
      const data = snapshot.val();
      console.log('🗂️ Full database structure:', JSON.stringify(data, null, 2));
    }, { onlyOnce: true });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug
debugSensorData();

// Keep the script running to listen for real-time updates
console.log('🔄 Script running... Press Ctrl+C to exit');
