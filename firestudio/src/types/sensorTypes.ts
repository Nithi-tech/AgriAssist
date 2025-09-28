// /src/types/sensorTypes.ts

export interface SensorData {
  NPK: number;
  Nitrogen: number;
  Phosphorus: number;
  Potassium: number;
  pH: number;
  soilMoisture: number;
  timestamp?: number;
  lastUpdated?: string;
}

export interface SensorThresholds {
  soilMoisture: {
    low: number;
    high: number;
  };
  pH: {
    low: number;
    high: number;
  };
  nutrients: {
    low: number;
    high: number;
  };
}

export interface SensorStatus {
  value: number;
  status: 'optimal' | 'warning' | 'critical';
  color: 'green' | 'yellow' | 'red';
  message: string;
}
