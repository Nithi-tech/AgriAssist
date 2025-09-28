/**
 * Fertilizer Recommendation System
 * Monitors soil nutrient levels and provides fertilizer recommendations
 */

export interface NutrientRange {
  min: number;
  max: number;
  fertilizers: string[];
}

export interface AlertMessage {
  nutrient: string;
  value: number;
  message: string;
  severity: 'low' | 'moderate' | 'critical';
  fertilizers: string[];
}

export interface NutrientLevels {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

// Nutrient ranges and recommended fertilizers
const NUTRIENT_RANGES: Record<string, NutrientRange> = {
  nitrogen: {
    min: 20,
    max: 50,
    fertilizers: ['Urea', 'Ammonium Nitrate', 'Ammonium Sulfate', 'Calcium Nitrate']
  },
  phosphorus: {
    min: 15,
    max: 30,
    fertilizers: ['Single Superphosphate', 'Triple Superphosphate', 'Monoammonium Phosphate', 'Diammonium Phosphate']
  },
  potassium: {
    min: 100,
    max: 200,
    fertilizers: ['Potassium Chloride', 'Potassium Sulfate', 'Potassium Nitrate', 'Sulfate of Potash Magnesia']
  }
};

/**
 * Check nutrient levels and return alerts for nutrients within alert ranges
 */
export function checkNutrientLevels(N: number, P: number, K: number): AlertMessage[] {
  const alerts: AlertMessage[] = [];
  const nutrients = { nitrogen: N, phosphorus: P, potassium: K };

  Object.entries(nutrients).forEach(([nutrientName, value]) => {
    const range = NUTRIENT_RANGES[nutrientName];
    
    if (value >= range.min && value <= range.max) {
      const severity = getSeverity(value, range);
      const alert: AlertMessage = {
        nutrient: capitalizeFirst(nutrientName),
        value,
        message: generateAlertMessage(nutrientName, value, range.fertilizers),
        severity,
        fertilizers: range.fertilizers
      };
      
      alerts.push(alert);
    }
  });

  return alerts;
}

/**
 * Determine severity based on position within the range
 */
function getSeverity(value: number, range: NutrientRange): 'low' | 'moderate' | 'critical' {
  const rangeSize = range.max - range.min;
  const position = (value - range.min) / rangeSize;
  
  if (position <= 0.33) return 'critical';
  if (position <= 0.66) return 'moderate';
  return 'low';
}

/**
 * Generate human-readable alert message
 */
function generateAlertMessage(nutrient: string, value: number, fertilizers: string[]): string {
  const nutrientName = capitalizeFirst(nutrient);
  const unit = nutrient === 'potassium' ? 'ppm' : nutrient === 'phosphorus' ? 'ppm (available P)' : 'ppm (mg/kg)';
  
  return `${nutrientName} is within the alert range (${value} ${unit}). Recommended fertilizers: ${fertilizers.join(', ')}.`;
}

/**
 * Capitalize first letter of a string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Extended function to check multiple sensor readings and get recommendations
 */
export function analyzeMultipleSensorReadings(readings: Array<{ nitrogen: number; phosphorus: number; potassium: number; recorded_at: string }>): {
  latestAlerts: AlertMessage[];
  trends: Record<string, 'improving' | 'declining' | 'stable'>;
  recommendations: string[];
} {
  if (readings.length === 0) {
    return { latestAlerts: [], trends: {}, recommendations: [] };
  }

  // Sort by date to get latest first
  const sortedReadings = readings.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
  const latest = sortedReadings[0];
  
  // Get alerts for latest reading
  const latestAlerts = checkNutrientLevels(latest.nitrogen, latest.phosphorus, latest.potassium);
  
  // Calculate trends if we have multiple readings
  const trends: Record<string, 'improving' | 'declining' | 'stable'> = {};
  if (sortedReadings.length >= 2) {
    const previous = sortedReadings[1];
    
    ['nitrogen', 'phosphorus', 'potassium'].forEach(nutrient => {
      const current = latest[nutrient as keyof typeof latest];
      const prev = previous[nutrient as keyof typeof previous];
      const change = current - prev;
      
      if (Math.abs(change) < 2) {
        trends[nutrient] = 'stable';
      } else if (change > 0) {
        trends[nutrient] = 'improving';
      } else {
        trends[nutrient] = 'declining';
      }
    });
  }
  
  // Generate general recommendations
  const recommendations: string[] = [];
  if (latestAlerts.length === 0) {
    recommendations.push('All nutrient levels are optimal. Continue current fertilization program.');
  } else {
    recommendations.push(`${latestAlerts.length} nutrient(s) require attention.`);
    
    if (latestAlerts.some(alert => alert.severity === 'critical')) {
      recommendations.push('Immediate fertilization recommended for critical nutrient levels.');
    }
  }
  
  return { latestAlerts, trends, recommendations };
}
