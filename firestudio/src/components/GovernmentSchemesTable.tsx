'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  MapPin,
  RefreshCw,
  Table,
  LayoutGrid,
  SortAsc,
  SortDesc,
  ChevronDown,
  ChevronUp,
  IndianRupee
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';

// Import the JSON data directly
import schemeData from '../../data/welfare_schemes.json';

// Type definition matching your exact table structure
interface GovernmentScheme {
  id: string;
  scheme_name: string;
  state: string;
  eligibility: string;
  link: string;
  explanation: string;
  source_url: string;
  scraped_at: string;
  category?: string;
  benefit_amount?: number;
}

interface FilterState {
  searchTerm: string;
  selectedState: string;
  selectedCategory: string;
  benefitAmountRange: [number, number];
}

interface SortConfig {
  key: keyof GovernmentScheme | null;
  direction: 'asc' | 'desc';
}

export default function GovernmentSchemesTable() {
  // Extract schemes and stats from imported JSON (moved to top)
  const schemes = schemeData.schemes as GovernmentScheme[];
  const stats = schemeData.meta;
  
  // Constants
  const categories = useMemo(() => {
    return [...new Set(schemes.map(scheme => scheme.category || '').filter(Boolean))].sort();
  }, [schemes]);

  const maxBenefitAmount = useMemo(() => {
    return Math.max(...schemes.map(scheme => scheme.benefit_amount || 0));
  }, [schemes]);

  // UI states
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedState: 'All',
    selectedCategory: 'All',
    benefitAmountRange: [0, maxBenefitAmount]
  });
  
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Get unique states
  const states = useMemo(() => {
    return [...new Set(schemes.map(scheme => scheme.state))].sort();
  }, [schemes]);

  const toggleExpandRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  /**
   * STEP 3: Client-side filtering logic
   */
  const filteredSchemes = useMemo(() => {
    let filtered = [...schemes];
    
    // Text search in scheme_name, eligibility, and explanation
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(scheme => 
        scheme.scheme_name.toLowerCase().includes(searchLower) ||
        scheme.eligibility.toLowerCase().includes(searchLower) ||
        scheme.explanation.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by state
    if (filters.selectedState !== 'All') {
      filtered = filtered.filter(scheme => scheme.state === filters.selectedState);
    }

    // Filter by category
    if (filters.selectedCategory !== 'All') {
      filtered = filtered.filter(scheme => (scheme as GovernmentScheme).category === filters.selectedCategory);
    }

    // Filter by benefit amount range
    filtered = filtered.filter(scheme => {
      const amount = (scheme as GovernmentScheme).benefit_amount || 0;
      return amount >= filters.benefitAmountRange[0] && amount <= filters.benefitAmountRange[1];
    });
    
    return filtered;
  }, [schemes, filters]);

  /**
   * STEP 4: Sorting logic
   */
  const sortedSchemes = useMemo(() => {
    if (!sortConfig.key) return filteredSchemes;
    
    return [...filteredSchemes].sort((a, b) => {
      const aVal = (a as any)[sortConfig.key!];
      const bVal = (b as any)[sortConfig.key!];
      
      // Handle undefined/null values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1; // Put nulls at end
      if (bVal == null) return -1; // Put nulls at end
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredSchemes, sortConfig]);

  /**
   * STEP 5: Helper functions
   */
  const handleSort = (key: keyof GovernmentScheme) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: '',
      selectedState: 'All',
      selectedCategory: 'All',
      benefitAmountRange: [0, maxBenefitAmount]
    });
    setSortConfig({ key: null, direction: 'asc' });
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount || isNaN(Number(amount))) return 'Not specified';
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const getCategoryBadgeColor = (category?: string) => {
    const colors: Record<string, string> = {
      'Agriculture': 'bg-green-100 text-green-800 border-green-300',
      'Education': 'bg-blue-100 text-blue-800 border-blue-300',
      'Health': 'bg-red-100 text-red-800 border-red-300',
      'Housing': 'bg-purple-100 text-purple-800 border-purple-300',
      'Business': 'bg-orange-100 text-orange-800 border-orange-300',
      'Employment': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Social Welfare': 'bg-pink-100 text-pink-800 border-pink-300',
    };
    return colors[category || ''] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // No loading or error states needed since we're using static data

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Government Schemes Portal</h1>
            <p className="text-blue-100">Find and apply for government welfare schemes</p>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <div className="text-2xl font-bold">{schemes.length}</div>
              <div className="text-sm text-blue-100">Total Schemes</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{states.length}</div>
              <div className="text-sm text-blue-100">States Covered</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{categories.length}</div>
              <div className="text-sm text-blue-100">Categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Search
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <Table className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* First Row: Search and Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Search Schemes</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by scheme name or eligibility..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">State</label>
              <Select 
                value={filters.selectedState} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, selectedState: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All States ({states.length})</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {state}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <Select 
                value={filters.selectedCategory} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, selectedCategory: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories ({categories.length})</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      <Badge variant="outline" className={getCategoryBadgeColor(category)}>
                        {category}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Second Row: Range Slider */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Benefit Amount Range: ₹{filters.benefitAmountRange[0].toLocaleString()} - ₹{filters.benefitAmountRange[1].toLocaleString()}
            </label>
            <Slider
              value={filters.benefitAmountRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, benefitAmountRange: value as [number, number] }))}
              max={maxBenefitAmount}
              min={0}
              step={1000}
              className="w-full"
            />
          </div>

          {/* Filter Summary and Reset */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{sortedSchemes.length}</span> of <span className="font-medium">{schemes.length}</span> schemes match your filters
            </div>
            <Button variant="outline" onClick={resetFilters} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset All Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      {sortedSchemes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="space-y-3">
              <div className="text-gray-400">
                <Search className="h-12 w-12 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No schemes found</h3>
              <p className="text-gray-500">
                Try adjusting your filters or search terms to find relevant schemes.
              </p>
              <Button variant="outline" onClick={resetFilters}>
                Clear All Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'table' ? (
            /* Table View */
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {[
                          { key: 'scheme_name' as const, label: 'Scheme Name' },
                          { key: 'state' as const, label: 'State' },
                          { key: 'eligibility' as const, label: 'Eligibility' },
                          { key: 'category' as const, label: 'Category' },
                          { key: 'benefit_amount' as const, label: 'Benefit Amount' },
                          { key: null, label: 'Action' }
                        ].map(({ key, label }) => (
                          <th 
                            key={label} 
                            className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                          >
                            {key ? (
                              <button
                                onClick={() => handleSort(key)}
                                className="flex items-center gap-1 hover:text-gray-900"
                              >
                                {label}
                                {sortConfig.key === key && (
                                  sortConfig.direction === 'asc' 
                                    ? <SortAsc className="h-4 w-4" />
                                    : <SortDesc className="h-4 w-4" />
                                )}
                              </button>
                            ) : (
                              label
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedSchemes.map((scheme) => (
                        <tr key={scheme.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900">{scheme.scheme_name}</div>
                              {scheme.explanation && (
                                <div className="text-sm text-gray-600 truncate max-w-xs">
                                  {scheme.explanation}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <MapPin className="h-3 w-3" />
                              {scheme.state}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 max-w-xs">
                            <p className="text-sm text-gray-700 line-clamp-2">{scheme.eligibility}</p>
                          </td>
                          <td className="px-4 py-4">
                            {(scheme as GovernmentScheme).category ? (
                              <Badge className={getCategoryBadgeColor((scheme as GovernmentScheme).category)}>
                                {(scheme as GovernmentScheme).category}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">Not specified</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1 text-sm font-medium text-green-700">
                              <IndianRupee className="h-4 w-4" />
                              {formatCurrency((scheme as GovernmentScheme).benefit_amount)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {scheme.link && (
                              <Button size="sm" asChild>
                                <a 
                                  href={scheme.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2"
                                >
                                  Apply
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedSchemes.map((scheme) => (
                <Card key={scheme.id} className="hover:shadow-lg transition-all duration-200 hover:scale-105">
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
                        {scheme.scheme_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {scheme.state}
                      </div>
                    </div>

                    {(scheme as GovernmentScheme).category && (
                      <Badge className={getCategoryBadgeColor((scheme as GovernmentScheme).category)}>
                        {(scheme as GovernmentScheme).category}
                      </Badge>
                    )}

                    {scheme.benefit_amount && (
                      <div className="flex items-center gap-1 text-green-700 font-medium">
                        <IndianRupee className="h-4 w-4" />
                        {formatCurrency(scheme.benefit_amount)}
                      </div>
                    )}

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Eligibility:</h4>
                      <p className="text-sm text-gray-600 line-clamp-3">{scheme.eligibility}</p>
                    </div>

                    {scheme.explanation && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Description:</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{scheme.explanation}</p>
                      </div>
                    )}

                    {scheme.link && (
                      <Button className="w-full" asChild>
                        <a 
                          href={scheme.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2"
                        >
                          Apply Now
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
