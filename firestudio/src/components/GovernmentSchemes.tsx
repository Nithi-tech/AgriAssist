'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
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
  Heart,
  Shield,
  TrendingUp,
  Banknote,
  Crop
} from 'lucide-react';

// Interface for the CSV data structure
interface GovernmentScheme {
  state: string;
  scheme_name: string;
  about: string;
  eligibility: string;
  link: string;
}

export default function GovernmentSchemes() {
  // State management
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [filteredSchemes, setFilteredSchemes] = useState<GovernmentScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Load CSV data using papaparse
  useEffect(() => {
    const loadSchemes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/government_schemes_clean.csv');
        if (!response.ok) {
          throw new Error('Failed to fetch CSV file');
        }
        
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
          complete: (results) => {
            if (results.errors.length > 0) {
              console.warn('CSV parsing warnings:', results.errors);
            }
            
            // Filter out the header row if it contains "SCHEME", "EXPLANATION", etc.
            const cleanedData = results.data.filter((row: any) => {
              return row.scheme_name && 
                     !row.scheme_name.includes('SCHEME') && 
                     !row.scheme_name.includes('EXPLANATION') &&
                     row.state &&
                     row.about &&
                     row.eligibility;
            });
            
            setSchemes(cleanedData);
            setFilteredSchemes(cleanedData);
            setLoading(false);
          },
          error: (error) => {
            setError('Error parsing CSV file: ' + error.message);
            setLoading(false);
          }
        });
      } catch (err) {
        setError('Error loading schemes: ' + (err instanceof Error ? err.message : 'Unknown error'));
        setLoading(false);
      }
    };

    loadSchemes();
  }, []);

  // Get unique states for the dropdown
  const uniqueStates = useMemo(() => {
    const states = [...new Set(schemes.map(scheme => scheme.state))].sort();
    return states;
  }, [schemes]);

  // Filter schemes based on search term and selected state
  useEffect(() => {
    let filtered = schemes;

    // Filter by state
    if (selectedState !== 'all') {
      filtered = filtered.filter(scheme => 
        scheme.state.toLowerCase() === selectedState.toLowerCase()
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(scheme =>
        scheme.scheme_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scheme.about.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scheme.eligibility.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSchemes(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [schemes, searchTerm, selectedState]);

  // Pagination logic
  const totalPages = Math.ceil(filteredSchemes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSchemes = filteredSchemes.slice(startIndex, endIndex);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedState('all');
    setCurrentPage(1);
  };

  // Format scheme name for display
  const formatSchemeName = (name: string) => {
    return name.replace(/\*/g, '').trim();
  };

  // Clean and format about text
  const formatAboutText = (text: string) => {
    if (!text) return '';
    return text.replace(/\n/g, ' ').trim();
  };

  // Extract website domain from URL for display
  const getWebsiteDomain = (url: string) => {
    try {
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return url;
    }
  };

  // Handle external link clicks
  const handleLinkClick = (url: string) => {
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = 'https://' + url;
    }
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-amber-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[600px]">
            <div className="relative mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center shadow-xl">
                <RefreshCw className="w-10 h-10 animate-spin text-white" />
              </div>
              <div className="absolute inset-0 animate-ping">
                <div className="w-20 h-20 bg-green-400 rounded-full opacity-20"></div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Loading Government Schemes</h2>
            <p className="text-xl text-gray-600 mb-6 text-center max-w-md">
              Please wait while we fetch the latest agricultural schemes and subsidies for you...
            </p>
            <div className="flex items-center gap-2 text-green-600">
              <Shield className="h-5 w-5" />
              <span className="font-medium">Secured by Government Database</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[500px]">
            <Card className="max-w-2xl mx-auto shadow-2xl border-red-200">
              <CardContent className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                  <AlertCircle className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-red-800 mb-4">Unable to Load Schemes</h2>
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700 font-medium text-lg">
                    {error}
                  </AlertDescription>
                </Alert>
                <p className="text-gray-600 mb-6">
                  We're having trouble connecting to the government schemes database. 
                  Please check your internet connection and try again.
                </p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="bg-red-600 hover:bg-red-700 text-white shadow-lg"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-amber-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Enhanced Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-600 to-blue-600 rounded-full mb-6 shadow-xl">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-700 via-blue-700 to-amber-700 bg-clip-text text-transparent mb-6">
            🇮🇳 Government Schemes for Farmers
          </h1>
          <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
            Discover comprehensive agricultural schemes, subsidies, and financial assistance programs 
            designed specially for Indian farmers. Your gateway to government support and prosperity.
          </p>
          <div className="flex justify-center items-center gap-2 mt-4">
            <Heart className="h-5 w-5 text-red-500" />
            <span className="text-gray-600 font-medium">Supporting farmers across India</span>
            <Heart className="h-5 w-5 text-red-500" />
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-100 to-emerald-100 border-green-300 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="flex items-center p-6">
              <div className="bg-green-200 p-3 rounded-full mr-4">
                <Database className="h-8 w-8 text-green-700" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-800">{schemes.length}</p>
                <p className="text-green-600 font-medium">Total Schemes</p>
                <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>Active programs</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-300 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="flex items-center p-6">
              <div className="bg-blue-200 p-3 rounded-full mr-4">
                <MapPin className="h-8 w-8 text-blue-700" />
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-800">{uniqueStates.length}</p>
                <p className="text-blue-600 font-medium">States Covered</p>
                <div className="flex items-center gap-1 text-xs text-blue-500 mt-1">
                  <Globe className="h-3 w-3" />
                  <span>Nationwide reach</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-100 to-indigo-100 border-purple-300 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="flex items-center p-6">
              <div className="bg-purple-200 p-3 rounded-full mr-4">
                <Target className="h-8 w-8 text-purple-700" />
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-800">{filteredSchemes.length}</p>
                <p className="text-purple-600 font-medium">Filtered Results</p>
                <div className="flex items-center gap-1 text-xs text-purple-500 mt-1">
                  <Search className="h-3 w-3" />
                  <span>Smart filtered</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-100 to-amber-100 border-orange-300 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <CardContent className="flex items-center p-6">
              <div className="bg-orange-200 p-3 rounded-full mr-4">
                <Banknote className="h-8 w-8 text-orange-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-800">₹ Crores</p>
                <p className="text-orange-600 font-medium">Funds Available</p>
                <div className="flex items-center gap-1 text-xs text-orange-500 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>Financial support</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Info Alert */}
        <div className="mb-8">
          <Alert className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300 shadow-lg">
            <Info className="h-5 w-5 text-blue-600" />
            <AlertDescription className="text-blue-800 font-medium text-lg">
              🌟 <strong>Farmer's Guide:</strong> Use our smart search and filter system below to discover government schemes 
              specifically designed for your state and farming needs. Every scheme is verified and links directly to official application pages.
            </AlertDescription>
          </Alert>
        </div>

        {/* Enhanced Search and Filter Section */}
        <Card className="bg-gradient-to-r from-white to-gray-50 border-gray-200 shadow-2xl mb-8">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <Filter className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-800">Smart Search & Filters</CardTitle>
                <p className="text-gray-600 mt-1">Find the perfect government scheme for your farming needs</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Enhanced Search Bar */}
              <div className="relative flex-1 w-full lg:w-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="🔍 Search schemes by name, benefits, eligibility criteria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 w-full h-14 text-lg border-gray-300 focus:border-green-500 bg-white shadow-sm"
                />
              </div>

              {/* Enhanced State Filter */}
              <div className="w-full lg:w-64">
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="h-14 border-gray-300 focus:border-green-500 bg-white shadow-sm">
                    <SelectValue placeholder="🗺️ Select Your State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🇮🇳 All States & UTs</SelectItem>
                    {uniqueStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        📍 {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Enhanced Clear Filters Button */}
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="w-full lg:w-auto h-14 border-amber-300 text-amber-700 hover:bg-amber-50 shadow-sm"
              >
                <Filter className="h-5 w-5 mr-2" />
                Clear All Filters
              </Button>
            </div>

            {/* Enhanced Filter Summary */}
            {(searchTerm || selectedState !== 'all') && (
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 font-medium">Active filters:</span>
                </div>
                {searchTerm && (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 text-sm">
                    🔍 Search: "{searchTerm}"
                  </Badge>
                )}
                {selectedState !== 'all' && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1 text-sm">
                    🗺️ State: {selectedState}
                  </Badge>
                )}
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1 text-sm">
                  📊 {filteredSchemes.length} schemes found
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {filteredSchemes.length === 0 ? (
          <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 shadow-xl">
            <CardContent className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4">No schemes match your criteria</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Don't worry! Try adjusting your search terms or state selection to discover more opportunities.
              </p>
              <Button onClick={clearFilters} className="bg-green-600 hover:bg-green-700 text-white shadow-lg">
                <Crop className="h-5 w-5 mr-2" />
                View All Available Schemes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Enhanced Schemes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {currentSchemes.map((scheme, index) => (
                <Card key={`${scheme.state}-${index}`} className="h-full flex flex-col hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-white to-gray-50 border-gray-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {scheme.state}
                      </Badge>
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Shield className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 leading-tight mb-2">
                      {formatSchemeName(scheme.scheme_name)}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col space-y-4">
                    {/* Enhanced About Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        📋 Scheme Benefits
                      </h4>
                      <p className="text-sm text-blue-700 leading-relaxed">
                        {formatAboutText(scheme.about)}
                      </p>
                    </div>

                    {/* Enhanced Eligibility Section */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        ✅ Eligibility Criteria
                      </h4>
                      <p className="text-sm text-green-700 leading-relaxed">
                        {scheme.eligibility}
                      </p>
                    </div>

                    {/* Enhanced Action Button */}
                    <div className="mt-auto pt-4">
                      <Button 
                        onClick={() => handleLinkClick(scheme.link)}
                        className="w-full h-12 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Globe className="h-5 w-5 mr-2" />
                        Visit Official Portal
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        🔗 {getWebsiteDomain(scheme.link)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 shadow-xl">
                <CardContent className="py-6">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="text-lg text-gray-700 font-medium">
                      📊 Showing <span className="font-bold text-green-700">{startIndex + 1}-{Math.min(endIndex, filteredSchemes.length)}</span> of <span className="font-bold text-blue-700">{filteredSchemes.length}</span> government schemes
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border-gray-300 hover:bg-gray-50"
                      >
                        ← Previous
                      </Button>
                      
                      {/* Enhanced Page Numbers */}
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNumber = i + 1;
                          return (
                            <Button
                              key={pageNumber}
                              variant={currentPage === pageNumber ? "default" : "outline"}
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`px-4 py-2 min-w-[48px] ${
                                currentPage === pageNumber 
                                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                        {totalPages > 5 && (
                          <>
                            {totalPages > 6 && <span className="px-3 py-2 text-gray-500">...</span>}
                            <Button
                              variant={currentPage === totalPages ? "default" : "outline"}
                              onClick={() => setCurrentPage(totalPages)}
                              className={`px-4 py-2 min-w-[48px] ${
                                currentPage === totalPages 
                                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {totalPages}
                            </Button>
                          </>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border-gray-300 hover:bg-gray-50"
                      >
                        Next →
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
