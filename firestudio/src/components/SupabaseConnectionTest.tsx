'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { createCrop, getLatestCrop, getAllCrops } from '@/lib/cropApi';

export default function SupabaseConnectionTest() {
  const [testResults, setTestResults] = useState<{
    connection: 'idle' | 'testing' | 'success' | 'error';
    crud: 'idle' | 'testing' | 'success' | 'error';
    message: string;
  }>({
    connection: 'idle',
    crud: 'idle',
    message: ''
  });

  const testConnection = async () => {
    setTestResults(prev => ({ ...prev, connection: 'testing', message: 'Testing connection...' }));
    
    try {
      // Simple connection test
      const { data, error } = await supabase
        .from('crops')
        .select('count')
        .limit(1);

      if (error) {
        throw error;
      }

      setTestResults(prev => ({ 
        ...prev, 
        connection: 'success', 
        message: '✅ Connection successful! Supabase is connected.' 
      }));
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        connection: 'error', 
        message: `❌ Connection failed: ${error.message}` 
      }));
    }
  };

  const testCRUD = async () => {
    setTestResults(prev => ({ ...prev, crud: 'testing', message: 'Testing CRUD operations...' }));
    
    try {
      // Test CREATE
      const testCrop = {
        crop_name: 'Test Crop',
        crop_variety: 'Test Variety',
        location: 'Test Location',
        land_size: 1.0,
        status: 'active' as const
      };

      const { data: created, error: createError } = await createCrop(testCrop);
      if (createError) throw createError;

      // Test READ
      const { data: latest, error: readError } = await getLatestCrop();
      if (readError) throw new Error(readError);

      // Test LIST
      const { data: all, error: listError } = await getAllCrops();
      if (listError) throw listError;

      setTestResults(prev => ({ 
        ...prev, 
        crud: 'success', 
        message: `✅ CRUD operations successful! Created crop ID: ${created?.id}, Found ${all.length} total crops.` 
      }));
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        crud: 'error', 
        message: `❌ CRUD test failed: ${error.message}` 
      }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'testing': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'testing': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🧪 Supabase Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Test */}
        <div>
          <Button 
            onClick={testConnection} 
            disabled={testResults.connection === 'testing'}
            className="w-full"
            variant={testResults.connection === 'success' ? 'default' : 'outline'}
          >
            {getStatusIcon(testResults.connection)}
            <span className="ml-2">
              {testResults.connection === 'testing' ? 'Testing Connection...' : 'Test Database Connection'}
            </span>
          </Button>
        </div>

        {/* CRUD Test */}
        <div>
          <Button 
            onClick={testCRUD} 
            disabled={testResults.crud === 'testing' || testResults.connection !== 'success'}
            className="w-full"
            variant={testResults.crud === 'success' ? 'default' : 'outline'}
          >
            {getStatusIcon(testResults.crud)}
            <span className="ml-2">
              {testResults.crud === 'testing' ? 'Testing CRUD...' : 'Test CRUD Operations'}
            </span>
          </Button>
        </div>

        {/* Results */}
        {testResults.message && (
          <Alert className={getStatusColor(testResults.connection === 'error' || testResults.crud === 'error' ? 'error' : testResults.connection === 'success' || testResults.crud === 'success' ? 'success' : 'testing')}>
            <AlertDescription>
              {testResults.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Make sure you've run the database schema in Supabase SQL Editor</li>
            <li>2. Test the database connection first</li>
            <li>3. If connection succeeds, test CRUD operations</li>
            <li>4. Check your Supabase dashboard to verify data was created</li>
          </ol>
        </div>

        {/* Supabase Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">Supabase Configuration:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div><strong>Project URL:</strong> https://ngexxcdvfwpdqkvwnbip.supabase.co</div>
            <div><strong>Environment:</strong> Production</div>
            <div><strong>Authentication:</strong> Anon Key (Public)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
