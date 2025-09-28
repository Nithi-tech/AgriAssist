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
  Table as TableIcon,
  LayoutGrid,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Import the JSON data directly
import schemeData from '../../../data/welfare_schemes.json';

interface GovernmentScheme {
  id: string;
  scheme_name: string;
  state: string;
  eligibility: string;
  link: string;
  explanation: string;
  source_url: string;
  scraped_at: string;
}

interface FilterState {
  searchTerm: string;
  selectedState: string;
}

interface SortConfig {
  key: keyof GovernmentScheme | null;
  direction: 'asc' | 'desc';
}

export default function GovernmentSchemesTable() {
  // UI states
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedState: 'All'
  });
  
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Extract schemes and stats from imported JSON
  const schemes: GovernmentScheme[] = schemeData.schemes;
  const stats = schemeData.meta;
  
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
    
    return filtered;
  }, [schemes, filters]);

  /**
   * STEP 4: Sorting logic
   */
  const sortedSchemes = useMemo(() => {
    if (!sortConfig.key) return filteredSchemes;
    
    return [...filteredSchemes].sort((a, b) => {
      const aVal = a[sortConfig.key!];
      const bVal = b[sortConfig.key!];
      
      // Handle undefined/null values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      
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
      selectedState: 'All'
    });
    setSortConfig({ key: null, direction: 'asc' });
    setExpandedRows(new Set());
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

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
                <TableIcon className="h-4 w-4" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Search Schemes</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by scheme name, eligibility, or description..."
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
          </div>

          {/* Filter Summary and Reset */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{sortedSchemes.length}</span> of <span className="font-medium">{schemes.length}</span> schemes match your filters
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date(stats.last_updated).toLocaleDateString()}
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
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          <button
                            onClick={() => handleSort('scheme_name')}
                            className="flex items-center gap-1 hover:text-gray-900"
                          >
                            Scheme Name
                            {sortConfig.key === 'scheme_name' && (
                              sortConfig.direction === 'asc' 
                                ? <ChevronDown className="h-4 w-4" />
                                : <ChevronUp className="h-4 w-4" />
                            )}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          <button
                            onClick={() => handleSort('state')}
                            className="flex items-center gap-1 hover:text-gray-900"
                          >
                            State
                            {sortConfig.key === 'state' && (
                              sortConfig.direction === 'asc' 
                                ? <ChevronDown className="h-4 w-4" />
                                : <ChevronUp className="h-4 w-4" />
                            )}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Details</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedSchemes.map((scheme) => (
                        <tr key={scheme.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">{scheme.scheme_name}</div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <MapPin className="h-3 w-3" />
                              {scheme.state}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-2">
                              <div>
                                <span className="font-medium">Eligibility:</span>
                                <p className="text-sm text-gray-600">
                                  {expandedRows.has(scheme.id) 
                                    ? scheme.eligibility
                                    : truncateText(scheme.eligibility)}
                                </p>
                              </div>
                              <div>
                                <span className="font-medium">Description:</span>
                                <p className="text-sm text-gray-600">
                                  {expandedRows.has(scheme.id)
                                    ? scheme.explanation
                                    : truncateText(scheme.explanation)}
                                </p>
                              </div>
                              {(scheme.eligibility.length > 150 || scheme.explanation.length > 150) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleExpandRow(scheme.id)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  {expandedRows.has(scheme.id) ? (
                                    <>Show Less <ChevronUp className="h-4 w-4 ml-1" /></>
                                  ) : (
                                    <>Read More <ChevronDown className="h-4 w-4 ml-1" /></>
                                  )}
                                </Button>
                              )}
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
                                  Apply Now
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
                <Card key={scheme.id} className="hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {scheme.scheme_name}
                      </h3>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <MapPin className="h-3 w-3" />
                        {scheme.state}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Eligibility:</span>
                        <p className="text-sm text-gray-600">
                          {expandedRows.has(scheme.id)
                            ? scheme.eligibility
                            : truncateText(scheme.eligibility)}
                        </p>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-700">Description:</span>
                        <p className="text-sm text-gray-600">
                          {expandedRows.has(scheme.id)
                            ? scheme.explanation
                            : truncateText(scheme.explanation)}
                        </p>
                      </div>

                      {(scheme.eligibility.length > 150 || scheme.explanation.length > 150) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpandRow(scheme.id)}
                          className="text-blue-600 hover:text-blue-800 p-0"
                        >
                          {expandedRows.has(scheme.id) ? (
                            <>Show Less <ChevronUp className="h-4 w-4 ml-1" /></>
                          ) : (
                            <>Read More <ChevronDown className="h-4 w-4 ml-1" /></>
                          )}
                        </Button>
                      )}
                    </div>

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
