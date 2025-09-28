// Quick Node.js test for Firebase Realtime Database
const https = require('https');

const FIREBASE_URL = 'https://sensor-data-f9ac2-default-rtdb.firebaseio.com/sensor.json?auth=sljFmt8YWrExo6AiEiFQJD8lDuNnH5aX1M7t8AyF';

const testData = {
  NPK: 100,
  Nitrogen: 30,
  Phosphorus: 20,
  Potassium: 25,
  pH: 7.0,
  soilMoisture: 50,
  timestamp: Date.now(),
  lastUpdated: new Date().toISOString(),
  testMode: true
};

console.log('🧪 Testing Firebase Realtime Database Connection...');
console.log('📡 Database URL: https://sensor-data-f9ac2-default-rtdb.firebaseio.com/');

const url = new URL(FIREBASE_URL);
const postData = JSON.stringify(testData);

const options = {
  hostname: url.hostname,
  path: url.pathname + url.search,
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Firebase connection successful!');
      console.log('📤 Data sent:', testData);
      console.log('📥 Response:', JSON.parse(data));
      console.log('\n🎉 Integration is working!');
      console.log('💡 Next steps:');
      console.log('   1. Start your Next.js app: npm run dev');
      console.log('   2. Visit: http://localhost:3000/sensor-dashboard');
      console.log('   3. Check Firebase Console: https://console.firebase.google.com/project/sensor-data-f9ac2/database');
    } else {
      console.log('❌ Firebase connection failed');
      console.log('Status Code:', res.statusCode);
      console.log('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.log('\n💡 Troubleshooting:');
  console.log('   1. Check internet connection');
  console.log('   2. Verify Firebase project ID: sensor-data-f9ac2');
  console.log('   3. Confirm database secret is correct');
});

req.write(postData);
req.end();
