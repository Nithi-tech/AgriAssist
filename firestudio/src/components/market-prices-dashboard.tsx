'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Download,
  Filter,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import type { MarketPrice } from '@/types/market-prices';

// ============================================================================
// MARKET PRICES DASHBOARD COMPONENT
// ============================================================================

interface MarketPricesDashboardProps {
  initialData?: MarketPrice[];
}

const MarketPricesDashboard: React.FC<MarketPricesDashboardProps> = ({ initialData }) => {
  // State management
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>(initialData || []);
  const [filteredPrices, setFilteredPrices] = useState<MarketPrice[]>(initialData || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    state: '',
    commodity: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date' as 'date' | 'modal_price' | 'commodity',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  
  // Dashboard stats
  const [stats, setStats] = useState({
    totalRecords: 0,
    statesCount: 0,
    commoditiesCount: 0,
    lastUpdated: new Date().toISOString()
  });
  
  // Dropdown data
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCommodities, setAvailableCommodities] = useState<string[]>([]);
  
  // Chart configuration
  const chartColors = {
    primary: '#8884d8',
    secondary: '#82ca9d', 
    accent: '#ffc658',
    danger: '#ff7c7c'
  };

  // ============================================================================
  // DATA FETCHING FUNCTIONS
  // ============================================================================

  const fetchMarketPrices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.state) queryParams.set('state', filters.state);
      if (filters.commodity) queryParams.set('commodity', filters.commodity);
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.dateFrom) queryParams.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.set('dateTo', filters.dateTo);
      queryParams.set('sortBy', filters.sortBy);
      queryParams.set('sortOrder', filters.sortOrder);
      queryParams.set('limit', '500');
      
      const response = await fetch(`/api/market-prices/demo?${queryParams}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch market prices');
      }
      
      setMarketPrices(result.data || []);
      setFilteredPrices(result.data || []);
      
    } catch (error: any) {
      setError(error.message || 'Failed to fetch market prices');
      console.error('❌ Error fetching market prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/market-prices/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stats' })
      });
      
      const result = await response.json();
      if (result.success) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
    }
  };

  const fetchDropdownData = async () => {
    try {
      // Fetch states
      const statesResponse = await fetch('/api/market-prices/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'states' })
      });
      const statesResult = await statesResponse.json();
      if (statesResult.success) {
        setAvailableStates(statesResult.states);
      }
      
      // Fetch commodities
      const commoditiesResponse = await fetch('/api/market-prices/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'commodities' })
      });
      const commoditiesResult = await commoditiesResponse.json();
      if (commoditiesResult.success) {
        setAvailableCommodities(commoditiesResult.commodities);
      }
      
    } catch (error) {
      console.error('❌ Error fetching dropdown data:', error);
    }
  };

  const updateMarketPrices = async () => {
    setUpdateLoading(true);
    
    try {
      const response = await fetch('/api/market-prices/update-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NODE_ENV === 'development' ? 'dev' : 'production'}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Market prices updated successfully!\n${result.updatedCount} records updated, ${result.failedCount} failed.`);
        await fetchMarketPrices();
        await fetchStats();
      } else {
        throw new Error(result.message || 'Failed to update market prices');
      }
      
    } catch (error: any) {
      alert(`❌ Update failed: ${error.message}`);
      console.error('❌ Error updating market prices:', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  // ============================================================================
  // CHART DATA PROCESSING
  // ============================================================================

  const getPriceChartData = () => {
    if (!filteredPrices.length) return [];
    
    // Group by date and calculate averages
    const dateGroups = filteredPrices.reduce((acc, price) => {
      const date = price.date;
      if (!acc[date]) {
        acc[date] = { date, prices: [], count: 0 };
      }
      if (price.modal_price) {
        acc[date].prices.push(price.modal_price);
        acc[date].count++;
      }
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(dateGroups)
      .map(group => ({
        date: group.date,
        averagePrice: group.prices.length > 0 ? group.prices.reduce((a: number, b: number) => a + b, 0) / group.prices.length : 0,
        count: group.count
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 data points
  };

  const getCommodityChartData = () => {
    const commodityGroups = filteredPrices.reduce((acc, price) => {
      const commodity = price.commodity;
      if (!acc[commodity]) {
        acc[commodity] = { commodity, totalPrice: 0, count: 0 };
      }
      if (price.modal_price) {
        acc[commodity].totalPrice += price.modal_price;
        acc[commodity].count++;
      }
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(commodityGroups)
      .map(group => ({
        name: group.commodity,
        price: group.count > 0 ? Math.round(group.totalPrice / group.count) : 0,
        count: group.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  // ============================================================================
  // COMPONENT LIFECYCLE
  // ============================================================================

  useEffect(() => {
    if (!initialData || initialData.length === 0) {
      fetchMarketPrices();
    }
    fetchStats();
    fetchDropdownData();
  }, []);

  useEffect(() => {
    fetchMarketPrices();
  }, [filters.state, filters.commodity, filters.dateFrom, filters.dateTo, filters.sortBy, filters.sortOrder]);

  useEffect(() => {
    // Filter data based on search
    const filtered = marketPrices.filter(price => {
      if (!filters.search) return true;
      const searchLower = filters.search.toLowerCase();
      return (
        price.commodity.toLowerCase().includes(searchLower) ||
        price.market.toLowerCase().includes(searchLower) ||
        price.state.toLowerCase().includes(searchLower)
      );
    });
    setFilteredPrices(filtered);
  }, [marketPrices, filters.search]);

  // ============================================================================
  // RENDER COMPONENT
  // ============================================================================

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <BarChart3 className="h-6 w-6 text-amber-600" />
            </div>
            Market Intelligence Dashboard
          </h2>
          <p className="text-gray-600 text-lg">
            Stay ahead with real-time agricultural commodity prices from verified government sources
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={updateMarketPrices} 
            disabled={updateLoading}
            className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${updateLoading ? 'animate-spin' : ''}`} />
            {updateLoading ? 'Updating...' : 'Refresh Data'}
          </Button>
          <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
            <Download className="h-5 w-5 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-green-700">Total Records</CardTitle>
            <div className="bg-green-100 p-2 rounded-lg">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-800">{stats.totalRecords.toLocaleString()}</div>
            <p className="text-sm text-green-600 mt-1">Market price entries</p>
            <div className="flex items-center gap-1 text-xs text-green-500 mt-2">
              <CheckCircle className="h-3 w-3" />
              <span>Verified data</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-blue-700">Coverage</CardTitle>
            <div className="bg-blue-100 p-2 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-800">{stats.statesCount}</div>
            <p className="text-sm text-blue-600 mt-1">States covered</p>
            <div className="flex items-center gap-1 text-xs text-blue-500 mt-2">
              <CheckCircle className="h-3 w-3" />
              <span>Nationwide data</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-amber-700">Commodities</CardTitle>
            <div className="bg-amber-100 p-2 rounded-lg">
              <PieChartIcon className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-800">{stats.commoditiesCount}</div>
            <p className="text-sm text-amber-600 mt-1">Different crops tracked</p>
            <div className="flex items-center gap-1 text-xs text-amber-500 mt-2">
              <CheckCircle className="h-3 w-3" />
              <span>Major crops included</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-purple-700">Last Updated</CardTitle>
            <div className="bg-purple-100 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-800">
              {new Date(stats.lastUpdated).toLocaleDateString()}
            </div>
            <p className="text-sm text-purple-600 mt-1">
              {new Date(stats.lastUpdated).toLocaleTimeString()}
            </p>
            <div className="flex items-center gap-1 text-xs text-purple-500 mt-2">
              <CheckCircle className="h-3 w-3" />
              <span>Fresh data</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50 shadow-lg">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {/* Enhanced Filters */}
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl text-gray-800">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Filter className="h-6 w-6 text-gray-600" />
            </div>
            Smart Filters & Search
          </CardTitle>
          <p className="text-gray-600">Find the exact market data you need for your farming decisions</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search commodities, markets..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-12 h-12 text-lg border-gray-300 focus:border-green-500 bg-white shadow-sm"
              />
            </div>
            
            <Select 
              value={filters.state} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, state: value }))}
            >
              <SelectTrigger className="h-12 border-gray-300 focus:border-green-500 bg-white shadow-sm">
                <SelectValue placeholder="🗺️ Select State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-states">🇮🇳 All States</SelectItem>
                {availableStates.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={filters.commodity} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, commodity: value }))}
            >
              <SelectTrigger className="h-12 border-gray-300 focus:border-green-500 bg-white shadow-sm">
                <SelectValue placeholder="🌾 Select Crop" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-commodities">🌱 All Crops</SelectItem>
                {availableCommodities.map(commodity => (
                  <SelectItem key={commodity} value={commodity}>{commodity}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Input
              type="date"
              placeholder="From Date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="h-12 border-gray-300 focus:border-green-500 bg-white shadow-sm"
            />
            
            <Input
              type="date"
              placeholder="To Date" 
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="h-12 border-gray-300 focus:border-green-500 bg-white shadow-sm"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Badge className="bg-green-100 text-green-800 px-3 py-1 text-sm">
              📊 {filteredPrices.length} results found
            </Badge>
            {filters.state && filters.state !== 'all-states' && (
              <Badge variant="outline" className="border-blue-300 text-blue-700 px-3 py-1">
                🗺️ {filters.state}
              </Badge>
            )}
            {filters.commodity && filters.commodity !== 'all-commodities' && (
              <Badge variant="outline" className="border-amber-300 text-amber-700 px-3 py-1">
                🌾 {filters.commodity}
              </Badge>
            )}
            {filters.search && (
              <Badge variant="outline" className="border-purple-300 text-purple-700 px-3 py-1">
                🔍 "{filters.search}"
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Price Trend Chart */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl text-blue-800">
              <div className="bg-blue-100 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              Price Trends Over Time
            </CardTitle>
            <CardDescription className="text-blue-600">
              Track average commodity prices to identify the best selling opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                price: {
                  label: "Average Price (₹)",
                  color: chartColors.primary,
                },
              }}
              className="h-[350px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getPriceChartData()}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="averagePrice" 
                    stroke={chartColors.primary}
                    strokeWidth={3}
                    dot={{ r: 5, fill: chartColors.primary }}
                    activeDot={{ r: 7, fill: chartColors.accent }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Commodities Chart */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl text-green-800">
              <div className="bg-green-100 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              Most Tracked Commodities
            </CardTitle>
            <CardDescription className="text-green-600">
              Commodities with the most market data available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Data Points",
                  color: chartColors.secondary,
                },
              }}
              className="h-[350px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getCommodityChartData()}>
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="count" 
                    fill={chartColors.secondary}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Data Table */}
      <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl text-gray-800">
            <div className="bg-gray-100 p-2 rounded-lg">
              <Activity className="h-6 w-6 text-gray-600" />
            </div>
            Latest Market Prices
          </CardTitle>
          <CardDescription className="text-gray-600">
            Real-time commodity prices from various markets across India
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <RefreshCw className="h-12 w-12 animate-spin text-green-600" />
                <div className="absolute inset-0 animate-ping">
                  <RefreshCw className="h-12 w-12 text-green-400 opacity-50" />
                </div>
              </div>
              <p className="text-lg font-medium text-gray-700 mt-4">Loading fresh market data...</p>
              <p className="text-gray-500">Please wait while we fetch the latest prices</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-100 to-slate-100">
                    <tr>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">📅 Date</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">🗺️ State</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">🏪 Market</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">🌾 Commodity</th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700">💰 Min Price</th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700">💰 Max Price</th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700">⭐ Modal Price</th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-700">📊 Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPrices.slice(0, 50).map((price, index) => (
                      <tr key={`${price.id}-${index}`} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 text-gray-700">{price.date}</td>
                        <td className="py-4 px-4 text-gray-700 font-medium">{price.state}</td>
                        <td className="py-4 px-4 text-gray-600">{price.market}</td>
                        <td className="py-4 px-4 text-gray-800 font-semibold">{price.commodity}</td>
                        <td className="py-4 px-4 text-right text-gray-700">
                          {price.min_price ? `₹${price.min_price}` : '—'}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-700">
                          {price.max_price ? `₹${price.max_price}` : '—'}
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-green-700 text-lg">
                          {price.modal_price ? `₹${price.modal_price}` : '—'}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge 
                            className={price.source === 'api' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                            }
                          >
                            {price.source === 'api' ? '🔗 API' : '📝 Manual'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredPrices.length > 50 && (
                <div className="bg-gray-50 border-t border-gray-200 text-center py-4">
                  <p className="text-gray-600">
                    Showing 50 of <span className="font-semibold text-gray-800">{filteredPrices.length}</span> results
                  </p>
                  <Button variant="outline" className="mt-2" size="sm">
                    Load More Results
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketPricesDashboard;
