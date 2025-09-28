// /src/types/marketPrices.ts

export interface PriceRecord {
  state: string;
  district: string;
  market: string;          // Mandi/Market name
  commodity: string;       // e.g., Rice
  variety?: string;        // optional
  min_price: number;       // per quintal, INR
  max_price: number;
  modal_price: number;
  date: string;            // ISO: YYYY-MM-DD
  source: 'ogd' | 'scraper' | 'mock';
  arrival_bags?: number;   // optional: quantity arrived
  unit?: string;           // typically "Quintal"
  grade?: string;          // FAQ, etc.
}

export interface DailyStateFile {
  date: string;            // YYYY-MM-DD
  state: string;
  total_records: number;
  records: PriceRecord[];
  last_updated_iso: string;
  fetch_status: 'success' | 'partial' | 'failed';
  error_message?: string;
}

export interface FiltersPayload {
  states?: string[];
  districts?: string[];     // for selected state
  markets?: string[];       // for selected state+district
  commodities?: string[];   // context-aware (state/district)
  varieties?: string[];     // context-aware (commodity)
}

export interface MetaIndex {
  last_updated: string;    // ISO timestamp
  total_records: number;
  states_count: number;
  commodities_count: number;
  districts_count: number;
  markets_count: number;
  available_dates: string[]; // last 30 days with data
  refresh_status: 'idle' | 'running' | 'error';
  refresh_error?: string;
}

export interface PopularCommodities {
  state: string;
  computed_on: string;     // ISO timestamp
  top: Array<{
    commodity: string;
    count: number;
    avg_modal_price: number;
  }>;
}

export interface QueryParams {
  date: string;            // YYYY-MM-DD
  state?: string;
  district?: string;
  market?: string;
  commodity?: string;
  variety?: string;
  q?: string;              // search term
  limit?: number;          // default 50
  offset?: number;         // default 0
  sortBy?: 'modal_price' | 'date' | 'commodity' | 'market' | 'state';
  sortDir?: 'asc' | 'desc';
}

export interface QueryResponse {
  total: number;
  items: PriceRecord[];
  page: number;
  limit: number;
  has_more: boolean;
  filters_applied: {
    date: string;
    state?: string;
    district?: string;
    market?: string;
    commodity?: string;
    variety?: string;
    search?: string;
  };
}

export interface RefreshRequest {
  date?: string;           // ISO format, defaults to today
  states?: string[] | 'ALL';  // specific states or 'ALL' for all
  force?: boolean;         // force refresh even if data exists
}

export interface RefreshResponse {
  refresh_status: 'accepted' | 'completed' | 'failed';
  message: string;
  date: string;
  states: string[] | 'ALL';
  timestamp: string;
  result?: {
    success_count: number;
    error_count: number;
    errors: string[];
  };
  error?: string;
}

// OGD API specific types
export interface OgdApiParams {
  'api-key': string;
  format: 'json';
  offset: number;
  limit: number;
  'filters[state]'?: string;
  'filters[district]'?: string;
  'filters[commodity]'?: string;
  'filters[market]'?: string;
  'filters[date]'?: string;  // DD-MM-YYYY format for OGD
}

export interface OgdApiRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  min_price: string;       // comes as string, needs parsing
  max_price: string;
  modal_price: string;
  price_date: string;      // DD-MM-YYYY format
  [key: string]: any;      // API may have additional fields
}

export interface OgdApiResponse {
  total: number;
  count: number;
  records: OgdApiRecord[];
  message?: string;
  success?: boolean;
}

// End of interfaces
