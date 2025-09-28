'use client';

// ============================================================================
// MARKET PRICES DASHBOARD COMPONENT
// Advanced UI for displaying agricultural market prices with filtering
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  RefreshCw, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  MapPin,
  Wheat,
  IndianRupee,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface MarketPrice {
  id?: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety?: string;
  unit: string;
  min_price?: number;
  max_price?: number;
  modal_price: number;
  date: string;
  updated_at?: string;
}

interface MarketPriceStats {
  totalRecords: number;
  totalStates: number;
  totalCommodities: number;
  lastUpdated: string;
  priceRange: {
    lowest: { commodity: string; price: number; state: string };
    highest: { commodity: string; price: number; state: string };
  };
}

interface MarketPricesProps {
  initialData?: MarketPrice[];
  showRefreshButton?: boolean;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export default function MarketPricesDashboard({ 
  initialData = [], 
  showRefreshButton = true 
}: MarketPricesProps) {
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>(initialData);
  const [filteredPrices, setFilteredPrices] = useState<MarketPrice[]>(initialData);
  const [stats, setStats] = useState<MarketPriceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all-states');
  const [selectedCommodity, setSelectedCommodity] = useState<string>('all-commodities');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Get unique commodities from current data
  const availableCommodities = useMemo(() => {
    const commodities = [...new Set(
      marketPrices
        .map(price => price.commodity)
        .filter(commodity => commodity && commodity.trim().length > 0)
    )];
    return commodities.sort();
  }, [marketPrices]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchMarketPrices = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (selectedState && selectedState !== 'all-states') params.append('state', selectedState);
      if (selectedCommodity && selectedCommodity !== 'all-commodities') params.append('commodity', selectedCommodity);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      params.append('limit', '100');

      const response = await fetch(`/api/market-prices?${params}`);
      const data = await response.json();

      if (data.success) {
        setMarketPrices(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch market prices');
      }
    } catch (err) {
      setError('Network error while fetching market prices');
      console.error('Error fetching market prices:', err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/market-prices?type=stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    try {
      // Trigger data update from external sources
      const updateResponse = await fetch('/api/market-prices/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const updateData = await updateResponse.json();
      
      if (updateData.success) {
        // Fetch fresh data
        await fetchMarketPrices(false);
        await fetchStats();
      } else {
        setError(updateData.message || 'Failed to refresh data');
      }
    } catch (err) {
      setError('Failed to refresh market prices');
      console.error('Error refreshing data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // ============================================================================
  // FILTERING AND SORTING
  // ============================================================================

  useEffect(() => {
    let filtered = [...marketPrices];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(price =>
        price.commodity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        price.market.toLowerCase().includes(searchTerm.toLowerCase()) ||
        price.state.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'commodity':
          aValue = a.commodity;
          bValue = b.commodity;
          break;
        case 'modal_price':
          aValue = a.modal_price;
          bValue = b.modal_price;
          break;
        case 'state':
          aValue = a.state;
          bValue = b.state;
          break;
        case 'date':
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    setFilteredPrices(filtered);
  }, [marketPrices, searchTerm, sortField, sortDirection]);

  // ============================================================================
  // INITIAL LOAD
  // ============================================================================

  useEffect(() => {
    if (initialData.length === 0) {
      fetchMarketPrices();
    }
    fetchStats();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    if ((selectedState && selectedState !== 'all-states') || 
        (selectedCommodity && selectedCommodity !== 'all-commodities') || 
        dateFrom || dateTo) {
      fetchMarketPrices();
    }
  }, [selectedState, selectedCommodity, dateFrom, dateTo]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const formatPrice = (price: number, unit: string = 'Quintal') => {
    return `₹${price.toLocaleString('en-IN')}/${unit}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getPriceTrend = (minPrice?: number, maxPrice?: number, modalPrice?: number) => {
    if (!minPrice || !maxPrice || !modalPrice) return null;
    
    const midPoint = (minPrice + maxPrice) / 2;
    if (modalPrice > midPoint) return 'up';
    if (modalPrice < midPoint) return 'down';
    return 'same';
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderStatsCards = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Market price entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">States Covered</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStates}</div>
            <p className="text-xs text-muted-foreground">Indian states</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commodities</CardTitle>
            <Wheat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCommodities}</div>
            <p className="text-xs text-muted-foreground">Agricultural products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {formatDate(stats.lastUpdated)}
            </div>
            <p className="text-xs text-muted-foreground">Latest sync</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderFilters = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters & Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search commodity, market, state..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* State Filter */}
          <div>
            <Label htmlFor="state">State</Label>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger>
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-states">All States</SelectItem>
                {INDIAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Commodity Filter */}
          <div>
            <Label htmlFor="commodity">Commodity</Label>
            <Select value={selectedCommodity} onValueChange={setSelectedCommodity}>
              <SelectTrigger>
                <SelectValue placeholder="All Commodities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-commodities">All Commodities</SelectItem>
                {availableCommodities
                  .filter(commodity => commodity && commodity.trim().length > 0)
                  .map((commodity) => (
                    <SelectItem key={commodity} value={commodity}>
                      {commodity}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date From */}
          <div>
            <Label htmlFor="dateFrom">From Date</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          {/* Date To */}
          <div>
            <Label htmlFor="dateTo">To Date</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {/* Sort Field */}
          <div>
            <Label htmlFor="sort">Sort By</Label>
            <Select value={`${sortField}-${sortDirection}`} onValueChange={(value) => {
              const [field, direction] = value.split('-');
              setSortField(field);
              setSortDirection(direction as 'asc' | 'desc');
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                <SelectItem value="modal_price-desc">Price (High to Low)</SelectItem>
                <SelectItem value="modal_price-asc">Price (Low to High)</SelectItem>
                <SelectItem value="commodity-asc">Commodity (A-Z)</SelectItem>
                <SelectItem value="commodity-desc">Commodity (Z-A)</SelectItem>
                <SelectItem value="state-asc">State (A-Z)</SelectItem>
                <SelectItem value="state-desc">State (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setSelectedState('all-states');
              setSelectedCommodity('all-commodities');
              setDateFrom('');
              setDateTo('');
            }}
          >
            Clear Filters
          </Button>
          
          {showRefreshButton && (
            <Button
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderTable = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Market Prices ({filteredPrices.length} records)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading market prices...
          </div>
        ) : filteredPrices.length === 0 ? (
          <div className="text-center p-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No market prices found matching your criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Commodity</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Variety</TableHead>
                  <TableHead>Min Price</TableHead>
                  <TableHead>Max Price</TableHead>
                  <TableHead>Modal Price</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrices.map((price, index) => {
                  const trend = getPriceTrend(price.min_price, price.max_price, price.modal_price);
                  
                  return (
                    <TableRow key={price.id || index}>
                      <TableCell className="font-medium">
                        {price.commodity}
                      </TableCell>
                      <TableCell>{price.state}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {price.market}
                      </TableCell>
                      <TableCell>
                        {price.variety ? (
                          <Badge variant="secondary" className="text-xs">
                            {price.variety}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {price.min_price ? formatPrice(price.min_price, price.unit) : '-'}
                      </TableCell>
                      <TableCell>
                        {price.max_price ? formatPrice(price.max_price, price.unit) : '-'}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(price.modal_price, price.unit)}
                      </TableCell>
                      <TableCell>{formatDate(price.date)}</TableCell>
                      <TableCell>
                        {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                        {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                        {trend === 'same' && <span className="text-muted-foreground">-</span>}
                        {trend === null && <span className="text-muted-foreground">-</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {renderStatsCards()}
      {renderFilters()}
      {renderTable()}
    </div>
  );
}
