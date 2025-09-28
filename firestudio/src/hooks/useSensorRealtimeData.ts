'use client';

import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, off, DatabaseReference } from 'firebase/database';
import { sensorRealtimeDatabase } from '@/lib/sensorRealtimeFirebase';
import { 
  SensorRealtimeData, 
  SensorRealtimeDashboardData,
  DEFAULT_SENSOR_THRESHOLDS,
  SensorRealtimeValueStatus 
} from '@/types/sensorRealtimeTypes';

export function useSensorRealtimeData() {
  const [dashboardData, setDashboardData] = useState<SensorRealtimeDashboardData>({
    sensorData: null,
    status: {
      isConnected: false,
      lastUpdate: null,
      error: null
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // Helper function to determine value status
  const getValueStatus = useCallback((value: number, parameter: keyof typeof DEFAULT_SENSOR_THRESHOLDS): SensorRealtimeValueStatus => {
    const threshold = DEFAULT_SENSOR_THRESHOLDS[parameter];
    
    if (value >= threshold.optimal.min && value <= threshold.optimal.max) {
      return 'optimal';
    } else if (value >= threshold.min && value <= threshold.max) {
      return 'warning';
    } else {
      return 'critical';
    }
  }, []);

  useEffect(() => {
    let sensorDataRef: DatabaseReference;
    let unsubscribe: (() => void) | null = null;
    
    const initializeRealtimeListener = () => {
      try {
        console.log('🔧 Initializing sensor Firebase connection...');
        console.log('🌐 Database URL:', 'https://realtime-60c4a-default-rtdb.firebaseio.com');
        
        // Reference to the SensorData node
        sensorDataRef = ref(sensorRealtimeDatabase, 'SensorData');
        
        console.log('🔄 Setting up real-time sensor data listener...');
        console.log('📡 Connecting to path: SensorData');
        
        // Set up real-time listener
        unsubscribe = onValue(
          sensorDataRef,
          (snapshot) => {
            console.log('📨 Received data snapshot');
            setIsLoading(false);
            
            if (snapshot.exists()) {
              const data = snapshot.val() as SensorRealtimeData;
              
              console.log('📡 Real-time sensor data received:', data);
              
              // Validate data structure
              if (data && typeof data === 'object' && 
                  typeof data.Nitrogen === 'number' &&
                  typeof data.Phosphorus === 'number' &&
                  typeof data.Potassium === 'number' &&
                  typeof data.pH === 'number' &&
                  typeof data.soilMoisture === 'number') {
                
                setDashboardData({
                  sensorData: data,
                  status: {
                    isConnected: true,
                    lastUpdate: data.lastUpdated || new Date().toISOString(),
                    error: null
                  }
                });
              } else {
                console.warn('⚠️ Invalid data structure received:', data);
                setDashboardData({
                  sensorData: null,
                  status: {
                    isConnected: true,
                    lastUpdate: null,
                    error: 'Invalid sensor data format'
                  }
                });
              }
            } else {
              console.log('⚠️ No sensor data found in SensorData node');
              setDashboardData({
                sensorData: null,
                status: {
                  isConnected: true,
                  lastUpdate: null,
                  error: 'No sensor data available - waiting for first data push'
                }
              });
            }
          },
          (error) => {
            console.error('❌ Error reading sensor data:', error);
            console.error('❌ Error code:', error.code);
            console.error('❌ Error message:', error.message);
            setIsLoading(false);
            setDashboardData({
              sensorData: null,
              status: {
                isConnected: false,
                lastUpdate: null,
                error: `Connection failed: ${error.message}`
              }
            });
          }
        );

        console.log('✅ Real-time sensor data listener established');
      } catch (error) {
        console.error('❌ Failed to initialize sensor listener:', error);
        setIsLoading(false);
        setDashboardData({
          sensorData: null,
          status: {
            isConnected: false,
            lastUpdate: null,
            error: `Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        });
      }
    };

    initializeRealtimeListener();
    
    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
        console.log('🔌 Sensor data listener disconnected');
      }
    };
  }, []);

  const refresh = useCallback(() => {
    console.log('🔄 Refreshing sensor data connection...');
    setIsLoading(true);
    // For real-time data, refresh happens automatically through the listener
  }, []);

  return {
    ...dashboardData,
    isLoading,
    refresh,
    getValueStatus
  };
}
