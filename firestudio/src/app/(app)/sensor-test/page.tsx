'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SensorTestPage() {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testAPI = async () => {
    const testData = {
      Nitrogen: 94,
      Phosphorus: 44,
      Potassium: 163,
      pH: 7.87,
      soilMoisture: 44.5
    };
    
    setIsLoading(true);
    setResult(null);
    
    try {
      console.log('🚀 Sending test data:', testData);
      
      const response = await fetch('/api/sensor-realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });
      
      const responseData = await response.json();
      console.log('📡 Response:', responseData);
      
      setResult(responseData);
      
      if (responseData.success) {
        alert('✅ Data sent successfully! Check the sensor dashboard at /sensor-realtime');
      } else {
        alert('❌ Error: ' + responseData.error);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
      alert('❌ Request failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Sensor Data API Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>Click the button below to send test sensor data to the Firebase Realtime Database.</p>
            
            <Button 
              onClick={testAPI} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Test Data'}
            </Button>
            
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Response:</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
            
            <div className="text-sm text-gray-600">
              <p>After sending data successfully, visit <a href="/sensor-realtime" className="text-blue-600 underline">/sensor-realtime</a> to see the live dashboard.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
