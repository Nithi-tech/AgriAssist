'use client';

import React, { useState, useEffect } from 'react';
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
  Users, 
  IndianRupee,
  FileText,
  Calendar,
  Building
} from 'lucide-react';
import { 
  getAllWelfareSchemes,
  getFilteredWelfareSchemes,
  getUniqueStates,
  getUniqueCategories,
  getWelfareSchemeStats
} from '@/lib/supabaseWelfareClient';

// Type definitions
interface WelfareScheme {
  id: string;
  scheme_name: string;
  category: string;
  state: string;
  explanation: string;
  eligibility: string;
  benefit_amount: string;
  target_beneficiaries: string;
  implementing_agency: string;
  launch_year: number;
  application_process: string;
  documents_required: string;
  link: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface WelfareStats {
  totalSchemes: number | null;
  schemesByState: Record<string, number> | undefined;
  schemesByCategory: Record<string, number> | undefined;
}

interface Filters {
  state: string;
  category: string;
  targetBeneficiaries: string;
  searchTerm: string;
}

export default function WelfareSchemesBrowser() {
  const [schemes, setSchemes] = useState<WelfareScheme[]>([]);
  const [filteredSchemes, setFilteredSchemes] = useState<WelfareScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<WelfareStats | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [targetBeneficiary, setTargetBeneficiary] = useState('');
  
  // Dropdown options
  const [states, setStates] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // Load all schemes
        const { data: schemesData, error: schemesError } = await getAllWelfareSchemes();
        if (schemesError) throw new Error(schemesError);
        
        // Load dropdown options
        const { data: statesData } = await getUniqueStates();
        const { data: categoriesData } = await getUniqueCategories();
        const { data: statsData } = await getWelfareSchemeStats();
        
        setSchemes(schemesData || []);
        setFilteredSchemes(schemesData || []);
        setStates(statesData || []);
        setCategories(categoriesData || []);
        setStats(statsData);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Apply filters
  useEffect(() => {
    const applyFilters = async () => {
      const filters: Filters = {
        state: selectedState,
        category: selectedCategory,
        targetBeneficiaries: targetBeneficiary,
        searchTerm: searchTerm
      };

      // Remove empty filters
      Object.keys(filters).forEach(key => {
        const filterKey = key as keyof Filters;
        if (!filters[filterKey] || filters[filterKey] === 'All') {
          delete filters[filterKey];
        }
      });

      if (Object.keys(filters).length === 0) {
        setFilteredSchemes(schemes);
        return;
      }

      try {
        const { data, error } = await getFilteredWelfareSchemes(filters);
        if (error) throw new Error(error);
        setFilteredSchemes(data || []);
      } catch (err) {
        console.error('Filter error:', err);
        setFilteredSchemes(schemes);
      }
    };

    applyFilters();
  }, [searchTerm, selectedState, selectedCategory, targetBeneficiary, schemes]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedState('All');
    setSelectedCategory('All');
    setTargetBeneficiary('');
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Agriculture': 'bg-green-100 text-green-800',
      'Education': 'bg-blue-100 text-blue-800',
      'Health': 'bg-red-100 text-red-800',
      'Housing': 'bg-purple-100 text-purple-800',
      'Business': 'bg-orange-100 text-orange-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.default;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading welfare schemes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertDescription>
          Error loading welfare schemes: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Government Welfare Schemes</h1>
        <p className="text-gray-600">Discover government schemes and benefits available to you</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalSchemes}</div>
              <p className="text-sm text-gray-600">Total Schemes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{Object.keys(stats.schemesByState || {}).length}</div>
              <p className="text-sm text-gray-600">States Covered</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{Object.keys(stats.schemesByCategory || {}).length}</div>
              <p className="text-sm text-gray-600">Categories</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Schemes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search schemes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All States</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Target Group</label>
              <Input
                placeholder="e.g., Farmers, Women, BPL"
                value={targetBeneficiary}
                onChange={(e) => setTargetBeneficiary(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {filteredSchemes.length} of {schemes.length} schemes
            </p>
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schemes List */}
      <div className="space-y-4">
        {filteredSchemes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No schemes found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          filteredSchemes.map((scheme) => (
            <Card key={scheme.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">{scheme.scheme_name}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getCategoryColor(scheme.category)}>
                          {scheme.category}
                        </Badge>
                        {scheme.benefit_amount && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            {scheme.benefit_amount}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">State:</span>
                          <span>{scheme.state}</span>
                        </div>
                        
                        {scheme.target_beneficiaries && (
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">Target:</span>
                            <span>{scheme.target_beneficiaries}</span>
                          </div>
                        )}

                        {scheme.implementing_agency && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">Agency:</span>
                            <span>{scheme.implementing_agency}</span>
                          </div>
                        )}

                        {scheme.launch_year && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">Launched:</span>
                            <span>{scheme.launch_year}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-1">Eligibility:</h4>
                          <p className="text-sm text-gray-600">{scheme.eligibility}</p>
                        </div>
                      </div>
                    </div>

                    {/* Explanation */}
                    {scheme.explanation && (
                      <div className="mb-4">
                        <h4 className="font-medium text-sm text-gray-700 mb-1 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Description:
                        </h4>
                        <p className="text-sm text-gray-600">{scheme.explanation}</p>
                      </div>
                    )}

                    {/* Application Process */}
                    {scheme.application_process && (
                      <div className="mb-4">
                        <h4 className="font-medium text-sm text-gray-700 mb-1">How to Apply:</h4>
                        <p className="text-sm text-gray-600">{scheme.application_process}</p>
                      </div>
                    )}

                    {/* Documents Required */}
                    {scheme.documents_required && (
                      <div className="mb-4">
                        <h4 className="font-medium text-sm text-gray-700 mb-1">Documents Required:</h4>
                        <p className="text-sm text-gray-600">{scheme.documents_required}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  {scheme.link && (
                    <div className="lg:ml-4">
                      <Button asChild className="w-full lg:w-auto">
                        <a 
                          href={scheme.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          Apply Now
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
