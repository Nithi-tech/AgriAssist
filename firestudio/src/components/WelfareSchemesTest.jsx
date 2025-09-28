'use client';

// ============================================================================
// WELFARE SCHEMES TEST COMPONENT
// Use this to test your Supabase connection and table
// ============================================================================

import { useState, useEffect } from 'react';
import { 
  getAllWelfareSchemes, 
  getFilteredWelfareSchemes,
  getUniqueStates,
  getUniqueCategories,
  testDatabaseConnection
} from '@/lib/productionWelfareClient';

export default function WelfareSchemesTest() {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [states, setStates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Test database connection on component mount
  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    const result = await testDatabaseConnection();
    setConnectionStatus(result);
    
    if (result.success) {
      loadInitialData();
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [schemesResult, statesResult, categoriesResult] = await Promise.all([
        getAllWelfareSchemes(),
        getUniqueStates(),
        getUniqueCategories()
      ]);

      if (schemesResult.error) {
        setError(schemesResult.error);
      } else {
        setSchemes(schemesResult.data || []);
      }

      setStates(statesResult.data || []);
      setCategories(categoriesResult.data || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async (state, keyword) => {
    setLoading(true);
    try {
      const result = await getFilteredWelfareSchemes(state, keyword);
      if (result.error) {
        setError(result.error);
      } else {
        setSchemes(result.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        🧪 Welfare Schemes Database Test
      </h1>

      {/* Connection Status */}
      <div className="mb-6 p-4 rounded-lg border">
        <h2 className="text-xl font-semibold mb-3">📡 Connection Status</h2>
        {connectionStatus ? (
          <div className={`p-3 rounded ${
            connectionStatus.success 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {connectionStatus.message}
          </div>
        ) : (
          <div className="text-gray-500">Testing connection...</div>
        )}
      </div>

      {connectionStatus?.success && (
        <>
          {/* Quick Filters */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-3">🔍 Quick Filters</h3>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => handleFilter('All', '')}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Show All
              </button>
              <button 
                onClick={() => handleFilter('Central Government', '')}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Central Schemes
              </button>
              <button 
                onClick={() => handleFilter('Tamil Nadu', '')}
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Tamil Nadu
              </button>
              <button 
                onClick={() => handleFilter('All', 'farmer')}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Search "farmer"
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">Total Schemes</h3>
              <p className="text-2xl font-bold text-blue-600">{schemes.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900">States</h3>
              <p className="text-2xl font-bold text-green-600">{states.length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-900">Categories</h3>
              <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-medium text-red-900">❌ Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading schemes...</p>
            </div>
          )}

          {/* Schemes List */}
          {!loading && schemes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                📋 Schemes ({schemes.length} found)
              </h3>
              
              {schemes.slice(0, 5).map((scheme, index) => (
                <div key={scheme.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg text-gray-900">
                      {index + 1}. {scheme.scheme_name}
                    </h4>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {scheme.state}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Category:</strong> {scheme.category || 'N/A'}</p>
                      <p><strong>Target:</strong> {scheme.target_beneficiaries || 'N/A'}</p>
                      <p><strong>Benefit:</strong> 
                        {scheme.benefit_amount ? `₹${Number(scheme.benefit_amount).toLocaleString()}` : 'Variable'}
                      </p>
                    </div>
                    <div>
                      <p><strong>Agency:</strong> {scheme.implementing_agency || 'N/A'}</p>
                      <p><strong>Year:</strong> {scheme.launch_year || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <p className="mt-2 text-gray-600 text-sm">
                    <strong>Eligibility:</strong> {scheme.eligibility?.substring(0, 100)}...
                  </p>
                </div>
              ))}
              
              {schemes.length > 5 && (
                <p className="text-center text-gray-500 py-4">
                  ... and {schemes.length - 5} more schemes
                </p>
              )}
            </div>
          )}

          {/* No Results */}
          {!loading && schemes.length === 0 && !error && (
            <div className="text-center py-8">
              <p className="text-gray-500">No schemes found. Please check your database setup.</p>
            </div>
          )}

          {/* Debug Info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">🔧 Debug Information</h3>
            <div className="text-sm space-y-1">
              <p><strong>Available States:</strong> {states.join(', ')}</p>
              <p><strong>Available Categories:</strong> {categories.join(', ')}</p>
              <p><strong>Database Table:</strong> welfare_schemes</p>
              <p><strong>Connection Status:</strong> {connectionStatus?.success ? '✅ Connected' : '❌ Disconnected'}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
