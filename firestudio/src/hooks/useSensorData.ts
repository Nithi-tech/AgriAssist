// Clean sensor data hook - connects only to the specified Firebase Realtime Database
'use client';

import { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, off, DatabaseReference } from 'firebase/database';
import { SensorData } from '@/types/sensorTypes';

// Firebase configuration for sensor database - using correct project
const sensorFirebaseConfig = {
  apiKey: "AIzaSyAXM6jW_0zvaKhzY-DND2dguaJch6vyRJg",
  authDomain: "realtime-60c4a.firebaseapp.com",
  databaseURL: "https://realtime-60c4a-default-rtdb.firebaseio.com/",
  projectId: "realtime-60c4a",
  storageBucket: "realtime-60c4a.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

export const useSensorData = () => {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    let database: any = null;
    let sensorRef: DatabaseReference | null = null;
    let unsubscribe: (() => void) | null = null;

    const initFirebase = async () => {
      try {
        console.log('🔥 Initializing sensor Firebase:', sensorFirebaseConfig.databaseURL);
        
        // Initialize Firebase app for sensor data only
        let app;
        const existingApps = getApps();
        const sensorApp = existingApps.find(app => app.name === 'sensor-realtime-app');
        
        if (sensorApp) {
          app = sensorApp;
          console.log('📱 Using existing sensor app instance');
        } else {
          app = initializeApp(sensorFirebaseConfig, 'sensor-realtime-app');
          console.log('📱 Created new sensor app instance');
        }

        database = getDatabase(app);
        sensorRef = ref(database, 'SensorData');
        
        console.log('🔗 Setting up real-time listener for path: /SensorData');

        // Set up real-time listener
        unsubscribe = onValue(sensorRef, (snapshot) => {
          const data = snapshot.val();
          console.log('📊 Raw Firebase data received:', data);
          
          if (data) {
            console.log('📊 Processing sensor data:', data);
            
            // Calculate NPK from individual values
            const npkValue = (data.Nitrogen || 0) + (data.Phosphorus || 0) + (data.Potassium || 0);
            
            setSensorData({
              NPK: npkValue,
              Nitrogen: data.Nitrogen || 0,
              Phosphorus: data.Phosphorus || 0,
              Potassium: data.Potassium || 0,
              pH: data.pH || 0,
              soilMoisture: data.soilMoisture || 0,
              timestamp: data.timestamp || Date.now(),
              lastUpdated: data.lastUpdated || new Date().toISOString()
            });
            
            setIsConnected(true);
            setLastUpdate(new Date());
            setError(null);
            console.log('✅ Sensor data updated successfully');
          } else {
            console.warn('⚠️ No sensor data available in Firebase');
            setError('No sensor data available');
          }
          
          setLoading(false);
        }, (error) => {
          console.error('❌ Firebase sensor error:', error);
          setError(`Firebase connection failed: ${error.message}`);
          setIsConnected(false);
          setLoading(false);
        });

      } catch (err: any) {
        console.error('❌ Firebase initialization error:', err);
        setError(`Failed to initialize Firebase: ${err.message}`);
        setIsConnected(false);
        setLoading(false);
      }
    };

    initFirebase();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (sensorRef) {
        off(sensorRef);
      }
    };
  }, []);

  return {
    sensorData,
    loading,
    error,
    isConnected,
    lastUpdate
  };
};
