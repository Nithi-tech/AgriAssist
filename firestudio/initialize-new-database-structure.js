#!/usr/bin/env node

/**
 * Database Structure Migration Script
 * 
 * This script migrates your existing Firebase Realtime Database 
 * to the new schema structure:
 * 
 * {
 *   "alerts": {
 *     "animalDetection": "No animal detected"
 *   },
 *   "sensor": {
 *     "soilMoisture": 35,
 *     "pH": 6.15,
 *     "Nitrogen": 75,
 *     "Phosphorus": 18,
 *     "Potassium": 210
 *   }
 * }
 * 
 * Usage: node initialize-new-database-structure.js
 */

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set, remove } = require('firebase/database');

// Firebase configuration for sensor-data-f9ac2 project
const firebaseConfig = {
  apiKey: "AIzaSyDA3p5sH-HxjwlPNQoscdQNmQv-N3AGYOI",
  authDomain: "sensor-data-f9ac2.firebaseapp.com",
  databaseURL: "https://sensor-data-f9ac2-default-rtdb.firebaseio.com/",
  projectId: "sensor-data-f9ac2",
  storageBucket: "sensor-data-f9ac2.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
};

async function migrateDatabase() {
  console.log('🔥 Starting Database Structure Migration');
  console.log('=====================================\n');

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);

    // Step 1: Read existing sensor data
    console.log('📖 Reading existing sensor data...');
    const currentSensorRef = ref(database, 'sensor');
    const currentSnapshot = await get(currentSensorRef);
    const currentData = currentSnapshot.val();

    if (currentData) {
      console.log('✅ Current sensor data found:');
      console.log(JSON.stringify(currentData, null, 2));
    } else {
      console.log('⚠️  No existing sensor data found. Creating default structure...');
    }

    // Step 2: Create new structure
    console.log('\n🏗️  Creating new database structure...');

    // Create new sensor structure (removing NPK, keeping individual nutrients)
    const newSensorData = {
      soilMoisture: currentData?.soilMoisture || 35,
      pH: currentData?.pH || 6.15,
      Nitrogen: currentData?.Nitrogen || 75,
      Phosphorus: currentData?.Phosphorus || 18,
      Potassium: currentData?.Potassium || 210,
      timestamp: Date.now(),
      lastUpdated: new Date().toISOString()
    };

    // Create alerts structure
    const alertsData = {
      animalDetection: "No animal detected"
    };

    // Step 3: Write new structure
    console.log('💾 Writing new sensor structure...');
    const sensorRef = ref(database, 'sensor');
    await set(sensorRef, newSensorData);

    console.log('🚨 Writing alerts structure...');
    const alertsRef = ref(database, 'alerts');
    await set(alertsRef, alertsData);

    // Step 4: Remove old NPK field if it exists
    if (currentData?.NPK !== undefined) {
      console.log('🗑️  Removing deprecated NPK field...');
      const npkRef = ref(database, 'sensor/NPK');
      await remove(npkRef);
    }

    // Step 5: Verify new structure
    console.log('\n🔍 Verifying new database structure...');
    const rootRef = ref(database, '/');
    const newSnapshot = await get(rootRef);
    const newStructure = newSnapshot.val();

    console.log('✅ New database structure:');
    console.log(JSON.stringify(newStructure, null, 2));

    // Step 6: Validation
    console.log('\n✨ Migration Validation:');
    
    if (newStructure.sensor && newStructure.alerts) {
      console.log('✅ Both "sensor" and "alerts" nodes exist');
    } else {
      console.log('❌ Missing required nodes');
      return;
    }

    if (newStructure.sensor.soilMoisture !== undefined && 
        newStructure.sensor.pH !== undefined &&
        newStructure.sensor.Nitrogen !== undefined &&
        newStructure.sensor.Phosphorus !== undefined &&
        newStructure.sensor.Potassium !== undefined) {
      console.log('✅ All required sensor fields exist');
    } else {
      console.log('❌ Missing sensor fields');
      return;
    }

    if (newStructure.alerts.animalDetection !== undefined) {
      console.log('✅ Animal detection alert field exists');
    } else {
      console.log('❌ Missing animal detection field');
      return;
    }

    if (newStructure.sensor.NPK === undefined) {
      console.log('✅ Deprecated NPK field successfully removed');
    } else {
      console.log('⚠️  NPK field still exists (will be calculated dynamically)');
    }

    console.log('\n🎉 DATABASE MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('=====================================');
    console.log('📱 Your React app will now work with the new structure');
    console.log('🔄 Sensor data will continue to update in real-time');
    console.log('🚨 Alerts will be stored under /alerts/animalDetection');
    console.log('🧮 NPK values will be calculated automatically from N+P+K');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('🔧 Check your Firebase configuration and network connection');
    process.exit(1);
  }
}

// Run migration
migrateDatabase().then(() => {
  console.log('\n✅ Migration script completed');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Migration script failed:', error);
  process.exit(1);
});
