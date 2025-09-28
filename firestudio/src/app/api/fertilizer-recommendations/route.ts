/**
 * API Endpoint: Fertilizer Recommendations
 * GET /api/fertilizer-recommendations
 * 
 * Fetches latest sensor data and provides fertilizer recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkNutrientLevels, analyzeMultipleSensorReadings, type AlertMessage } from '@/lib/fertilizer-recommendations';
import mockSensorData from '@/data/mock/sensor_data.json';

interface SensorReading {
  id: number;
  device_token: string;
  crop_id?: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  timestamp: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const cropId = searchParams.get('cropId');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Filter and sort mock data (in a real app, this would be a database query)
    let filteredData = [...mockSensorData] as SensorReading[];

    if (deviceId) {
      filteredData = filteredData.filter(reading => reading.device_token === deviceId);
    }
    if (cropId) {
      filteredData = filteredData.filter(reading => reading.crop_id?.toString() === cropId);
    }

    // Sort by timestamp (newest first) and limit results
    filteredData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    filteredData = filteredData.slice(0, limit);

    if (filteredData.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          alerts: [],
          trends: {},
          recommendations: ['No sensor data available'],
          lastUpdated: new Date().toISOString()
        }
      });
    }

    // Transform data for analysis
    const readingsForAnalysis = filteredData.map(reading => ({
      nitrogen: reading.nitrogen,
      phosphorus: reading.phosphorus,
      potassium: reading.potassium,
      recorded_at: reading.timestamp
    }));

    // Analyze readings and get recommendations
    const analysis = analyzeMultipleSensorReadings(readingsForAnalysis);

    // Also get simple check for latest reading
    const latest = filteredData[0];
    const simpleAlerts = checkNutrientLevels(latest.nitrogen, latest.phosphorus, latest.potassium);

    return NextResponse.json({
      success: true,
      data: {
        alerts: analysis.latestAlerts,
        simpleAlerts,
        trends: analysis.trends,
        recommendations: analysis.recommendations,
        latestReading: {
          nitrogen: latest.nitrogen,
          phosphorus: latest.phosphorus,
          potassium: latest.potassium,
          timestamp: latest.timestamp,
          deviceId: latest.device_token,
          cropId: latest.crop_id
        },
        totalReadings: filteredData.length,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in fertilizer recommendations API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch fertilizer recommendations',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST endpoint for real-time updates (webhook style)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nitrogen, phosphorus, potassium } = body;

    if (typeof nitrogen !== 'number' || typeof phosphorus !== 'number' || typeof potassium !== 'number') {
      return NextResponse.json({
        success: false,
        error: 'Invalid nutrient values. Expected numbers for nitrogen, phosphorus, and potassium.'
      }, { status: 400 });
    }

    const alerts = checkNutrientLevels(nitrogen, phosphorus, potassium);

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        nutrientLevels: { nitrogen, phosphorus, potassium },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing fertilizer recommendation request:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
