'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ExternalLink, Filter, MapPin, FileText, AlertCircle, Database, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import mock data
import mockPolicies from '@/data/mock/agricultural_policies.json';

interface GovernmentScheme {
  id: number;
  state: string;
  scheme_name: string;
  explanation: string;
  eligibility_criteria: string;
  link: string;
  created_at: string;
}

interface FarmerProfile {
  farmSize?: string;
  cropTypes?: string[];
  income?: string;
  farmerType?: string;
}

interface SchemesListProps {
  userState?: string;
  userProfile?: FarmerProfile;
}

export default function SchemesList({ userState, userProfile }: SchemesListProps) {
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [filteredSchemes, setFilteredSchemes] = useState<GovernmentScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [showEligibleOnly, setShowEligibleOnly] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Fetch all schemes from mock data
  const fetchSchemes = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo('Fetching schemes from mock data...');

      console.log('🔍 Fetching schemes from mock data...');

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const schemesData = mockPolicies;
      setSchemes(schemesData);
      setFilteredSchemes(schemesData); // Show all by default
      setDebugInfo(`✅ Loaded ${schemesData.length} schemes from mock data`);
      
      console.log('✅ Successfully loaded mock schemes:', schemesData.length);
      if (schemesData.length > 0) {
        console.log('Sample scheme:', schemesData[0]);
      }

    } catch (err: any) {
      console.error('❌ Error fetching schemes:', err);
      setError(`Failed to load schemes: ${err.message || 'Unknown error'}`);
      setDebugInfo(`Error: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSchemes();
  }, []);

  // Get unique states for dropdown
  const uniqueStates = useMemo(() => {
    const states = [...new Set(schemes.map(scheme => scheme.state))];
    return states.sort();
  }, [schemes]);

  // Check eligibility based on farmer profile
  const checkEligibility = (scheme: GovernmentScheme): boolean => {
    if (!userProfile || !scheme.eligibility_criteria) return true;

    const criteria = scheme.eligibility_criteria.toLowerCase();
    
    // Basic eligibility checks
    let eligibilityScore = 0;
    
    // Farm size eligibility
    if (userProfile.farmSize) {
      const farmSize = parseFloat(userProfile.farmSize);
      if (criteria.includes('small farmer') && farmSize <= 2) eligibilityScore++;
      if (criteria.includes('marginal farmer') && farmSize <= 1) eligibilityScore++;
      if (criteria.includes('medium farmer') && farmSize > 2 && farmSize <= 5) eligibilityScore++;
      if (criteria.includes('large farmer') && farmSize > 5) eligibilityScore++;
    }

    // Income eligibility
    if (userProfile.income) {
      const income = parseFloat(userProfile.income);
      if (criteria.includes('below poverty') && income < 50000) eligibilityScore++;
      if (criteria.includes('low income') && income < 100000) eligibilityScore++;
    }

    // Farmer type
    if (userProfile.farmerType) {
      if (criteria.includes(userProfile.farmerType.toLowerCase())) eligibilityScore++;
    }

    return eligibilityScore > 0;
  };

  // Apply all filters
  useEffect(() => {
    let filtered = [...schemes];

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(scheme =>
        scheme.scheme_name.toLowerCase().includes(search) ||
        scheme.explanation.toLowerCase().includes(search) ||
        scheme.eligibility_criteria.toLowerCase().includes(search) ||
        scheme.state.toLowerCase().includes(search)
      );
    }

    // State filter
    if (selectedState !== 'all') {
      filtered = filtered.filter(scheme => 
        scheme.state.toLowerCase() === selectedState.toLowerCase()
      );
    }

    // Eligibility filter
    if (showEligibleOnly && userProfile) {
      filtered = filtered.filter(scheme => checkEligibility(scheme));
    }

    setFilteredSchemes(filtered);
    console.log(`🔍 Applied filters: ${filtered.length}/${schemes.length} schemes`);
  }, [schemes, searchTerm, selectedState, showEligibleOnly, userProfile]);

  const handleSchemeClick = (link: string) => {
    if (link && (link.startsWith('http') || link.startsWith('www'))) {
      const url = link.startsWith('http') ? link : `https://${link}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading government schemes...</span>
        </div>
        {debugInfo && (
          <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
            Debug: {debugInfo}
          </div>
        )}
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchSchemes}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
        {debugInfo && (
          <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
            Debug: {debugInfo}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with counter */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Government Schemes</h2>
          <Badge variant="secondary" className="text-sm">
            {filteredSchemes.length} of {schemes.length} schemes
          </Badge>
        </div>

        {/* Debug info */}
        {debugInfo && (
          <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
            Debug: {debugInfo}
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search schemes by name, description, or eligibility..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* State Filter */}
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {uniqueStates.map(state => (
                <SelectItem key={state} value={state}>
                  {state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Eligibility Filter */}
          {userProfile && (
            <Button
              variant={showEligibleOnly ? "default" : "outline"}
              onClick={() => setShowEligibleOnly(!showEligibleOnly)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Eligible Only
            </Button>
          )}

          {/* Refresh Button */}
          <Button
            variant="outline"
            onClick={fetchSchemes}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* User Info */}
        {userState && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>Your state: {userState}</span>
          </div>
        )}
      </div>

      {/* Schemes List */}
      {filteredSchemes.length === 0 && schemes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No schemes found</h3>
            <p className="text-gray-600 mb-4">
              No government schemes are currently available in the database.
            </p>
            <Button onClick={fetchSchemes} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Loading
            </Button>
          </CardContent>
        </Card>
      ) : filteredSchemes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No matching schemes</h3>
            <p className="text-gray-600">
              No schemes match your current filters. Try adjusting your search or filters.
            </p>
            <div className="mt-4 flex gap-2 justify-center">
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedState('all');
                  setShowEligibleOnly(false);
                }} 
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSchemes.map((scheme) => {
            const isEligible = userProfile ? checkEligibility(scheme) : true;
            
            return (
              <Card 
                key={scheme.id} 
                className={`transition-all hover:shadow-md ${
                  !isEligible ? 'opacity-75 border-gray-200' : 'border-green-200 hover:border-green-300'
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-900 mb-1">
                        {scheme.scheme_name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {scheme.state}
                        {userProfile && (
                          <Badge 
                            variant={isEligible ? "default" : "secondary"}
                            className="ml-2"
                          >
                            {isEligible ? "Eligible" : "Check Eligibility"}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                    {scheme.link && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSchemeClick(scheme.link)}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Apply
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* Explanation */}
                    {scheme.explanation && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {scheme.explanation.length > 200 
                            ? `${scheme.explanation.substring(0, 200)}...` 
                            : scheme.explanation}
                        </p>
                      </div>
                    )}

                    {/* Eligibility Criteria */}
                    {scheme.eligibility_criteria && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Eligibility Criteria</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {scheme.eligibility_criteria.length > 150 
                            ? `${scheme.eligibility_criteria.substring(0, 150)}...` 
                            : scheme.eligibility_criteria}
                        </p>
                      </div>
                    )}

                    {/* Link */}
                    {scheme.link && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Official Link</h4>
                        <p className="text-blue-600 text-sm break-all cursor-pointer hover:underline"
                           onClick={() => handleSchemeClick(scheme.link)}>
                          {scheme.link}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Load More Info */}
      {filteredSchemes.length > 0 && (
        <div className="text-center pt-4">
          <p className="text-sm text-gray-600">
            Showing {filteredSchemes.length} of {schemes.length} total schemes
          </p>
        </div>
      )}
    </div>
  );
}
