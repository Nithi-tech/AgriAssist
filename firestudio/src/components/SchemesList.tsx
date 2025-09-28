
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ExternalLink, Filter, MapPin, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

interface SchemesListProps {
  userState?: string; // User's state for filtering
  userProfile?: {
    farmSize?: string;
    cropTypes?: string[];
    income?: string;
    farmerType?: string; // farmer type
  };
}

export default function SchemesList({ userState, userProfile }: SchemesListProps) {
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>(userState || 'all');
  const [showEligibleOnly, setShowEligibleOnly] = useState(false);

  // Fetch schemes from mock data
  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use mock data instead of Supabase
      setSchemes(mockPolicies);
    } catch (err) {
      console.error('Error fetching schemes:', err);
      setError('Failed to load government schemes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get unique states for filter dropdown
  const uniqueStates = useMemo(() => {
    const states = [...new Set(schemes.map(scheme => scheme.state))];
    return states.sort();
  }, [schemes]);

  // Check if user is eligible for a scheme
  const checkEligibility = (scheme: GovernmentScheme): boolean => {
    if (!userProfile || !scheme.eligibility_criteria) return true;

    const criteria = scheme.eligibility_criteria.toLowerCase();
    const profile = userProfile;

    // Basic eligibility checks
    let isEligible = true;

    // Farm size eligibility
    if (profile.farmSize) {
      const farmSize = parseFloat(profile.farmSize);
      if (criteria.includes('small farmer') && farmSize > 2) isEligible = false;
      if (criteria.includes('marginal farmer') && farmSize > 1) isEligible = false;
      if (criteria.includes('large farmer') && farmSize < 5) isEligible = false;
    }

    // Income eligibility (basic check)
    if (profile.income) {
      const income = parseFloat(profile.income);
      if (criteria.includes('below poverty line') && income > 50000) isEligible = false;
      if (criteria.includes('low income') && income > 100000) isEligible = false;
    }

    // Farmer type eligibility
    if (profile.farmerType) {
      const farmerType = profile.farmerType.toLowerCase();
      if (criteria.includes('small farmer') && !farmerType.includes('small')) isEligible = false;
      if (criteria.includes('marginal farmer') && !farmerType.includes('marginal')) isEligible = false;
    }

    return isEligible;
  };

  // Filter schemes based on search and filters
  const filteredSchemes = useMemo(() => {
    let filtered = schemes;

    // Filter by state
    if (selectedState !== 'all') {
      filtered = filtered.filter(scheme => 
        scheme.state.toLowerCase() === selectedState.toLowerCase()
      );
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(scheme =>
        scheme.scheme_name.toLowerCase().includes(search) ||
        scheme.explanation.toLowerCase().includes(search) ||
        scheme.eligibility_criteria.toLowerCase().includes(search)
      );
    }

    // Filter by eligibility
    if (showEligibleOnly && userProfile) {
      filtered = filtered.filter(scheme => checkEligibility(scheme));
    }

    return filtered;
  }, [schemes, selectedState, searchTerm, showEligibleOnly, userProfile]);

  const handleSchemeClick = (link: string) => {
    if (link && link.startsWith('http')) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        {[...Array(5)].map((_, i) => (
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

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchSchemes}
            className="ml-2"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Government Schemes</h2>
          <Badge variant="secondary" className="text-sm">
            {filteredSchemes.length} schemes found
          </Badge>
        </div>

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
        </div>

        {/* User Info */}
        {userState && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>Showing schemes for {userState}</span>
          </div>
        )}
      </div>

      {/* Schemes List */}
      {filteredSchemes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No schemes found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedState !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'No government schemes available at the moment'
              }
            </p>
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
                          {scheme.explanation}
                        </p>
                      </div>
                    )}

                    {/* Eligibility Criteria */}
                    {scheme.eligibility_criteria && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Eligibility Criteria</h4>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {scheme.eligibility_criteria}
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

      {/* Load More Button (if needed for pagination) */}
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
