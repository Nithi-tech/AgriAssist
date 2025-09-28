'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Search, Filter } from 'lucide-react';
import { AgriculturalPolicy, getAllStates, searchPolicies, getPoliciesByState, getAllPolicies } from '../lib/policies';

export default function PoliciesExplorer() {
  const [policies, setPolicies] = useState<AgriculturalPolicy[]>([]);
  const [filteredPolicies, setFilteredPolicies] = useState<AgriculturalPolicy[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('');

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [allPolicies, allStates] = await Promise.all([
          getAllPolicies(),
          getAllStates()
        ]);
        
        setPolicies(allPolicies);
        setFilteredPolicies(allPolicies);
        setStates(allStates);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Handle search
  const handleSearch = async () => {
    if (!searchTerm.trim() && !selectedState) {
      setFilteredPolicies(policies);
      return;
    }

    try {
      setLoading(true);
      let results: AgriculturalPolicy[];

      if (searchTerm.trim() && selectedState) {
        // Search within selected state
        const stateResults = await getPoliciesByState(selectedState);
        results = stateResults.filter((policy: AgriculturalPolicy) => 
          policy.scheme_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          policy.explanation.toLowerCase().includes(searchTerm.toLowerCase())
        );
      } else if (searchTerm.trim()) {
        // Global search
        results = await searchPolicies(searchTerm);
      } else if (selectedState) {
        // Filter by state only
        results = await getPoliciesByState(selectedState);
      } else {
        results = policies;
      }

      setFilteredPolicies(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedState('');
    setFilteredPolicies(policies);
  };

  if (loading && policies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agricultural policies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Agricultural Policies Explorer</h1>
        <p className="text-gray-600">Discover government schemes and policies for farmers across India</p>
      </div>

      {/* Search and Filter Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search policies, schemes, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            
            <div className="w-full md:w-48">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-states">All States</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
              <Button variant="outline" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="mb-6 text-sm text-gray-600">
        Showing {filteredPolicies.length} of {policies.length} policies
        {selectedState && ` in ${selectedState}`}
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      {/* Policies Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPolicies.map((policy) => (
          <Card key={policy.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Badge variant="secondary" className="mb-2">
                  {policy.state}
                </Badge>
              </div>
              <CardTitle className="text-lg leading-tight">
                {policy.scheme_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Description</h4>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {policy.explanation}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Eligibility</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {policy.eligibility_criteria}
                  </p>
                </div>

                {policy.link && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(policy.link, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Learn More
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredPolicies.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No policies found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms or filter criteria
          </p>
          <Button variant="outline" onClick={resetFilters}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
