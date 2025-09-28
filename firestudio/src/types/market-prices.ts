// TypeScript types for Market Prices system
export interface MarketPrice {
  id: string;
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety?: string;
  unit: string;
  min_price?: number;
  max_price?: number;
  modal_price?: number;
  date: string;
  source: 'api' | 'scraper' | 'manual';
  created_at: string;
  updated_at: string;
}

export interface MarketPriceFilters {
  state?: string;
  commodity?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ChartDataPoint {
  date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
}

export interface UpdateMarketPricesResponse {
  success: boolean;
  updatedCount: number;
  failedCount: number;
  errors: string[];
  message: string;
}

export interface ApiDataSource {
  name: string;
  url: string;
  active: boolean;
}

export interface ScrapingTarget {
  state: string;
  url: string;
  selectors: {
    commodity: string;
    market: string;
    minPrice: string;
    maxPrice: string;
    modalPrice: string;
    date: string;
  };
}

export interface MarketPriceStats {
  totalRecords: number;
  lastUpdated: string;
  statesCount: number;
  commoditiesCount: number;
  averagePrice: number;
}
