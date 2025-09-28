'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Droplets, FlaskConical, Leaf, AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useSensorRealtimeData } from '@/hooks/useSensorRealtimeData';

interface SensorRealtimeDashboardProps {
  className?: string;
}

export function SensorRealtimeDashboard({ className = '' }: SensorRealtimeDashboardProps) {
  const { sensorData, status, isLoading, refresh, getValueStatus } = useSensorRealtimeData();

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (parameter: 'pH' | 'soilMoisture' | 'Nitrogen' | 'Phosphorus' | 'Potassium', value: number) => {
    const status = getValueStatus(value, parameter);
    switch (status) {
      case 'optimal': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (parameter: 'pH' | 'soilMoisture' | 'Nitrogen' | 'Phosphorus' | 'Potassium', value: number) => {
    const status = getValueStatus(value, parameter);
    switch (status) {
      case 'optimal': return 'Optimal';
      case 'warning': return 'Warning';
      case 'critical': return 'Critical';
      default: return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Sensor Data...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-sm text-gray-600">Connecting to sensor database...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Status Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status.isConnected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              Real-time Sensor Dashboard
            </div>
            <Button onClick={refresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={status.isConnected ? "default" : "destructive"}>
              {status.isConnected ? "Connected" : "Disconnected"}
            </Badge>
            {status.lastUpdate && (
              <span className="text-sm text-gray-600">
                Last updated: {new Date(status.lastUpdate).toLocaleString()}
              </span>
            )}
            {status.error && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{status.error}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sensor Data */}
      {sensorData ? (
        <>
          {/* NPK Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-green-600" />
                  Nitrogen (N)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sensorData.Nitrogen} mg/kg</div>
                <Badge 
                  variant="secondary" 
                  className={`mt-2 text-white ${getStatusColor('Nitrogen', sensorData.Nitrogen)}`}
                >
                  {getStatusText('Nitrogen', sensorData.Nitrogen)}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-orange-600" />
                  Phosphorus (P)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sensorData.Phosphorus} mg/kg</div>
                <Badge 
                  variant="secondary" 
                  className={`mt-2 text-white ${getStatusColor('Phosphorus', sensorData.Phosphorus)}`}
                >
                  {getStatusText('Phosphorus', sensorData.Phosphorus)}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-purple-600" />
                  Potassium (K)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sensorData.Potassium} mg/kg</div>
                <Badge 
                  variant="secondary" 
                  className={`mt-2 text-white ${getStatusColor('Potassium', sensorData.Potassium)}`}
                >
                  {getStatusText('Potassium', sensorData.Potassium)}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* pH and Moisture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-blue-600" />
                  pH Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sensorData.pH.toFixed(2)}</div>
                <Badge 
                  variant="secondary" 
                  className={`mt-2 text-white ${getStatusColor('pH', sensorData.pH)}`}
                >
                  {getStatusText('pH', sensorData.pH)}
                </Badge>
                <div className="text-xs text-gray-500 mt-1">
                  Optimal: 6.0 - 7.5
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  Soil Moisture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sensorData.soilMoisture.toFixed(1)}%</div>
                <Badge 
                  variant="secondary" 
                  className={`mt-2 text-white ${getStatusColor('soilMoisture', sensorData.soilMoisture)}`}
                >
                  {getStatusText('soilMoisture', sensorData.soilMoisture)}
                </Badge>
                <div className="text-xs text-gray-500 mt-1">
                  Optimal: 40% - 70%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timestamp Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Data Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Last Updated:</span>
                  <div className="text-gray-600">{new Date(sensorData.lastUpdated).toLocaleString()}</div>
                </div>
                <div>
                  <span className="font-medium">Timestamp:</span>
                  <div className="text-gray-600">{formatTimestamp(sensorData.timestamp)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Sensor Data Available</h3>
              <p className="text-gray-600 mb-4">
                Waiting for sensor data to be pushed to the database...
              </p>
              <Button onClick={refresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
