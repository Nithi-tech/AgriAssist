/**
 * Government Sales Center Page
 * Displays commodity prices from eNAM with Agmarknet fallback
 */

'use client';

import { useState, useEffect } from 'react';
import { useUnifiedTranslation } from '@/hooks/use-unified-translation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Search, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { ENAMQuery, ENAMResponse, ENAMRow } from '@/types/enam';

// Indian states for dropdown
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

// Common commodities
const COMMON_COMMODITIES = [
  'Wheat', 'Rice', 'Maize', 'Barley', 'Jowar', 'Bajra', 'Gram', 'Tur',
  'Moong', 'Urad', 'Mustard', 'Groundnut', 'Soybean', 'Sunflower',
  'Cotton', 'Sugarcane', 'Onion', 'Potato', 'Tomato'
];

export default function GovernmentSalesCenterPage() {
  const { t } = useUnifiedTranslation();
  
  // State management
  const [query, setQuery] = useState<ENAMQuery>({});
  const [marketData, setMarketData] = useState<ENAMRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [dataSource, setDataSource] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  // Search form state
  const [searchForm, setSearchForm] = useState<ENAMQuery>({
    state: '',
    district: '',
    mandi: '',
    commodity: '',
    date: ''
  });

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
    setSearchForm(prev => ({
      ...prev,
      date: new Date().toISOString().split('T')[0] // Today's date
    }));
  }, []);

  // Load initial data only after mounting
  useEffect(() => {
    if (mounted) {
      fetchMarketData({});
    }
  }, [mounted]);

  // Fetch market data from API
  const fetchMarketData = async (searchQuery: ENAMQuery) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      if (searchQuery.state) params.set('state', searchQuery.state);
      if (searchQuery.district) params.set('district', searchQuery.district);
      if (searchQuery.mandi) params.set('mandi', searchQuery.mandi);
      if (searchQuery.commodity) params.set('commodity', searchQuery.commodity);
      if (searchQuery.date) params.set('date', searchQuery.date);

      const response = await fetch(`/api/government-sales-center?${params.toString()}`);
      const data: ENAMResponse = await response.json();

      if (data.success && data.data) {
        setMarketData(data.data);
        setLastUpdated(data.lastUpdated || null);
        setFallbackUsed(data.error?.fallbackUsed || false);
        setDataSource(data.data[0]?.source || 'eNAM');
        setQuery(searchQuery);
      } else {
        setError(data.error?.message || 'Failed to fetch market data');
        setMarketData([]);
      }
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Network error: Unable to fetch market data');
      setMarketData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMarketData(searchForm);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchMarketData(query);
  };

  // Export data as CSV
  const exportToCSV = () => {
    if (marketData.length === 0) return;

    const headers = ['State', 'District', 'Mandi', 'Commodity', 'Variety', 'Unit', 'Min Price', 'Max Price', 'Modal Price', 'Date', 'Source'];
    const csvContent = [
      headers.join(','),
      ...marketData.map(row => [
        row.state,
        row.district || '',
        row.mandiName || '',
        row.commodity,
        row.variety || '',
        row.unit || '',
        row.minPrice || '',
        row.maxPrice || '',
        row.modalPrice || '',
        row.arrivalDate,
        row.source
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `government-sales-center-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Don't render anything until mounted (SSR safety)
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="mb-8">
            <div className="h-10 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse" />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {t('Government Sales Center', 'Government Sales Center')}
        </h1>
        <p className="text-lg text-gray-600">
          {t('Real-time commodity prices from eNAM and Agmarknet', 'Real-time commodity prices from eNAM and Agmarknet')}
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            {t('Search Market Data', 'Search Market Data')}
          </CardTitle>
          <CardDescription>
            {t('Filter commodity prices by location, commodity, and date', 'Filter commodity prices by location, commodity, and date')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* State Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('State', 'State')}
                </label>
                <Select
                  value={searchForm.state || 'all'}
                  onValueChange={(value) => setSearchForm(prev => ({ ...prev, state: value === 'all' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select State', 'Select State')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All States', 'All States')}</SelectItem>
                    {INDIAN_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('District', 'District')}
                </label>
                <Input
                  type="text"
                  placeholder={t('Enter district name', 'Enter district name')}
                  value={searchForm.district || ''}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, district: e.target.value }))}
                />
              </div>

              {/* Mandi */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('Mandi/Market', 'Mandi/Market')}
                </label>
                <Input
                  type="text"
                  placeholder={t('Enter mandi name', 'Enter mandi name')}
                  value={searchForm.mandi || ''}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, mandi: e.target.value }))}
                />
              </div>

              {/* Commodity */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('Commodity', 'Commodity')}
                </label>
                <Select
                  value={searchForm.commodity || 'all'}
                  onValueChange={(value) => setSearchForm(prev => ({ ...prev, commodity: value === 'all' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select Commodity', 'Select Commodity')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All Commodities', 'All Commodities')}</SelectItem>
                    {COMMON_COMMODITIES.map(commodity => (
                      <SelectItem key={commodity} value={commodity}>{commodity}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('Date', 'Date')}
                </label>
                <Input
                  type="date"
                  value={searchForm.date || ''}
                  onChange={(e) => setSearchForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>

            {/* Search Actions */}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {t('Searching...', 'Searching...')}
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    {t('Search', 'Search')}
                  </>
                )}
              </Button>
              
              <Button type="button" variant="outline" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {t('Refresh', 'Refresh')}
              </Button>
              
              {marketData.length > 0 && (
                <Button type="button" variant="outline" onClick={exportToCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  {t('Export CSV', 'Export CSV')}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Status Alerts */}
      {fallbackUsed && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('Fallback Data Source', 'Fallback Data Source')}</AlertTitle>
          <AlertDescription>
            {t('eNAM data unavailable. Showing data from Agmarknet.', 'eNAM data unavailable. Showing data from Agmarknet.')}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('Error', 'Error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Data Info */}
      {(lastUpdated || dataSource) && (
        <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-600">
          {lastUpdated && (
            <span>
              {t('Last Updated', 'Last Updated')}: {new Date(lastUpdated).toLocaleString()}
            </span>
          )}
          {dataSource && (
            <Badge variant="secondary">
              {t('Source', 'Source')}: {dataSource}
            </Badge>
          )}
          {marketData.length > 0 && (
            <span>
              {t('Total Records', 'Total Records')}: {marketData.length}
            </span>
          )}
        </div>
      )}

      {/* Market Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {t('Market Data', 'Market Data')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : marketData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('State', 'State')}</TableHead>
                    <TableHead>{t('District', 'District')}</TableHead>
                    <TableHead>{t('Mandi', 'Mandi')}</TableHead>
                    <TableHead>{t('Commodity', 'Commodity')}</TableHead>
                    <TableHead>{t('Variety', 'Variety')}</TableHead>
                    <TableHead>{t('Unit', 'Unit')}</TableHead>
                    <TableHead className="text-right">{t('Min Price (₹)', 'Min Price (₹)')}</TableHead>
                    <TableHead className="text-right">{t('Max Price (₹)', 'Max Price (₹)')}</TableHead>
                    <TableHead className="text-right">{t('Modal Price (₹)', 'Modal Price (₹)')}</TableHead>
                    <TableHead>{t('Date', 'Date')}</TableHead>
                    <TableHead>{t('Source', 'Source')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.state}</TableCell>
                      <TableCell>{row.district || '-'}</TableCell>
                      <TableCell>{row.mandiName || '-'}</TableCell>
                      <TableCell>{row.commodity}</TableCell>
                      <TableCell>{row.variety || '-'}</TableCell>
                      <TableCell>{row.unit || '-'}</TableCell>
                      <TableCell className="text-right">
                        {row.minPrice ? `₹${row.minPrice.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.maxPrice ? `₹${row.maxPrice.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {row.modalPrice ? `₹${row.modalPrice.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>{new Date(row.arrivalDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={row.source === 'eNAM' ? 'default' : 'secondary'}>
                          {row.source}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">
                {t('No market data available', 'No market data available')}
              </p>
              <p className="text-sm">
                {t('Try adjusting your search criteria or refresh the data', 'Try adjusting your search criteria or refresh the data')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
