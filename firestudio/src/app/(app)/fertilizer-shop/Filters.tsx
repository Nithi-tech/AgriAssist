'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useUnifiedTranslation } from '@/hooks/use-unified-translation';

interface FiltersProps {
  states: string[];
  districts: string[];
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  selectedState: string;
  selectedDistrict: string;
  searchTerm: string;
}

export function Filters({ states, districts, onFilterChange }: FiltersProps) {
  const { t } = useUnifiedTranslation();
  const [filters, setFilters] = useState<FilterState>({
    selectedState: 'all',
    selectedDistrict: 'all',
    searchTerm: '',
  });

  const handleStateChange = (value: string) => {
    const newFilters = { 
      ...filters, 
      selectedState: value, 
      selectedDistrict: 'all' 
    };
    setFilters(newFilters);
    // Convert "all" to empty string for filtering logic
    onFilterChange({
      ...newFilters,
      selectedState: value === 'all' ? '' : value,
      selectedDistrict: ''
    });
  };

  const handleDistrictChange = (value: string) => {
    const newFilters = { ...filters, selectedDistrict: value };
    setFilters(newFilters);
    // Convert "all" to empty string for filtering logic
    onFilterChange({
      ...newFilters,
      selectedDistrict: value === 'all' ? '' : value
    });
  };

  const handleSearchChange = (value: string) => {
    const newFilters = { ...filters, searchTerm: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const newFilters = { selectedState: 'all', selectedDistrict: 'all', searchTerm: '' };
    setFilters(newFilters);
    onFilterChange({ selectedState: '', selectedDistrict: '', searchTerm: '' });
  };

  // Get districts for selected state
  const availableDistricts = filters.selectedState && filters.selectedState !== 'all'
    ? districts.filter(d => d) // Filter out empty districts if any
    : districts;

  const hasActiveFilters = (filters.selectedState && filters.selectedState !== 'all') || 
                          (filters.selectedDistrict && filters.selectedDistrict !== 'all') || 
                          filters.searchTerm;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-4 items-end">
          {/* State Filter */}
          <div className="space-y-2">
            <Label htmlFor="state-filter">{t('filterByState', 'Filter by State')}</Label>
            <Select 
              value={filters.selectedState} 
              onValueChange={handleStateChange}
            >
              <SelectTrigger id="state-filter" aria-label="Select state">
                <SelectValue placeholder={t('allStates', 'All States')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allStates', 'All States')}</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* District Filter */}
          <div className="space-y-2">
            <Label htmlFor="district-filter">{t('filterByDistrict', 'Filter by District')}</Label>
            <Select 
              value={filters.selectedDistrict} 
              onValueChange={handleDistrictChange}
              disabled={!filters.selectedState || filters.selectedState === 'all'}
            >
              <SelectTrigger id="district-filter" aria-label="Select district">
                <SelectValue placeholder={t('allDistricts', 'All Districts')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allDistricts', 'All Districts')}</SelectItem>
                {availableDistricts.map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Filter */}
          <div className="space-y-2">
            <Label htmlFor="search-filter">{t('searchShops', 'Search Shops')}</Label>
            <Input
              id="search-filter"
              type="text"
              placeholder={t('searchShops', 'Shop name or address...')}
              value={filters.searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label="Search fertilizer shops"
            />
          </div>

          {/* Clear Filters */}
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="w-full"
              aria-label="Clear all filters"
            >
              <X className="w-4 h-4 mr-2" />
              {t('clearFilters', 'Clear Filters')}
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {filters.selectedState && filters.selectedState !== 'all' && (
              <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
                {t('state', 'State')}: {filters.selectedState}
              </div>
            )}
            {filters.selectedDistrict && filters.selectedDistrict !== 'all' && (
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm">
                {t('district', 'District')}: {filters.selectedDistrict}
              </div>
            )}
            {filters.searchTerm && (
              <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-sm">
                Search: "{filters.searchTerm}"
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
