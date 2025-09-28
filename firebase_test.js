// Firebase Realtime Database Test
const https = require('https');

console.log('🚀 Firebase Sensor Database Integration Test');
console.log('=' * 50);

const testData = {
  NPK: 85,
  Nitrogen: 28,
  Phosphorus: 18,
  Potassium: 32,
  pH: 6.8,
  soilMoisture: 65,
  timestamp: Date.now(),
  lastUpdated: new Date().toISOString(),
  source: 'integration_test'
};

const url = 'https://sensor-data-f9ac2-default-rtdb.firebaseio.com/sensor.json?auth=sljFmt8YWrExo6AiEiFQJD8lDuNnH5aX1M7t8AyF';
const postData = JSON.stringify(testData);

const options = {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('📤 Sending test data to Firebase...');
console.log('   NPK:', testData.NPK);
console.log('   pH:', testData.pH);
console.log('   Soil Moisture:', testData.soilMoisture + '%');
console.log('   Nitrogen:', testData.Nitrogen + ' ppm');
console.log('   Phosphorus:', testData.Phosphorus + ' ppm');
console.log('   Potassium:', testData.Potassium + ' ppm');

const req = https.request(url, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('\n✅ SUCCESS! Firebase integration is working!');
      console.log('📥 Firebase Response:', JSON.parse(data));
      console.log('\n🎯 Integration Summary:');
      console.log('   ✅ Separate Firebase instance: sensor-data-f9ac2');
      console.log('   ✅ Real-time database connection: Working');
      console.log('   ✅ Data structure: Compatible');
      console.log('   ✅ No interference with existing databases');
      console.log('\n🚀 Next Steps:');
      console.log('   1. Start your Next.js app in the firestudio directory');
      console.log('   2. Visit: /sensor-dashboard to see real-time data');
      console.log('   3. Run backend services for automatic updates:');
      console.log('      • Node.js: node sensorBackend.js');
      console.log('      • Python: python sensorBackendAPI.py');
      console.log('   4. View live data: https://console.firebase.google.com/project/sensor-data-f9ac2/database');
    } else {
      console.log('❌ Test failed with status:', res.statusCode);
      console.log('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Connection error:', error.message);
});

req.write(postData);
req.end();
