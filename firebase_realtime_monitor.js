// Firebase Realtime Database Live Monitor
// Simple test script to verify real-time sensor data updates

const https = require('https');

// Your Firebase configuration
const FIREBASE_CONFIG = {
  databaseURL: 'https://sensor-data-f9ac2-default-rtdb.firebaseio.com/',
  secret: 'sljFmt8YWrExo6AiEiFQJD8lDuNnH5aX1M7t8AyF'
};

console.log('🔥 Firebase Realtime Database Live Monitor');
console.log('=' * 50);
console.log('📡 Database URL:', FIREBASE_CONFIG.databaseURL);
console.log('📊 Monitoring path: /sensor');
console.log('🕐 Started at:', new Date().toLocaleString());
console.log('=' * 50);
console.log('');

// Function to fetch current sensor data
function fetchSensorData() {
  return new Promise((resolve, reject) => {
    const url = `${FIREBASE_CONFIG.databaseURL}sensor.json?auth=${FIREBASE_CONFIG.secret}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const sensorData = JSON.parse(data);
            resolve(sensorData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (error) {
          reject(new Error(`Parse error: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Function to display sensor data in a formatted way
function displaySensorData(data, isUpdate = false) {
  const timestamp = new Date().toLocaleString();
  const updateType = isUpdate ? '🔄 UPDATE' : '📥 INITIAL';
  
  console.log(`\n${updateType} [${timestamp}]`);
  console.log('━'.repeat(50));
  
  if (!data) {
    console.log('❌ No data received');
    return;
  }
  
  // Display all sensor values
  console.log('🌱 Soil Moisture:', data.soilMoisture !== undefined ? `${data.soilMoisture}%` : 'N/A');
  console.log('🧪 pH Level:     ', data.pH !== undefined ? data.pH : 'N/A');
  console.log('🌿 NPK:          ', data.NPK !== undefined ? data.NPK : 'N/A');
  console.log('🍃 Nitrogen:     ', data.Nitrogen !== undefined ? (data.Nitrogen === -1 ? 'Not Set' : `${data.Nitrogen} ppm`) : 'N/A');
  console.log('💜 Phosphorus:   ', data.Phosphorus !== undefined ? (data.Phosphorus === -1 ? 'Not Set' : `${data.Phosphorus} ppm`) : 'N/A');
  console.log('🟡 Potassium:    ', data.Potassium !== undefined ? (data.Potassium === -1 ? 'Not Set' : `${data.Potassium} ppm`) : 'N/A');
  
  // Show timestamp if available
  if (data.timestamp) {
    console.log('⏰ Timestamp:    ', new Date(data.timestamp).toLocaleString());
  }
  if (data.lastUpdated) {
    console.log('📅 Last Updated: ', data.lastUpdated);
  }
  
  console.log('━'.repeat(50));
}

// Function to start real-time monitoring using polling
// (Since we're using REST API, we'll poll every few seconds)
let previousData = null;
let pollCount = 0;

async function startMonitoring() {
  try {
    // Get initial data
    console.log('🔍 Fetching initial sensor data...');
    const initialData = await fetchSensorData();
    displaySensorData(initialData, false);
    previousData = JSON.stringify(initialData);
    
    console.log('\n🔄 Starting real-time monitoring...');
    console.log('💡 Tip: Change values in Firebase Console to see live updates!');
    console.log('🌐 Firebase Console: https://console.firebase.google.com/project/sensor-data-f9ac2/database');
    console.log('⏹️  Press Ctrl+C to stop monitoring\n');
    
    // Start polling for changes
    setInterval(async () => {
      try {
        pollCount++;
        const currentData = await fetchSensorData();
        const currentDataString = JSON.stringify(currentData);
        
        // Check if data has changed
        if (currentDataString !== previousData) {
          displaySensorData(currentData, true);
          previousData = currentDataString;
        } else {
          // Show a small indicator that we're still monitoring
          if (pollCount % 10 === 0) {
            process.stdout.write(`💓 Monitoring... (${pollCount} checks)\r`);
          }
        }
      } catch (error) {
        console.error(`\n❌ Error fetching data: ${error.message}`);
      }
    }, 2000); // Poll every 2 seconds
    
  } catch (error) {
    console.error('❌ Failed to start monitoring:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify Firebase project ID: sensor-data-f9ac2');
    console.log('   3. Confirm database secret is correct');
    console.log('   4. Check Firebase Console for any issues');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Stopping Firebase monitor...');
  console.log('📊 Total checks performed:', pollCount);
  console.log('🕐 Stopped at:', new Date().toLocaleString());
  console.log('👋 Goodbye!');
  process.exit(0);
});

// Start the monitoring
startMonitoring();
