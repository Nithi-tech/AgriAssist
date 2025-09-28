/**
 * Types for Fertilizer Recommendation System
 */

export interface NutrientRange {
  min: number;
  max: number;
}

export interface FertilizerRecommendation {
  nutrient: 'Nitrogen' | 'Phosphorus' | 'Potassium';
  value: number;
  range: NutrientRange;
  status: 'low' | 'optimal' | 'high' | 'critical';
  message: string;
  fertilizers: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface NutrientReading {
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  timestamp: string;
  deviceId: string;
  cropId?: string | null;
}

export interface NutrientAlert {
  id: string;
  nutrient: string;
  value: number;
  message: string;
  fertilizers: string[];
  severity: 'info' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export interface FertilizerConfig {
  nitrogen: {
    alertRange: NutrientRange;
    optimalRange: NutrientRange;
    fertilizers: string[];
  };
  phosphorus: {
    alertRange: NutrientRange;
    optimalRange: NutrientRange;
    fertilizers: string[];
  };
  potassium: {
    alertRange: NutrientRange;
    optimalRange: NutrientRange;
    fertilizers: string[];
  };
  pollingIntervalMs: number;
  enableRealTimeMonitoring: boolean;
}

export interface MonitoringStatus {
  isActive: boolean;
  lastCheck: string;
  nextCheck: string;
  alertsGenerated: number;
  devicesMonitored: string[];
}
