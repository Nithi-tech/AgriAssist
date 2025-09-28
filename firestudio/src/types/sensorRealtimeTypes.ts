// Type definitions for sensor realtime data
export interface SensorRealtimeData {
  Nitrogen: number;
  Phosphorus: number;
  Potassium: number;
  lastUpdated: string;
  pH: number;
  soilMoisture: number;
  timestamp: number;
}

export interface SensorRealtimeStatus {
  isConnected: boolean;
  lastUpdate: string | null;
  error: string | null;
}

export interface SensorRealtimeDashboardData {
  sensorData: SensorRealtimeData | null;
  status: SensorRealtimeStatus;
}

// Thresholds for sensor values to show status indicators
export interface SensorRealtimeThresholds {
  pH: { min: number; max: number; optimal: { min: number; max: number } };
  soilMoisture: { min: number; max: number; optimal: { min: number; max: number } };
  Nitrogen: { min: number; max: number; optimal: { min: number; max: number } };
  Phosphorus: { min: number; max: number; optimal: { min: number; max: number } };
  Potassium: { min: number; max: number; optimal: { min: number; max: number } };
}

export const DEFAULT_SENSOR_THRESHOLDS: SensorRealtimeThresholds = {
  pH: { 
    min: 0, 
    max: 14, 
    optimal: { min: 6.0, max: 7.5 } 
  },
  soilMoisture: { 
    min: 0, 
    max: 100, 
    optimal: { min: 40, max: 70 } 
  },
  Nitrogen: { 
    min: 0, 
    max: 200, 
    optimal: { min: 50, max: 150 } 
  },
  Phosphorus: { 
    min: 0, 
    max: 100, 
    optimal: { min: 20, max: 60 } 
  },
  Potassium: { 
    min: 0, 
    max: 300, 
    optimal: { min: 100, max: 200 } 
  }
};

export type SensorRealtimeValueStatus = 'optimal' | 'warning' | 'critical';
