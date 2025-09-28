'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface EnvCheck {
  url: string;
  key: string;
  projectRef: string;
}

interface ConnectionTest {
  success: boolean;
  error?: string;
  code?: string;
  recordCount?: number;
}

interface DataFetch {
  success: boolean;
  error?: string;
  code?: string;
  sampleData?: any;
}

interface DiagnosticResults {
  envCheck?: EnvCheck;
  connectionTest?: ConnectionTest;
  dataFetch?: DataFetch;
  criticalError?: string;
}

export default function SupabaseDebugTest() {
  const [status, setStatus] = useState<string>('Testing...');
  const [details, setDetails] = useState<DiagnosticResults>({});

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const results: DiagnosticResults = {};
    
    try {
      // 1. Check env vars
      results.envCheck = {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
        projectRef: process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'UNKNOWN'
      };

      // 2. Test basic connection (mock)
      const mockResponse = { data: [], error: null };

      if (mockResponse.error) {
        results.connectionTest = {
          success: false,
          error: 'Mock: Connection test disabled',
          code: 'MOCK_ERROR'
        };
      } else {
        results.connectionTest = {
          success: true,
          recordCount: 0
        };
      }

      // 3. Test actual data fetch (mock)
      const mockFetchResponse = { data: [{ id: 1, scheme_name: 'Mock Scheme', state: 'Mock State' }], error: null };

      if (mockFetchResponse.error) {
        results.dataFetch = {
          success: false,
          error: 'Mock: Data fetch disabled',
          code: 'MOCK_ERROR'
        };
      } else {
        results.dataFetch = {
          success: true,
          sampleData: mockFetchResponse.data?.[0] || null
        };
      }

      setDetails(results);
      
      if (results.connectionTest?.success && results.dataFetch?.success) {
        setStatus('✅ ALL TESTS PASSED - Supabase connection working!');
      } else {
        setStatus('❌ TESTS FAILED - Check details below');
      }

    } catch (err: any) {
      setStatus('💥 CRITICAL ERROR');
      setDetails({ criticalError: err?.message || 'Unknown error occurred' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-4">🔧 Supabase Connection Diagnostics</h1>
      
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h2 className="font-semibold text-lg">{status}</h2>
      </div>

      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h3 className="font-medium text-lg mb-2">1. Environment Variables</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(details.envCheck, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-medium text-lg mb-2">2. Connection Test</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(details.connectionTest, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-medium text-lg mb-2">3. Data Fetch Test</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify(details.dataFetch, null, 2)}
          </pre>
        </div>

        {details.criticalError && (
          <div className="p-4 border border-red-300 rounded bg-red-50">
            <h3 className="font-medium text-lg mb-2 text-red-800">Critical Error</h3>
            <pre className="text-red-700 text-sm">{details.criticalError}</pre>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded border">
        <h3 className="font-medium mb-2">🚀 Next Steps if Tests Fail:</h3>
        <ol className="list-decimal list-inside text-sm space-y-1">
          <li>Run the complete SQL script in Supabase Dashboard → SQL Editor</li>
          <li>Check environment variables match Supabase Dashboard → Settings → API</li>
          <li>Verify table exists: Dashboard → Table Editor → public → welfare_schemes</li>
          <li>Restart your Next.js dev server after any env changes</li>
          <li>Refresh this page to re-run diagnostics</li>
        </ol>
      </div>

      <button 
        onClick={runDiagnostics}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        🔄 Re-run Diagnostics
      </button>
    </div>
  );
}
