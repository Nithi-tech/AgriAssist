'use client';

import React from 'react';
import { SensorRealtimeDashboard } from '@/components/SensorRealtimeDashboard';

export default function SensorRealtimePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sensor Monitoring</h1>
        <p className="text-gray-600">
          Real-time monitoring of soil conditions including NPK levels, pH, and moisture content.
        </p>
      </div>
      
      <SensorRealtimeDashboard />
    </div>
  );
}
