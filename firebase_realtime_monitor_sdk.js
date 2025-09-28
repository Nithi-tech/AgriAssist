// Firebase Realtime Database Live Monitor (Firebase SDK Version)
// True real-time listening using Firebase SDK

// First install firebase: npm install firebase
// Then run: node firebase_realtime_monitor_sdk.js

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, onValue, off } = require('firebase/database');

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDA3p5sH-HxjwlPNQoscdQNmQv-N3AGYOI",
  authDomain: "sensor-data-f9ac2.firebaseapp.com",
  databaseURL: "https://sensor-data-f9ac2-default-rtdb.firebaseio.com/",
  projectId: "sensor-data-f9ac2",
  storageBucket: "sensor-data-f9ac2.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig, 'sensor-monitor-app');
const database = getDatabase(app);

console.log('🔥 Firebase Realtime Database Live Monitor (SDK Version)');
console.log('=' * 60);
console.log('📡 Database URL:', firebaseConfig.databaseURL);
console.log('📊 Monitoring path: /sensor');
console.log('🕐 Started at:', new Date().toLocaleString());
console.log('=' * 60);
console.log('');

// Function to display sensor data
function displaySensorData(data, isInitial = false) {
  const timestamp = new Date().toLocaleString();
  const updateType = isInitial ? '📥 INITIAL DATA' : '🔄 LIVE UPDATE';
  
  console.log(`\n${updateType} [${timestamp}]`);
  console.log('━'.repeat(60));
  
  if (!data) {
    console.log('❌ No sensor data available');
    return;
  }
  
  // Display sensor values with status indicators
  const getStatusIcon = (value, type) => {
    if (value === null || value === undefined) return '❓';
    if (type === 'nitrogen' || type === 'phosphorus' || type === 'potassium') {
      return value === -1 ? '⚪' : '🟢';
    }
    return '🟢';
  };
  
  console.log('🌡️  Soil Moisture: ', data.soilMoisture !== undefined ? `${data.soilMoisture}%` : 'N/A', getStatusIcon(data.soilMoisture));
  console.log('🧪 pH Level:      ', data.pH !== undefined ? data.pH : 'N/A', getStatusIcon(data.pH));
  console.log('🌿 NPK Level:     ', data.NPK !== undefined ? data.NPK : 'N/A', getStatusIcon(data.NPK));
  console.log('🍃 Nitrogen (N):  ', data.Nitrogen !== undefined ? (data.Nitrogen === -1 ? 'Not Set (-1)' : `${data.Nitrogen} ppm`) : 'N/A', getStatusIcon(data.Nitrogen, 'nitrogen'));
  console.log('💜 Phosphorus (P):', data.Phosphorus !== undefined ? (data.Phosphorus === -1 ? 'Not Set (-1)' : `${data.Phosphorus} ppm`) : 'N/A', getStatusIcon(data.Phosphorus, 'phosphorus'));
  console.log('🟡 Potassium (K): ', data.Potassium !== undefined ? (data.Potassium === -1 ? 'Not Set (-1)' : `${data.Potassium} ppm`) : 'N/A', getStatusIcon(data.Potassium, 'potassium'));
  
  // Additional metadata
  if (data.timestamp) {
    console.log('⏰ Timestamp:     ', new Date(data.timestamp).toLocaleString());
  }
  if (data.lastUpdated) {
    console.log('📅 Last Updated:  ', data.lastUpdated);
  }
  
  // Data health check
  const healthStatus = checkDataHealth(data);
  console.log('💊 Health Status: ', healthStatus.status, healthStatus.icon);
  if (healthStatus.issues.length > 0) {
    console.log('⚠️  Issues:');
    healthStatus.issues.forEach(issue => console.log(`   • ${issue}`));
  }
  
  console.log('━'.repeat(60));
}

// Function to check data health
function checkDataHealth(data) {
  const issues = [];
  let status = 'Good';
  let icon = '✅';
  
  if (!data) {
    return { status: 'No Data', icon: '❌', issues: ['No sensor data available'] };
  }
  
  // Check pH levels
  if (data.pH !== undefined && data.pH !== null) {
    if (data.pH < 6.0 || data.pH > 8.0) {
      issues.push(`pH level ${data.pH < 6.0 ? 'too low' : 'too high'}: ${data.pH}`);
      status = data.pH < 5.5 || data.pH > 8.5 ? 'Critical' : 'Warning';
      icon = data.pH < 5.5 || data.pH > 8.5 ? '🔴' : '🟡';
    }
  }
  
  // Check soil moisture
  if (data.soilMoisture !== undefined && data.soilMoisture !== null) {
    if (data.soilMoisture < 30) {
      issues.push(`Soil moisture low: ${data.soilMoisture}%`);
      status = data.soilMoisture < 20 ? 'Critical' : 'Warning';
      icon = data.soilMoisture < 20 ? '🔴' : '🟡';
    } else if (data.soilMoisture > 80) {
      issues.push(`Soil moisture high: ${data.soilMoisture}%`);
      status = 'Warning';
      icon = '🟡';
    }
  }
  
  // Check nutrient levels (if not -1)
  ['Nitrogen', 'Phosphorus', 'Potassium'].forEach(nutrient => {
    const value = data[nutrient];
    if (value !== undefined && value !== null && value !== -1) {
      const thresholds = { Nitrogen: 20, Phosphorus: 10, Potassium: 20 };
      if (value < thresholds[nutrient]) {
        issues.push(`${nutrient} low: ${value} ppm`);
        status = value < thresholds[nutrient] / 2 ? 'Critical' : 'Warning';
        icon = value < thresholds[nutrient] / 2 ? '🔴' : '🟡';
      }
    }
  });
  
  return { status, icon, issues };
}

// Start monitoring
function startRealtimeMonitoring() {
  console.log('🔍 Connecting to Firebase Realtime Database...');
  
  const sensorRef = ref(database, 'sensor');
  let isInitial = true;
  
  const unsubscribe = onValue(sensorRef, (snapshot) => {
    const data = snapshot.val();
    displaySensorData(data, isInitial);
    
    if (isInitial) {
      isInitial = false;
      console.log('\n🔄 Now listening for real-time updates...');
      console.log('💡 Tip: Change values in Firebase Console to see instant updates!');
      console.log('🌐 Firebase Console: https://console.firebase.google.com/project/sensor-data-f9ac2/database');
      console.log('⏹️  Press Ctrl+C to stop monitoring\n');
    }
  }, (error) => {
    console.error('❌ Error listening to database:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify Firebase project configuration');
    console.log('   3. Check Firebase Console for any issues');
    console.log('   4. Ensure database rules allow read access');
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n⏹️  Stopping Firebase monitor...');
    console.log('🔌 Unsubscribing from real-time updates...');
    unsubscribe();
    console.log('🕐 Stopped at:', new Date().toLocaleString());
    console.log('👋 Goodbye!');
    process.exit(0);
  });
}

// Check if Firebase SDK is available
try {
  startRealtimeMonitoring();
} catch (error) {
  console.error('❌ Firebase SDK not available:', error.message);
  console.log('\n💡 To use this script:');
  console.log('   1. Install Firebase SDK: npm install firebase');
  console.log('   2. Run: node firebase_realtime_monitor_sdk.js');
  console.log('\n🔄 Alternative: Use firebase_realtime_monitor.js (no dependencies required)');
}
