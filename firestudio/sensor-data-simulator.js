// Node.js script to simulate sensor data and push to Firebase
// Run with: node sensor-data-simulator.js

const https = require('https');

// Your API endpoint
const API_URL = 'http://localhost:3000/api/sensor-realtime';

// Function to generate realistic sensor data
function generateSensorData() {
  return {
    Nitrogen: Math.round(Math.random() * 100 + 50), // 50-150 mg/kg
    Phosphorus: Math.round(Math.random() * 60 + 20), // 20-80 mg/kg
    Potassium: Math.round(Math.random() * 200 + 100), // 100-300 mg/kg
    pH: Math.round((Math.random() * 4 + 5) * 100) / 100, // 5.0-9.0
    soilMoisture: Math.round((Math.random() * 60 + 20) * 10) / 10 // 20-80%
  };
}

// Function to send data to API
async function sendSensorData(data) {
  const postData = JSON.stringify(data);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/sensor-realtime',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Main simulation function
async function simulateSensorData() {
  console.log('🚀 Starting sensor data simulation...');
  console.log('📡 Sending data to:', API_URL);
  console.log('⏰ Data will be sent every 10 seconds');
  console.log('Press Ctrl+C to stop\n');

  let count = 0;
  
  const interval = setInterval(async () => {
    try {
      const sensorData = generateSensorData();
      console.log(`\n📊 Sending sensor data #${++count}:`);
      console.log(JSON.stringify(sensorData, null, 2));
      
      const response = await sendSensorData(sensorData);
      console.log('✅ Response:', response.message);
      
    } catch (error) {
      console.error('❌ Error sending sensor data:', error.message);
    }
  }, 10000); // Send every 10 seconds

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping sensor simulation...');
    clearInterval(interval);
    process.exit(0);
  });
}

// Start simulation if this script is run directly
if (require.main === module) {
  simulateSensorData();
}

module.exports = { generateSensorData, sendSensorData };
