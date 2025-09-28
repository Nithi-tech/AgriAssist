// Test script to manually push sensor data to the API
// Run with: node test-sensor-push.js

const http = require('http');

// Test data matching your required structure
const testSensorData = {
  Nitrogen: 94,
  Phosphorus: 44,
  Potassium: 163,
  pH: 7.87,
  soilMoisture: 44.5
};

const postData = JSON.stringify(testSensorData);

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/sensor-realtime',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚀 Testing sensor data push...');
console.log('📊 Sending data:', JSON.stringify(testSensorData, null, 2));

const req = http.request(options, (res) => {
  let responseData = '';
  
  console.log(`📡 Status Code: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(responseData);
      console.log('✅ Response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('\n🎉 Data successfully pushed to Firebase!');
        console.log('🔗 You can now view it in your dashboard at: http://localhost:3001/sensor-realtime');
      } else {
        console.log('\n❌ Failed to push data:', response.error);
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error);
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
  console.log('\n💡 Make sure your Next.js app is running on http://localhost:3001');
});

req.write(postData);
req.end();
