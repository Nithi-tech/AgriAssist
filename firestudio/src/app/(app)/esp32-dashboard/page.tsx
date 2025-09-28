'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, limit, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ESP32SensorReading, checkAlerts, AlertMessages } from '@/lib/alerts';

export default function ESP32Dashboard() {
  const [latestReading, setLatestReading] = useState<ESP32SensorReading | null>(null);
  const [alerts, setAlerts] = useState<AlertMessages>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create real-time subscription to get the most recent sensor reading from sensorData collection
    const q = query(
      collection(db, 'sensorData'),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const reading = { id: doc.id, ...doc.data() } as ESP32SensorReading;
          setLatestReading(reading);
          setAlerts(checkAlerts(reading));
        } else {
          setLatestReading(null);
          setAlerts({});
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firestore subscription error:', err);
        setError('Failed to load sensor data');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    // Handle Firestore Timestamp or Date objects
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    } else if (timestamp instanceof Date) {
      return timestamp.toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading ESP32 sensor dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!latestReading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">ESP32 Sensor Dashboard</h1>
          <div className="text-center py-20">
            <p className="text-gray-600">No ESP32 sensor data available yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ESP32 Sensor Dashboard</h1>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Device: <span className="font-medium">{latestReading.esp32}</span></span>
              <span>Last Updated: <span className="font-medium">{formatTimestamp(latestReading.timestamp)}</span></span>
            </div>
          </div>
        </div>

        {/* Sensor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* pH Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full mr-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">pH Level</h3>
                  <p className="text-sm text-gray-500">Soil Acidity</p>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-800">{latestReading.ph.toFixed(1)}</span>
              <span className="text-gray-500 ml-2">pH</span>
            </div>
            {alerts.ph && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                <span className="font-medium">⚠️ Alert:</span> {alerts.ph}
              </div>
            )}
          </div>

          {/* Moisture Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-cyan-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-3 bg-cyan-100 rounded-full mr-3">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Moisture</h3>
                  <p className="text-sm text-gray-500">Soil Humidity</p>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-800">{latestReading.moisture.toFixed(1)}</span>
              <span className="text-gray-500 ml-2">%</span>
            </div>
            {alerts.moisture && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                <span className="font-medium">⚠️ Alert:</span> {alerts.moisture}
              </div>
            )}
          </div>

          {/* NPK Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full mr-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">NPK Levels</h3>
                  <p className="text-sm text-gray-500">Soil Nutrients</p>
                </div>
              </div>
            </div>
            <div className="mb-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Nitrogen (N):</span>
                <span className="font-medium">{latestReading.npk.n}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Phosphorus (P):</span>
                <span className="font-medium">{latestReading.npk.p}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Potassium (K):</span>
                <span className="font-medium">{latestReading.npk.k}</span>
              </div>
            </div>
            {alerts.npk && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                <span className="font-medium">⚠️ Alert:</span> {alerts.npk}
              </div>
            )}
          </div>

          {/* Device ID Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-full mr-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 002 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Device ID</h3>
                  <p className="text-sm text-gray-500">ESP32 Module</p>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <span className="text-2xl font-bold text-gray-800 break-all">{latestReading.esp32}</span>
            </div>
            <div className="bg-purple-50 border border-purple-200 text-purple-700 px-3 py-2 rounded-md text-sm">
              <span className="font-medium">📡 Status:</span> Active
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
