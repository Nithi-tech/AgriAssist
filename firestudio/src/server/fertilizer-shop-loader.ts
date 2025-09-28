import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export interface FertilizerShop {
  shopName: string;
  address: string;
  district: string;
  state: string;
  contact: string;
  licenseNumber: string;
}

export interface FertilizerShopData {
  shops: FertilizerShop[];
  states: string[];
  districts: string[];
  lastUpdated: string;
  totalCount: number;
}

/**
 * Load and parse fertilizer shop data from CSV file
 * This runs only on the server side for SSR safety
 */
export async function loadFertilizerShopsData(): Promise<FertilizerShopData> {
  try {
    // CSV file is in the root directory
    const csvPath = path.join(process.cwd(), 'Fertilizer_Shops_India.csv');
    
    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      throw new Error('CSV file not found');
    }

    // Read and parse CSV file
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true, // Use first row as headers
      skip_empty_lines: true,
      trim: true,
    });

    // Validate and transform data
    const shops: FertilizerShop[] = [];
    const statesSet = new Set<string>();
    const districtsSet = new Set<string>();

    for (const record of records as any[]) {
      // Validate required fields
      if (!record['Shop Name'] || !record['Address'] || !record['State'] || !record['Contact Number']) {
        console.warn('Skipping invalid record:', record);
        continue;
      }

      const shop: FertilizerShop = {
        shopName: (record['Shop Name'] as string)?.trim() || '',
        address: (record['Address'] as string)?.trim() || '',
        district: (record['District'] as string)?.trim() || '',
        state: (record['State'] as string)?.trim() || '',
        contact: (record['Contact Number'] as string)?.trim() || '',
        licenseNumber: (record['License Number'] as string)?.trim() || '',
      };

      shops.push(shop);
      statesSet.add(shop.state);
      if (shop.district) {
        districtsSet.add(shop.district);
      }
    }

    // Sort arrays for consistent ordering
    const states = Array.from(statesSet).sort();
    const districts = Array.from(districtsSet).sort();

    return {
      shops,
      states,
      districts,
      lastUpdated: new Date().toISOString(),
      totalCount: shops.length,
    };

  } catch (error) {
    console.error('Error loading fertilizer shop data:', error);
    throw new Error('Failed to load fertilizer shop data');
  }
}
