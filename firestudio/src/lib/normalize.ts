// /src/lib/normalize.ts

export const STATE_ALIASES: Record<string, string> = {
  'assame': 'Assam',
  'assam': 'Assam',
  'delhi': 'Delhi',
  'new delhi': 'Delhi',
  'tamilnadu': 'Tamil Nadu',
  'tamil nadu': 'Tamil Nadu',
  'tn': 'Tamil Nadu',
  'telugana': 'Telangana',
  'telangana': 'Telangana',
  'ts': 'Telangana',
  'gujarath': 'Gujarat',
  'gujarat': 'Gujarat',
  'gj': 'Gujarat',
  'karnataga': 'Karnataka',
  'karnataka': 'Karnataka',
  'kt': 'Karnataka',
  'karnata': 'Karnataka',
  'maharashtra': 'Maharashtra',
  'mh': 'Maharashtra',
  'punjab': 'Punjab',
  'pb': 'Punjab',
  'haryana': 'Haryana',
  'hr': 'Haryana',
  'rajasthan': 'Rajasthan',
  'rj': 'Rajasthan',
  'uttar pradesh': 'Uttar Pradesh',
  'up': 'Uttar Pradesh',
  'madhya pradesh': 'Madhya Pradesh',
  'mp': 'Madhya Pradesh',
  'bihar': 'Bihar',
  'br': 'Bihar',
  'west bengal': 'West Bengal',
  'wb': 'West Bengal',
  'odisha': 'Odisha',
  'orissa': 'Odisha',
  'od': 'Odisha',
  'jharkhand': 'Jharkhand',
  'jh': 'Jharkhand',
  'chhattisgarh': 'Chhattisgarh',
  'cg': 'Chhattisgarh',
  'andhra pradesh': 'Andhra Pradesh',
  'ap': 'Andhra Pradesh',
  'kerala': 'Kerala',
  'kl': 'Kerala',
  'himachal pradesh': 'Himachal Pradesh',
  'hp': 'Himachal Pradesh',
  'uttarakhand': 'Uttarakhand',
  'uk': 'Uttarakhand',
  'goa': 'Goa',
  'ga': 'Goa'
};

export const COMMODITY_ALIASES: Record<string, string> = {
  'paddy (dhan)': 'Paddy',
  'paddy(dhan)': 'Paddy',
  'rice': 'Rice',
  'wheat': 'Wheat',
  'chillies (dry)': 'Chillies (Dry)',
  'chillies(dry)': 'Chillies (Dry)',
  'chilli': 'Chillies (Dry)',
  'onion': 'Onion',
  'potato': 'Potato',
  'tomato': 'Tomato',
  'cotton': 'Cotton',
  'sugarcane': 'Sugarcane',
  'jowar': 'Jowar',
  'bajra': 'Bajra',
  'maize': 'Maize',
  'arhar (tur)': 'Arhar (Tur)',
  'arhar(tur)': 'Arhar (Tur)',
  'tur': 'Arhar (Tur)',
  'moong': 'Moong',
  'urad': 'Urad',
  'gram': 'Gram',
  'groundnut': 'Groundnut',
  'mustard': 'Mustard',
  'sunflower': 'Sunflower',
  'soybean': 'Soybean',
  'turmeric': 'Turmeric',
  'coriander': 'Coriander',
  'cumin': 'Cumin',
  'ginger': 'Ginger',
  'garlic': 'Garlic',
  'cabbage': 'Cabbage',
  'cauliflower': 'Cauliflower',
  'lady finger': 'Lady Finger',
  'brinjal': 'Brinjal',
  'green chilli': 'Green Chilli'
};

/**
 * Normalize state name using aliases and title case
 */
export function normalizeStateName(state: string): string {
  if (!state) return '';
  
  const cleaned = state.toLowerCase().trim();
  const normalized = STATE_ALIASES[cleaned] || toTitleCase(state);
  
  return normalized;
}

/**
 * Normalize commodity name using aliases and consistent formatting
 */
export function normalizeCommodityName(commodity: string): string {
  if (!commodity) return '';
  
  const cleaned = commodity.toLowerCase().trim();
  const normalized = COMMODITY_ALIASES[cleaned] || toTitleCase(commodity);
  
  return normalized;
}

/**
 * Convert string to title case
 */
export function toTitleCase(str: string): string {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert state name to kebab case for file names
 */
export function toKebabCase(str: string): string {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Parse numeric price strings with commas and handle edge cases
 */
export function parsePrice(priceStr: string | number): number {
  if (typeof priceStr === 'number') return Math.max(0, priceStr);
  if (!priceStr) return 0;
  
  // Remove commas, currency symbols, and extra spaces
  const cleaned = priceStr
    .toString()
    .replace(/[₹,\s]/g, '')
    .replace(/[^\d.-]/g, '');
  
  const parsed = parseFloat(cleaned);
  
  // Return 0 for invalid or negative prices
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

/**
 * Validate price record for completeness and data quality
 */
export function validatePriceRecord(record: any): boolean {
  if (!record) return false;
  
  // Required fields
  if (!record.state || !record.district || !record.market || !record.commodity) {
    return false;
  }
  
  // Valid prices
  const minPrice = parsePrice(record.min_price);
  const maxPrice = parsePrice(record.max_price);
  const modalPrice = parsePrice(record.modal_price);
  
  if (minPrice <= 0 || maxPrice <= 0 || modalPrice <= 0) {
    return false;
  }
  
  // Logical price relationships
  if (minPrice > maxPrice || modalPrice < minPrice || modalPrice > maxPrice) {
    return false;
  }
  
  return true;
}

/**
 * Clean and normalize a complete price record
 */
export function normalizePriceRecord(record: any): any {
  return {
    ...record,
    state: normalizeStateName(record.state),
    district: toTitleCase(record.district || ''),
    market: toTitleCase(record.market || ''),
    commodity: normalizeCommodityName(record.commodity),
    variety: record.variety ? toTitleCase(record.variety) : undefined,
    grade: record.grade ? record.grade.toUpperCase() : undefined,
    min_price: parsePrice(record.min_price),
    max_price: parsePrice(record.max_price),
    modal_price: parsePrice(record.modal_price)
  };
}

/**
 * Get unique values from array and sort alphabetically
 */
export function getUniqueValues(items: any[], key: string): string[] {
  const values = items
    .map(item => item[key])
    .filter(value => value && typeof value === 'string')
    .map(value => value.trim());
  
  return [...new Set(values)].sort();
}

/**
 * Filter items by search term (case-insensitive, partial match)
 */
export function searchFilter(items: any[], searchTerm: string, searchFields: string[]): any[] {
  if (!searchTerm) return items;
  
  const term = searchTerm.toLowerCase().trim();
  
  return items.filter(item =>
    searchFields.some(field => {
      const value = item[field];
      return value && value.toString().toLowerCase().includes(term);
    })
  );
}

/**
 * Sort items by field with direction
 */
export function sortItems<T>(
  items: T[],
  sortBy: string,
  sortDir: 'asc' | 'desc' = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const aVal = (a as any)[sortBy];
    const bVal = (b as any)[sortBy];
    
    // Handle different data types
    let comparison = 0;
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    } else if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal);
    } else {
      comparison = String(aVal).localeCompare(String(bVal));
    }
    
    return sortDir === 'desc' ? -comparison : comparison;
  });
}

/**
 * Paginate array of items
 */
export function paginate<T>(items: T[], offset: number = 0, limit: number = 50): {
  items: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
} {
  const total = items.length;
  const page = Math.floor(offset / limit) + 1;
  const paginatedItems = items.slice(offset, offset + limit);
  const has_more = offset + limit < total;
  
  return {
    items: paginatedItems,
    total,
    page,
    limit,
    has_more
  };
}
