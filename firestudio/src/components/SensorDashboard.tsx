// /src/components/SensorDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Droplets, FlaskConical, Leaf, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { SensorData } from '@/types/sensorTypes';

// Import the real Firebase sensor hook
import { useSensorRealtimeData } from '@/hooks/useSensorRealtimeData';

interface SensorDashboardProps {
  showMockControls?: boolean;
}

// Convert Firebase sensor data to our SensorData format
const convertFirebaseToSensorData = (firebaseData: any): SensorData | null => {
  if (!firebaseData) return null;
  
  return {
    NPK: firebaseData.Nitrogen + firebaseData.Phosphorus + firebaseData.Potassium,
    Nitrogen: firebaseData.Nitrogen,
    Phosphorus: firebaseData.Phosphorus,
    Potassium: firebaseData.Potassium,
    pH: firebaseData.pH,
    soilMoisture: firebaseData.soilMoisture,
    timestamp: new Date(firebaseData.lastUpdated || Date.now()).getTime(),
    lastUpdated: firebaseData.lastUpdated
  };
};

// Mock sensor data for UI display
const generateMockSensorData = (): SensorData => {
  return {
    NPK: Math.round(Math.random() * 200 + 200), // 200-400
    Nitrogen: Math.round(Math.random() * 50 + 50), // 50-100 mg/kg
    Phosphorus: Math.round(Math.random() * 30 + 15), // 15-45 mg/kg
    Potassium: Math.round(Math.random() * 100 + 150), // 150-250 mg/kg
    pH: Math.round((Math.random() * 2 + 6) * 100) / 100, // 6.0-8.0
    soilMoisture: Math.round((Math.random() * 40 + 30) * 10) / 10, // 30-70%
    timestamp: Date.now(),
    lastUpdated: new Date().toISOString()
  };
};

// Sensor thresholds for color coding
const THRESHOLDS = {
  soilMoisture: { low: 30, high: 60 },
  pH: { low: 5.5, high: 7.5 },
  nutrients: { low: 20, high: 40 }
};

// Get color class based on sensor value and type
const getSensorColor = (value: number, type: string): { bg: string, text: string, status: string } => {
  let isGood = false;
  let isWarning = false;
  
  switch (type) {
    case 'soilMoisture':
      isGood = value > THRESHOLDS.soilMoisture.high;
      isWarning = value >= THRESHOLDS.soilMoisture.low && value <= THRESHOLDS.soilMoisture.high;
      break;
    case 'pH':
      isGood = value >= THRESHOLDS.pH.low && value <= THRESHOLDS.pH.high;
      isWarning = value > THRESHOLDS.pH.high && value <= 8.5;
      break;
    case 'nutrients':
      isGood = value > THRESHOLDS.nutrients.high;
      isWarning = value >= THRESHOLDS.nutrients.low && value <= THRESHOLDS.nutrients.high;
      break;
  }
  
  if (isGood) {
    return {
      bg: 'bg-green-100 border-green-300',
      text: 'text-green-800',
      status: 'Optimal'
    };
  } else if (isWarning) {
    return {
      bg: 'bg-yellow-100 border-yellow-300',
      text: 'text-yellow-800',
      status: 'Warning'
    };
  } else {
    return {
      bg: 'bg-red-100 border-red-300',
      text: 'text-red-800',
      status: 'Critical'
    };
  }
};

// Individual sensor card component
const SensorCard: React.FC<{
  title: string;
  value: number;
  unit: string;
  icon: string;
  type: string;
}> = ({ title, value, unit, icon, type }) => {
  const colorClasses = getSensorColor(value, type);
  
  return (
    <Card className={`${colorClasses.bg} border-2 transition-all duration-300 hover:shadow-lg`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm font-medium ${colorClasses.text} flex items-center gap-2`}>
          <span className="text-lg">{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className={`text-2xl font-bold ${colorClasses.text}`}>
              {value >= 0 ? value : '--'}
              <span className="text-sm font-normal ml-1">{unit}</span>
            </div>
            <Badge 
              variant="secondary" 
              className={`mt-1 text-xs ${colorClasses.text} ${colorClasses.bg}`}
            >
              {colorClasses.status}
            </Badge>
          </div>
          <div className={`w-12 h-12 rounded-full ${colorClasses.bg} flex items-center justify-center`}>
            <div className={`w-8 h-8 rounded-full ${
              colorClasses.status === 'Optimal' ? 'bg-green-500' :
              colorClasses.status === 'Warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main sensor dashboard component
const SensorDashboard: React.FC<SensorDashboardProps> = ({ 
  showMockControls = false 
}) => {
  // Use the Firebase sensor hook
  const { sensorData: firebaseSensorData, status, isLoading, refresh } = useSensorRealtimeData();
  
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Update sensor data when Firebase data changes
  useEffect(() => {
    setLoading(isLoading);
    setIsConnected(status.isConnected);
    setError(status.error);
    
    if (firebaseSensorData) {
      const convertedData = convertFirebaseToSensorData(firebaseSensorData);
      setSensorData(convertedData);
    } else {
      setSensorData(null);
    }
  }, [firebaseSensorData, status, isLoading]);

  if (loading) {
    return (
      <div className="w-full mb-8">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <span className="animate-spin">🔄</span>
              Real-time Sensor Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="animate-pulse bg-gray-100">
                  <CardHeader className="pb-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mb-8">
        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              ⚠️ Sensor Connection Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <p className="text-sm text-red-500 mt-2">
              Check your Firebase connection and try refreshing the page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full mb-8">
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-green-800 flex items-center gap-2">
              🌾 Real-time Sensor Data
            </CardTitle>
            <Badge 
              variant="secondary"
              className="flex items-center gap-1 bg-green-100 text-green-700"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </Badge>
          </div>
          <p className="text-sm text-green-600">
            Real-time sensor data from Firebase Realtime Database
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <SensorCard
              title="Soil Moisture"
              value={sensorData?.soilMoisture || 0}
              unit="%"
              icon="💧"
              type="soilMoisture"
            />
            <SensorCard
              title="pH Level"
              value={sensorData?.pH || 0}
              unit=""
              icon="⚗️"
              type="pH"
            />
            <SensorCard
              title="Nitrogen"
              value={sensorData?.Nitrogen || 0}
              unit="mg/kg"
              icon="🌿"
              type="nutrients"
            />
            <SensorCard
              title="Phosphorus"
              value={sensorData?.Phosphorus || 0}
              unit="mg/kg"
              icon="🌿"
              type="nutrients"
            />
            <SensorCard
              title="Potassium"
              value={sensorData?.Potassium || 0}
              unit="mg/kg"
              icon="🌿"
              type="nutrients"
            />
          </div>
          
          {/* Sensor Suggestion Cards - Farmer-Friendly Version */}
          {sensorData && (
            <div className="mt-6 space-y-4">
              {/* Moisture Sensor Suggestions */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-5 shadow-lg">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  💧 Water Your Crops
                </h4>
                {(() => {
                  const moistureLevel = sensorData.soilMoisture;
                  if (moistureLevel > THRESHOLDS.soilMoisture.high) {
                    return (
                      <div className="flex items-center justify-between p-4 bg-green-100 border-2 border-green-300 rounded-xl">
                        <div className="flex-1">
                          <p className="text-green-900 font-bold text-lg">🌾 Soil has enough water!</p>
                          <p className="text-green-700 text-sm mt-1">No need to water now</p>
                          <p className="text-green-600 text-xs mt-1 italic">
                            மண்ணில் போதுமான நீர் உள்ளது | मिट्टी में पर्याप्त पानी है
                          </p>
                        </div>
                        <Button disabled className="ml-4 bg-gray-400 text-white cursor-not-allowed px-6 py-2 rounded-lg">
                          💧 Water OFF
                        </Button>
                      </div>
                    );
                  } else if (moistureLevel >= THRESHOLDS.soilMoisture.low) {
                    return (
                      <div className="flex items-center justify-between p-4 bg-yellow-100 border-2 border-yellow-400 rounded-xl">
                        <div className="flex-1">
                          <p className="text-yellow-900 font-bold text-lg">⚠️ Soil needs water soon</p>
                          <p className="text-yellow-700 text-sm mt-1">Start watering your crops</p>
                          <p className="text-yellow-600 text-xs mt-1 italic">
                            விரைவில் நீர் பாய்ச்சவும் | जल्द पानी दें
                          </p>
                        </div>
                        <Button className="ml-4 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold">
                          💧 Start Water
                        </Button>
                      </div>
                    );
                  } else {
                    return (
                      <div className="flex items-center justify-between p-4 bg-red-100 border-2 border-red-400 rounded-xl">
                        <div className="flex-1">
                          <p className="text-red-900 font-bold text-lg">🚨 Soil is very dry!</p>
                          <p className="text-red-700 text-sm mt-1">Water immediately to save crops</p>
                          <p className="text-red-600 text-xs mt-1 italic">
                            உடனே நீர் பாய்ச்சவும் | तुरंत पानी दें
                          </p>
                        </div>
                        <Button className="ml-4 bg-red-600 hover:bg-red-700 text-white animate-pulse px-6 py-2 rounded-lg font-bold">
                          💧 WATER NOW!
                        </Button>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* NPK Sensor Suggestions */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-5 shadow-lg">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  🌱 Feed Your Plants
                </h4>
                <div className="space-y-3">
                  {(() => {
                    const suggestions = [];
                    const { Nitrogen, Phosphorus, Potassium } = sensorData;
                    
                    // Nitrogen check
                    if (Nitrogen < THRESHOLDS.nutrients.low) {
                      suggestions.push(
                        <div key="nitrogen" className="p-4 bg-blue-100 border-2 border-blue-300 rounded-xl">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🌿</span>
                            <div>
                              <p className="text-blue-900 font-bold">Use Urea fertilizer</p>
                              <p className="text-blue-700 text-sm">For green leaves and growth</p>
                              <p className="text-blue-600 text-xs italic">
                                யூரியா உரம் இடவும் | यूरिया खाद डालें
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Phosphorus check
                    if (Phosphorus < THRESHOLDS.nutrients.low) {
                      suggestions.push(
                        <div key="phosphorus" className="p-4 bg-purple-100 border-2 border-purple-300 rounded-xl">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🌸</span>
                            <div>
                              <p className="text-purple-900 font-bold">Use DAP fertilizer</p>
                              <p className="text-purple-700 text-sm">For strong roots and flowers</p>
                              <p className="text-purple-600 text-xs italic">
                                டிஏபி உரம் இடவும் | डीएपी खाद डालें
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Potassium check
                    if (Potassium < THRESHOLDS.nutrients.low) {
                      suggestions.push(
                        <div key="potassium" className="p-4 bg-orange-100 border-2 border-orange-300 rounded-xl">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🍎</span>
                            <div>
                              <p className="text-orange-900 font-bold">Use MOP fertilizer</p>
                              <p className="text-orange-700 text-sm">For better fruits and disease resistance</p>
                              <p className="text-orange-600 text-xs italic">
                                எம்ஓபி உரம் இடவும் | एमओपी खाद डालें
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // All sufficient
                    if (suggestions.length === 0) {
                      suggestions.push(
                        <div key="sufficient" className="p-4 bg-green-100 border-2 border-green-300 rounded-xl">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">✅</span>
                            <div>
                              <p className="text-green-900 font-bold">Plants are well fed!</p>
                              <p className="text-green-700 text-sm">No fertilizer needed now</p>
                              <p className="text-green-600 text-xs italic">
                                தாவரங்கள் நன்றாக உள்ளன | पौधे स्वस्थ हैं
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return suggestions;
                  })()}
                </div>
              </div>

              {/* pH Sensor Suggestions */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-5 shadow-lg">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  🧪 Fix Soil Health
                </h4>
                {(() => {
                  const phLevel = sensorData.pH;
                  if (phLevel < 6) {
                    return (
                      <div className="p-4 bg-red-100 border-2 border-red-300 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🍋</span>
                          <div>
                            <p className="text-red-900 font-bold">Soil is too sour!</p>
                            <p className="text-red-700 text-sm">Add lime powder to fix</p>
                            <p className="text-red-600 text-xs italic">
                              சுண்ணாம்பு சேர்க्कवум் | चूना डालें
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  } else if (phLevel >= 6 && phLevel <= 7.5) {
                    return (
                      <div className="p-4 bg-green-100 border-2 border-green-300 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">😊</span>
                          <div>
                            <p className="text-green-900 font-bold">Soil is perfect!</p>
                            <p className="text-green-700 text-sm">Good for all crops</p>
                            <p className="text-green-600 text-xs italic">
                              மண் நல்ல நிலையில் உள्ளது | मिट्टी अच्छी है
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-4 bg-orange-100 border-2 border-orange-300 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🧂</span>
                          <div>
                            <p className="text-orange-900 font-bold">Soil is too salty!</p>
                            <p className="text-orange-700 text-sm">Add gypsum powder to fix</p>
                            <p className="text-orange-600 text-xs italic">
                              ஜிப்சம் சேர्कवум् | जिप्सम डालें
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          )}
          
          {/* Quick status summary */}
          <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              <span className="font-medium">Farm Status:</span> {
                sensorData && (
                  getSensorColor(sensorData.soilMoisture, 'soilMoisture').status === 'Optimal' &&
                  getSensorColor(sensorData.pH, 'pH').status === 'Optimal' &&
                  (sensorData.Nitrogen > 0 ? getSensorColor(sensorData.Nitrogen, 'nutrients').status === 'Optimal' : false)
                ) ? '🟢 All systems optimal' : 
                  sensorData && (
                    getSensorColor(sensorData.soilMoisture, 'soilMoisture').status === 'Critical' ||
                    getSensorColor(sensorData.pH, 'pH').status === 'Critical' ||
                    (sensorData.Nitrogen > 0 ? getSensorColor(sensorData.Nitrogen, 'nutrients').status === 'Critical' : true)
                  ) ? '🔴 Attention required' : '🟡 Monitor conditions'
              }
            </p>
          </div>

          {/* Connection info */}
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-500">
              Live data from Firebase Realtime Database
            </p>
          </div>

          {/* Mock controls (if enabled) */}
          {showMockControls && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800 mb-2">Live Mode</p>
              <p className="text-xs text-green-600">
                Sensor dashboard is connected to Firebase Realtime Database for live data updates.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SensorDashboard;

export type { SensorDashboardProps };
