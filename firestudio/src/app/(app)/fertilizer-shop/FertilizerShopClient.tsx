'use client';

import { useState, useMemo } from 'react';
import { Filters, type FilterState } from './Filters';
import { ResultsTable } from './ResultsTable';
import type { FertilizerShop, FertilizerShopData } from '@/server/fertilizer-shop-loader';

interface FertilizerShopClientProps {
  data: FertilizerShopData;
}

export function FertilizerShopClient({ data }: FertilizerShopClientProps) {
  const [filters, setFilters] = useState<FilterState>({
    selectedState: '',
    selectedDistrict: '',
    searchTerm: '',
  });

  // Filter shops based on current filter state
  const filteredShops = useMemo(() => {
    let filtered = data.shops;

    // Filter by state
    if (filters.selectedState) {
      filtered = filtered.filter(shop => shop.state === filters.selectedState);
    }

    // Filter by district
    if (filters.selectedDistrict) {
      filtered = filtered.filter(shop => shop.district === filters.selectedDistrict);
    }

    // Filter by search term (shop name or address)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(shop => 
        shop.shopName.toLowerCase().includes(searchLower) ||
        shop.address.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [data.shops, filters]);

  // Get districts for selected state (for filter component)
  const availableDistricts = useMemo(() => {
    if (!filters.selectedState || filters.selectedState === 'all') {
      return data.districts;
    }
    
    // Get districts only from shops in the selected state
    const stateShops = data.shops.filter(shop => shop.state === filters.selectedState);
    const stateDistricts = [...new Set(stateShops.map(shop => shop.district).filter(Boolean))];
    return stateDistricts.sort();
  }, [data.shops, data.districts, filters.selectedState]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Filters 
        states={data.states}
        districts={availableDistricts}
        onFilterChange={setFilters}
      />

      {/* Results Table */}
      <ResultsTable 
        shops={filteredShops}
        lastUpdated={data.lastUpdated}
        totalCount={data.totalCount}
      />
    </div>
  );
}
