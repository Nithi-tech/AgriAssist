// ============================================================================
// CROP MANAGEMENT API - MOCK IMPLEMENTATION  
// Complete CRUD operations for crop management using mock data
// ============================================================================

import mockCrops from '@/data/mock/crops.json';

// TypeScript interfaces aligned with mock data schema
export interface Crop {
  id?: number | string;  // serial primary key
  crop_name: string;  // text not null default 'Unknown Crop'
  crop_variety?: string | null;  // text null
  planting_date?: string | null;  // date null
  expected_harvest_date?: string | null;  // date null
  location?: string | null;  // character varying(200) null
  land_size?: number | null;  // numeric(10, 2) null
  land_size_unit?: 'acres' | 'hectares' | null;  // character varying(10) default 'acres'
  irrigation_type?: 'rainfed' | 'drip' | 'sprinkler' | 'flood' | 'tube_well' | 'canal' | 'other' | null;
  soil_type?: string | null;  // character varying(50) null
  water_source?: string | null;  // character varying(100) null
  status?: 'active' | 'harvested' | 'failed' | null;  // character varying(20) default 'active'
  created_at?: string;  // timestamp with time zone default now()
  updated_at?: string;  // timestamp with time zone default now()
}

export interface CropFilters {
  crop_name?: string;
  location?: string;
  status?: string;
  season?: string;
  irrigation_type?: string;
}

export interface CropStats {
  totalCrops: number;
  activeCrops: number;
  harvestedCrops: number;
  totalLandSize: number;
  cropsByType: { [key: string]: number };
}

// In-memory storage for crops (starts with mock data)
let cropsData: Crop[] = mockCrops.map((crop: any) => ({
  ...crop,
  crop_name: crop.name || crop.crop_name || 'Unknown Crop',
  // Remove the old 'name' property if it exists
  name: undefined
})).filter(crop => crop.crop_name !== 'Unknown Crop');

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a new crop
 */
export async function createCrop(cropData: Omit<Crop, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Crop | null; error: any }> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const newCrop: Crop = {
      ...cropData,
      id: Math.max(...cropsData.map(c => Number(c.id) || 0), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    cropsData.push(newCrop);

    console.log('✅ Crop created successfully:', newCrop.crop_name);
    return { data: newCrop, error: null };
  } catch (error) {
    console.error('❌ Error creating crop:', error);
    return { data: null, error };
  }
}

/**
 * Get crop by ID
 */
export async function getCropById(id: string | number): Promise<{ data: Crop | null; error: any }> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const crop = cropsData.find(c => c.id?.toString() === id.toString());
    
    if (!crop) {
      return { data: null, error: { message: 'Crop not found' } };
    }

    return { data: crop, error: null };
  } catch (error) {
    console.error('❌ Error fetching crop:', error);
    return { data: null, error };
  }
}

/**
 * Get all crops with optional ordering
 */
export async function getAllCrops(): Promise<{ data: Crop[]; error: any; count: number }> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Sort by updated_at (newest first)
    const sortedCrops = [...cropsData].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || '').getTime();
      const dateB = new Date(b.updated_at || b.created_at || '').getTime();
      return dateB - dateA;
    });

    return { 
      data: sortedCrops, 
      error: null, 
      count: sortedCrops.length 
    };
  } catch (error) {
    console.error('❌ Error fetching crops:', error);
    return { data: [], error, count: 0 };
  }
}

/**
 * Update crop by ID
 */
export async function updateCrop(id: string | number, updates: Partial<Crop>): Promise<{ data: Crop | null; error: any }> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const cropIndex = cropsData.findIndex(c => c.id?.toString() === id.toString());
    
    if (cropIndex === -1) {
      return { data: null, error: { message: 'Crop not found' } };
    }

    // Update the crop
    cropsData[cropIndex] = {
      ...cropsData[cropIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    console.log('✅ Crop updated successfully:', cropsData[cropIndex].crop_name);
    return { data: cropsData[cropIndex], error: null };
  } catch (error) {
    console.error('❌ Error updating crop:', error);
    return { data: null, error };
  }
}

/**
 * Delete crop by ID
 */
export async function deleteCrop(id: string | number): Promise<{ error: any }> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150));

    const cropIndex = cropsData.findIndex(c => c.id?.toString() === id.toString());
    
    if (cropIndex === -1) {
      return { error: { message: 'Crop not found' } };
    }

    const deletedCrop = cropsData[cropIndex];
    cropsData.splice(cropIndex, 1);

    console.log('✅ Crop deleted successfully:', deletedCrop.crop_name);
    return { error: null };
  } catch (error) {
    console.error('❌ Error deleting crop:', error);
    return { error };
  }
}

/**
 * Search crops with filters
 */
export async function searchCrops(filters: CropFilters): Promise<{ data: Crop[]; error: any; count: number }> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 250));

    let filteredData = [...cropsData];

    // Apply filters
    if (filters.crop_name) {
      filteredData = filteredData.filter(crop => 
        crop.crop_name?.toLowerCase().includes(filters.crop_name!.toLowerCase())
      );
    }

    if (filters.location) {
      filteredData = filteredData.filter(crop => 
        crop.location?.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters.status) {
      filteredData = filteredData.filter(crop => crop.status === filters.status);
    }

    if (filters.irrigation_type) {
      filteredData = filteredData.filter(crop => crop.irrigation_type === filters.irrigation_type);
    }

    // Sort by updated_at (newest first)
    filteredData.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || '').getTime();
      const dateB = new Date(b.updated_at || b.created_at || '').getTime();
      return dateB - dateA;
    });

    return { 
      data: filteredData, 
      error: null, 
      count: filteredData.length 
    };
  } catch (error) {
    console.error('❌ Error searching crops:', error);
    return { data: [], error, count: 0 };
  }
}

/**
 * Get crop statistics
 */
export async function getCropStatistics(): Promise<{ data: CropStats | null; error: any }> {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const data = cropsData;

    const stats: CropStats = {
      totalCrops: data.length,
      activeCrops: data.filter((crop: Crop) => crop.status === 'active').length,
      harvestedCrops: data.filter((crop: Crop) => crop.status === 'harvested').length,
      totalLandSize: data.reduce((sum: number, crop: Crop) => sum + (crop.land_size || 0), 0),
      cropsByType: data.reduce((acc: { [key: string]: number }, crop: Crop) => {
        const type = crop.crop_name || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('❌ Error fetching crop statistics:', error);
    return { data: null, error };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all unique crop names for dropdowns
 */
export async function getCropNames(): Promise<{ data: string[]; error: any }> {
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const uniqueNames = [...new Set(cropsData.map(crop => crop.crop_name))].filter(Boolean);
    return { data: uniqueNames, error: null };
  } catch (error) {
    return { data: [], error };
  }
}

/**
 * Get all unique locations for dropdowns
 */
export async function getLocations(): Promise<{ data: string[]; error: any }> {
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const uniqueLocations = [...new Set(cropsData.map(crop => crop.location))].filter(Boolean) as string[];
    return { data: uniqueLocations, error: null };
  } catch (error) {
    return { data: [], error };
  }
}

/**
 * Reset crops data to original mock data (for testing)
 */
export function resetCropsData(): void {
  cropsData = mockCrops.map((crop: any) => ({
    ...crop,
    crop_name: crop.name || crop.crop_name || 'Unknown Crop',
    // Remove the old 'name' property if it exists
    name: undefined
  })).filter(crop => crop.crop_name !== 'Unknown Crop');
  console.log('🔄 Crops data reset to original mock data');
}

/**
 * Get current crops data (for debugging)
 */
export function getCurrentCropsData(): Crop[] {
  return [...cropsData];
}
