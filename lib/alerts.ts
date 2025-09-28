// lib/alerts.ts
import { SensorReading } from './firebase';

export interface AlertMessages {
  ph?: string;
  moisture?: string;
  npk?: string;
}

/**
 * Check sensor readings against optimal thresholds and return alert messages
 * @param reading - Sensor reading data
 * @returns Object containing alert messages for each parameter that's out of range
 */
export function checkAlerts(reading: SensorReading): AlertMessages {
  const alerts: AlertMessages = {};

  // pH threshold check: optimal range 5.5-7.5
  if (reading.ph < 5.5 || reading.ph > 7.5) {
    alerts.ph = "Soil pH is out of optimal range.";
  }

  // Moisture threshold check: minimum 30%
  if (reading.moisture < 30) {
    alerts.moisture = "Soil is too dry, consider irrigation.";
  }

  // NPK threshold check: minimum 10 for each nutrient
  if (reading.npk.n < 10 || reading.npk.p < 10 || reading.npk.k < 10) {
    alerts.npk = "Nutrient deficiency detected, apply fertilizer.";
  }

  return alerts;
}

/**
 * Get alert severity level based on how many alerts are active
 * @param alerts - Alert messages object
 * @returns Severity level: 'none' | 'low' | 'medium' | 'high'
 */
export function getAlertSeverity(alerts: AlertMessages): 'none' | 'low' | 'medium' | 'high' {
  const alertCount = Object.keys(alerts).length;
  
  if (alertCount === 0) return 'none';
  if (alertCount === 1) return 'low';
  if (alertCount === 2) return 'medium';
  return 'high';
}
