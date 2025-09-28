'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  ExternalLink, 
  Filter, 
  MapPin, 
  FileText, 
  Users,
  Target,
  Database,
  RefreshCw,
  AlertCircle,
  Info,
  Globe,
  Download,
  TrendingUp,
  Calendar,
  BarChart3,
  Wifi,
  WifiOff
} from 'lucide-react';

// Chart component (simplified for demo)
const PriceChart = ({ data, title, type = 'line' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
        <p className="text-gray-500">No data available for chart</p>
      </div>
    );
  }

  return (
    <div className="h-64 bg-gradient-to-r from-blue-50 to-green-50 rounded p-4">
      <h4 className="font-semibold mb-2">{title}</h4>
      <div className="text-sm text-gray-600">
        Chart showing {data.length} data points
        {data.length > 0 && (
          <div className="mt-2">
            <p>Latest: ₹{data[data.length - 1]?.modalPrice || data[data.length - 1]?.modal_price || 'N/A'}</p>
            <p>Trend: {type === 'line' ? 'Time series' : 'Bar comparison'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MarketPrices = () => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  
  // Filter states
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCommodity, setSelectedCommodity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Data states
  const [stats, setStats] = useState({});
  const [metadata, setMetadata] = useState({});

  // ============================================================================
  // API FUNCTIONS - Updated to use new market-prices API with weekly caching
  // ============================================================================
  
  const API_BASE = '/api/market-prices';
  
  const fetchPrices = async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      
      const params = new URLSearchParams();
      if (filters.state && filters.state !== 'all') params.append('state', filters.state);
      if (filters.commodity && filters.commodity !== 'all') params.append('commodity', filters.commodity);
      params.append('limit', '500');
      params.append('offset', '0');
      
      console.log('📊 Fetching market prices with filters:', filters);
      
      const response = await fetch(`${API_BASE}?${params}`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const { prices, stats, lastUpdated, metadata } = result.data;
        
        setPrices(prices);
        setStats(stats);
        setMetadata(metadata);
        
        // Check if data is from fallback/cache
        const isFromCache = !stats.lastFetchSuccess || 
                           (metadata.source && metadata.source.includes('cache'));
        
        if (isFromCache) {
          setError('Showing last week\'s data due to fetch error');
          console.warn('⚠️ Using cached/fallback data');
        }
        
        console.log(`✅ Fetched ${prices.length} market prices (${metadata.source})`);
        console.log('📈 Stats:', stats);
        
      } else {
        throw new Error(result.message || 'Failed to fetch prices');
      }
      
    } catch (err) {
      console.error('❌ Fetch error:', err.message);
      setError(`Failed to load market prices: ${err.message}`);
      
      // Set empty data on error
      setPrices([]);
      setStats({ totalRecords: 0, error: err.message });
      setMetadata({ source: 'error', lastFetch: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  const syncData = async () => {
    try {
      setSyncing(true);
      setError('');
      
      console.log('🔄 Force refreshing market data...');
      
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Sync Error: ${response.status} - ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const { prices, stats, metadata } = result.data;
        
        setPrices(prices);
        setStats(stats);
        setMetadata(metadata);
        
        console.log(`✅ Force refresh completed: ${prices.length} records`);
        
        // Clear any previous errors
        setError('');
        
      } else {
        throw new Error(result.message || 'Sync failed');
      }
      
    } catch (err) {
      console.error('❌ Sync error:', err.message);
      setError(`Failed to refresh data: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const uniqueStates = useMemo(() => {
    return [...new Set(prices.map(p => p.state))].sort();
  }, [prices]);

  const uniqueCommodities = useMemo(() => {
    return [...new Set(prices.map(p => p.commodity))].sort();
  }, [prices]);

  const filteredPrices = useMemo(() => {
    let filtered = [...prices];
    
    if (selectedState && selectedState !== 'all') {
      filtered = filtered.filter(p => p.state.toLowerCase().includes(selectedState.toLowerCase()));
    }
    
    if (selectedCommodity && selectedCommodity !== 'all') {
      filtered = filtered.filter(p => p.commodity.toLowerCase().includes(selectedCommodity.toLowerCase()));
    }
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.commodity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.market.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.state.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [prices, selectedState, selectedCommodity, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredPrices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPrices = filteredPrices.slice(startIndex, endIndex);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchPrices();
    
    // Check online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedState, selectedCommodity, searchTerm]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderSummaryStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="flex items-center p-6">
          <Database className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalRecords || 0}</p>
            <p className="text-gray-600">Total Records</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardContent className="flex items-center p-6">
          <MapPin className="h-8 w-8 text-green-600 mr-3" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{uniqueStates.length}</p>
            <p className="text-gray-600">States Covered</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="flex items-center p-6">
          <Target className="h-8 w-8 text-purple-600 mr-3" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{uniqueCommodities.length}</p>
            <p className="text-gray-600">Commodities</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="flex items-center p-6">
          {isOnline ? <Wifi className="h-8 w-8 text-orange-600 mr-3" /> : <WifiOff className="h-8 w-8 text-red-600 mr-3" />}
          <div>
            <p className="text-2xl font-bold text-gray-900">{isOnline ? 'Online' : 'Offline'}</p>
            <p className="text-gray-600">Status</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-4 items-center mb-4">
        {/* Search Bar */}
        <div className="relative flex-1 w-full lg:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by commodity, market, or state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        {/* State Filter */}
        <div className="w-full lg:w-48">
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger>
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {uniqueStates.map((state) => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Commodity Filter */}
        <div className="w-full lg:w-48">
          <Select value={selectedCommodity} onValueChange={setSelectedCommodity}>
            <SelectTrigger>
              <SelectValue placeholder="Select Commodity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Commodities</SelectItem>
              {uniqueCommodities.map((commodity) => (
                <SelectItem key={commodity} value={commodity}>
                  {commodity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sync Button */}
        <Button 
          onClick={syncData}
          disabled={syncing}
          className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700"
        >
          {syncing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {syncing ? 'Syncing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Filter Summary */}
      <div className="flex flex-wrap gap-2">
        {searchTerm && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Search: "{searchTerm}"
          </Badge>
        )}
        {selectedState !== 'all' && (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            State: {selectedState}
          </Badge>
        )}
        {selectedCommodity !== 'all' && (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            Commodity: {selectedCommodity}
          </Badge>
        )}
        <Badge variant="outline" className="bg-gray-50">
          {filteredPrices.length} results
        </Badge>
      </div>
    </div>
  );

  const renderTable = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Market Prices ({filteredPrices.length} records)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentPrices.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No prices found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3">Commodity</th>
                    <th className="text-left p-3">Market</th>
                    <th className="text-left p-3">State</th>
                    <th className="text-right p-3">Min Price (₹)</th>
                    <th className="text-right p-3">Max Price (₹)</th>
                    <th className="text-right p-3">Modal Price (₹)</th>
                    <th className="text-left p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPrices.map((price, index) => (
                    <tr key={price.id || index} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{price.commodity}</td>
                      <td className="p-3">{price.market}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {price.state}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">₹{price.minPrice || price.min_price}</td>
                      <td className="p-3 text-right">₹{price.maxPrice || price.max_price}</td>
                      <td className="p-3 text-right font-bold">₹{price.modalPrice || price.modal_price}</td>
                      <td className="p-3">{price.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredPrices.length)} of {filteredPrices.length} records
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <span className="px-3 py-2 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (loading && prices.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading market prices...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Market Prices Dashboard</h1>
        <p className="text-gray-600">
          Weekly agricultural commodity prices from across India
          {!isOnline && (
            <Badge variant="destructive" className="ml-2">Offline Mode</Badge>
          )}
        </p>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {renderSummaryStats()}
      {renderFilters()}
      {renderTable()}
    </div>
  );
};

export default MarketPrices;
