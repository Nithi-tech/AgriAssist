// lib/sensorService.ts
import mockSensorData from '@/data/mock/sensor_data.json';

interface SensorReading {
  id: number;
  device_token: string;
  crop_id: string;
  timestamp: string;
  ph: number;
  soil_moisture: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  humidity: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  device_id: string;
  timestamp: string;
  value: number;
  threshold: number;
}

class SensorService {
  private data: SensorReading[] = mockSensorData;

  async getActiveAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const latestReadings = await this.getLatestReadings();

    latestReadings.forEach((reading: SensorReading) => {
      // pH alerts
      if (reading.ph < 6.0 || reading.ph > 8.0) {
        alerts.push({
          id: `ph_${reading.id}_${Date.now()}`,
          type: reading.ph < 5.5 || reading.ph > 8.5 ? 'critical' : 'warning',
          message: `pH level ${reading.ph.toFixed(1)} is ${reading.ph < 6.0 ? 'too low' : 'too high'}`,
          device_id: reading.device_token,
          timestamp: reading.timestamp,
          value: reading.ph,
          threshold: reading.ph < 6.0 ? 6.0 : 8.0
        });
      }

      // Moisture alerts
      if (reading.soil_moisture < 30 || reading.soil_moisture > 80) {
        alerts.push({
          id: `moisture_${reading.id}_${Date.now()}`,
          type: reading.soil_moisture < 20 || reading.soil_moisture > 90 ? 'critical' : 'warning',
          message: `Soil moisture ${reading.soil_moisture}% is ${reading.soil_moisture < 30 ? 'too low' : 'too high'}`,
          device_id: reading.device_token,
          timestamp: reading.timestamp,
          value: reading.soil_moisture,
          threshold: reading.soil_moisture < 30 ? 30 : 80
        });
      }

      // Nitrogen alerts
      if (reading.nitrogen < 20) {
        alerts.push({
          id: `nitrogen_${reading.id}_${Date.now()}`,
          type: reading.nitrogen < 10 ? 'critical' : 'warning',
          message: `Nitrogen level ${reading.nitrogen}ppm is too low`,
          device_id: reading.device_token,
          timestamp: reading.timestamp,
          value: reading.nitrogen,
          threshold: 20
        });
      }
    });

    return alerts;
  }

  async getLatestReadings(limit: number = 10): Promise<SensorReading[]> {
    return this.data
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async getReadingsByDevice(deviceId: string): Promise<SensorReading[]> {
    return this.data.filter(reading => reading.device_token === deviceId);
  }

  async addReading(reading: Omit<SensorReading, 'id'>): Promise<SensorReading> {
    const newReading: SensorReading = {
      ...reading,
      id: Math.max(...this.data.map(r => r.id)) + 1
    };
    
    this.data.push(newReading);
    return newReading;
  }
}

export const sensorService = new SensorService();
