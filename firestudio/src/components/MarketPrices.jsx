'use client';

// ============================================================================
// MARKET PRICES DASHBOARD - React Component
// Features: Filters, Charts, Table, Export, Offline Support
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  RefreshCw, 
  Search, 
  TrendingUp, 
  MapPin, 
  Calendar,
  BarChart3,
  Database,
  Wifi,
  WifiOff,
  Filter
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
            <p>Latest: ₹{data[data.length - 1]?.average_price || data[data.length - 1]?.modal_price || 'N/A'}</p>
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
  const [filteredPrices, setFilteredPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Filter states
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCommodity, setSelectedCommodity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // UI states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Data states
  const [metadata, setMetadata] = useState({});
  const [trends, setTrends] = useState([]);
  const [stats, setStats] = useState({});

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

  const fetchStats = async () => {
    try {
      // Stats are now included in the main fetchPrices call
      // This function is kept for compatibility but doesn't make a separate call
      console.log('📈 Stats already loaded with prices');
      
    } catch (err) {
      console.error('❌ Stats fetch error:', err.message);
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

  const fetchTrends = async (commodity, state = '') => {
    try {
      // For now, trends are calculated from the main prices data
      // This can be enhanced to call a separate trends endpoint if needed
      const filteredPrices = prices.filter(price => 
        price.commodity.toLowerCase().includes(commodity.toLowerCase()) &&
        (state ? price.state.toLowerCase().includes(state.toLowerCase()) : true)
      );
      
      // Simple trend calculation - group by date and average prices
      const trendData = filteredPrices.slice(0, 30).map(price => ({
        date: price.date,
        price: price.modalPrice || price.modal_price,
        commodity: price.commodity
      }));
      
      setTrends(trendData);
      console.log('� Calculated trends:', trendData.length, 'data points');
      
    } catch (err) {
      console.error('❌ Trends calculation error:', err.message);
    }
  };

  const syncPrices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/prices/sync`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('🔄 Manual sync completed');
        await fetchPrices();
        await fetchStats();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('❌ Sync error:', err.message);
      setError(`Sync failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadOfflineData = () => {
    // Mock offline data
    const offlineData = [
      {
        id: 'offline_1',
        date: '2025-01-18',
        state: 'Tamil Nadu',
        market: 'Koyambedu',
        commodity: 'Rice',
        min_price: 2800,
        max_price: 3200,
        modal_price: 3000,
        source: 'Offline Cache'
      },
      {
        id: 'offline_2',
        date: '2025-01-18',
        state: 'Karnataka',
        market: 'APMC Bangalore',
        commodity: 'Wheat',
        min_price: 2200,
        max_price: 2800,
        modal_price: 2500,
        source: 'Offline Cache'
      }
    ];
    
    setPrices(offlineData);
    setError('Showing offline data. Connect to internet for latest prices.');
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

  const appliedFilters = useMemo(() => {
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
    
    if (dateFrom) {
      filtered = filtered.filter(p => p.date >= dateFrom);
    }
    
    if (dateTo) {
      filtered = filtered.filter(p => p.date <= dateTo);
    }
    
    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (sortField === 'date') {
        return sortDirection === 'desc' 
          ? new Date(bVal) - new Date(aVal)
          : new Date(aVal) - new Date(bVal);
      }
      
      if (typeof aVal === 'number') {
        return sortDirection === 'desc' ? bVal - aVal : aVal - bVal;
      }
      
      return sortDirection === 'desc' 
        ? bVal.localeCompare(aVal)
        : aVal.localeCompare(bVal);
    });
    
    return filtered;
  }, [prices, selectedState, selectedCommodity, searchTerm, dateFrom, dateTo, sortField, sortDirection]);

  const paginatedPrices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return appliedFilters.slice(startIndex, startIndex + itemsPerPage);
  }, [appliedFilters, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(appliedFilters.length / itemsPerPage);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  const getCommodityCategory = (commodity) => {
    const cereals = ['Rice', 'Wheat', 'Barley', 'Corn', 'Maize'];
    const vegetables = ['Tomato', 'Onion', 'Potato', 'Carrot', 'Cabbage', 'Beans'];
    const fruits = ['Apple', 'Banana', 'Mango', 'Orange'];
    
    if (cereals.some(c => commodity.toLowerCase().includes(c.toLowerCase()))) return 'cereals';
    if (vegetables.some(c => commodity.toLowerCase().includes(c.toLowerCase()))) return 'vegetables';
    if (fruits.some(c => commodity.toLowerCase().includes(c.toLowerCase()))) return 'fruits';
    return 'others';
  };

  const getCategoryColor = (category) => {
    const colors = {
      cereals: 'bg-yellow-100 text-yellow-800',
      vegetables: 'bg-green-100 text-green-800',
      fruits: 'bg-red-100 text-red-800',
      others: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.others;
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'State', 'Market', 'Commodity', 'Min Price', 'Max Price', 'Modal Price', 'Source'].join(','),
      ...appliedFilters.map(p => [
        p.date,
        p.state,
        p.market,
        p.commodity,
        p.min_price,
        p.max_price,
        p.modal_price,
        p.source
      ].join(','))
    ].join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market_prices_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  useEffect(() => {
    fetchPrices();
    fetchStats();
    
    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedState, selectedCommodity, searchTerm, dateFrom, dateTo]);

  useEffect(() => {
    if (selectedCommodity && selectedCommodity !== 'all') {
      fetchTrends(selectedCommodity, selectedState !== 'all' ? selectedState : null);
    }
  }, [selectedCommodity, selectedState]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================
  
  const renderSummaryStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold">{appliedFilters.length}</p>
            </div>
            <Database className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">States Covered</p>
              <p className="text-2xl font-bold">{stats.unique_states || uniqueStates.length}</p>
            </div>
            <MapPin className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Commodities</p>
              <p className="text-2xl font-bold">{stats.unique_commodities || uniqueCommodities.length}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-sm font-medium">
                {metadata.last_updated ? new Date(metadata.last_updated).toLocaleDateString() : 'Unknown'}
              </p>
              <div className="flex items-center mt-1">
                {isOnline ? (
                  <><Wifi className="h-4 w-4 text-green-500 mr-1" /> Online</>
                ) : (
                  <><WifiOff className="h-4 w-4 text-red-500 mr-1" /> Offline</>
                )}
              </div>
            </div>
            <Calendar className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFilters = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filters & Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger>
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {uniqueStates.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedCommodity} onValueChange={setSelectedCommodity}>
            <SelectTrigger>
              <SelectValue placeholder="Select Commodity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Commodities</SelectItem>
              {uniqueCommodities.map(commodity => (
                <SelectItem key={commodity} value={commodity}>{commodity}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Input
            type="date"
            placeholder="From Date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          
          <Input
            type="date"
            placeholder="To Date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                setSelectedState('all');
                setSelectedCommodity('all');
                setSearchTerm('');
                setDateFrom('');
                setDateTo('');
              }}
              variant="outline"
              size="sm"
            >
              Clear
            </Button>
            <Button 
              onClick={syncPrices}
              disabled={loading}
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Sync
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCharts = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Price Trends {selectedCommodity && `- ${selectedCommodity}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PriceChart 
            data={trends} 
            title={selectedCommodity ? `${selectedCommodity} Price Trends` : 'Select a commodity to see trends'}
            type="line"
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Top Commodities by Markets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PriceChart 
            data={stats.top_commodities || []} 
            title="Commodity Coverage"
            type="bar"
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderTable = () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Market Prices Data</CardTitle>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                {[
                  { key: 'date', label: 'Date' },
                  { key: 'state', label: 'State' },
                  { key: 'market', label: 'Market' },
                  { key: 'commodity', label: 'Commodity' },
                  { key: 'min_price', label: 'Min Price' },
                  { key: 'max_price', label: 'Max Price' },
                  { key: 'modal_price', label: 'Modal Price' },
                  { key: 'source', label: 'Source' }
                ].map(column => (
                  <th 
                    key={column.key}
                    className="border border-gray-200 px-4 py-2 text-left cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      if (sortField === column.key) {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField(column.key);
                        setSortDirection('desc');
                      }
                    }}
                  >
                    {column.label}
                    {sortField === column.key && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedPrices.map((price, index) => (
                <tr key={price.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-gray-200 px-4 py-2">
                    {new Date(price.date).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-200 px-4 py-2">{price.state}</td>
                  <td className="border border-gray-200 px-4 py-2">{price.market}</td>
                  <td className="border border-gray-200 px-4 py-2">
                    <div className="flex items-center gap-2">
                      {price.commodity}
                      <Badge className={getCategoryColor(getCommodityCategory(price.commodity))}>
                        {getCommodityCategory(price.commodity)}
                      </Badge>
                    </div>
                  </td>
                  <td className="border border-gray-200 px-4 py-2">{formatPrice(price.min_price)}</td>
                  <td className="border border-gray-200 px-4 py-2">{formatPrice(price.max_price)}</td>
                  <td className="border border-gray-200 px-4 py-2 font-semibold">{formatPrice(price.modal_price)}</td>
                  <td className="border border-gray-200 px-4 py-2">
                    <Badge variant={price.source.includes('API') ? 'default' : 'secondary'}>
                      {price.source}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, appliedFilters.length)} of {appliedFilters.length} results
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <span className="px-3 py-1 text-sm bg-gray-100 rounded">
              {currentPage} / {totalPages}
            </span>
            <Button 
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
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
          Real-time agricultural commodity prices from across India
          {!isOnline && (
            <Badge variant="destructive" className="ml-2">Offline Mode</Badge>
          )}
        </p>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {renderSummaryStats()}
      {renderFilters()}
      {renderCharts()}
      {renderTable()}
    </div>
  );
};

export default MarketPrices;
