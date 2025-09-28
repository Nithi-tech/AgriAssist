// ============================================================================
// CROP MANAGEMENT API - SUPABASE IMPLEMENTATION  
// Complete CRUD operations for crop management using Supabase
// ============================================================================

import { supabase } from './supabaseClient'

// TypeScript interfaces aligned with Supabase schema
export interface Crop {
  id?: number | string;  // serial primary key
  crop_name: string;  // text not null default 'Unknown Crop'
  crop_variety?: string | null;  // text null
  planting_date?: string | null;  // date null
  expected_harvest_date?: string | null;  // date null
  location?: string | null;  // character varying(200) null
  land_size?: number | null;  // numeric(10, 2) null
  land_size_unit?: 'acres' | 'hectares' | 'square_meters' | null;  // character varying(10) default 'acres'
  irrigation_type?: string | null;  // irrigation method
  soil_type?: string | null;  // character varying(50) null
  water_source?: string | null;  // character varying(100) null
  status?: 'active' | 'harvested' | 'failed' | null;  // character varying(20) default 'active'
  season?: string | null;  // season when crop is grown
  farming_method?: string | null;  // organic, conventional, etc.
  estimated_yield?: number | null;  // expected yield amount
  yield_unit?: string | null;  // unit for yield (kg, tons, etc.)
  cost_investment?: number | null;  // total investment cost
  fertilizer_used?: string | null;  // fertilizer details
  pesticide_used?: string | null;  // pesticide details
  notes?: string | null;  // additional notes and observations
  actual_yield?: number | null;  // actual yield amount
  revenue?: number | null;  // revenue earned
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

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a new crop
 */
export async function createCrop(cropData: Omit<Crop, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Crop | null; error: any }> {
  try {
    console.log('Creating crop with data:', cropData);

    const { data, error } = await supabase
      .from('crops')
      .insert([cropData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating crop:', error);
      return { data: null, error };
    }

    console.log('✅ Crop created successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Unexpected error creating crop:', error);
    return { data: null, error };
  }
}

/**
 * Get crop by ID
 */
export async function getCropById(id: string | number): Promise<{ data: Crop | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error fetching crop:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('❌ Unexpected error fetching crop:', error);
    return { data: null, error };
  }
}

/**
 * Get all crops with optional ordering
 */
export async function getAllCrops(): Promise<{ data: Crop[]; error: any; count: number }> {
  try {
    console.log('🔍 Fetching all crops from Supabase...');
    
    if (!supabase) {
      console.error('❌ Supabase client is not initialized');
      return { data: [], error: 'Supabase client not initialized', count: 0 };
    }

    const { data, error, count } = await supabase
      .from('crops')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching crops:', error);
      return { data: [], error, count: 0 };
    }

    console.log(`✅ Fetched ${data?.length || 0} crops successfully`);
    return { 
      data: data || [], 
      error: null, 
      count: count || 0 
    };
  } catch (error) {
    console.error('❌ Unexpected error fetching crops:', error);
    return { data: [], error, count: 0 };
  }
}

/**
 * Get the latest crop (most recently updated)
 */
export async function getLatestCrop(): Promise<{ data: Crop | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return { data: null, error: 'No crops found' };
      }
      console.error('❌ Error fetching latest crop:', error);
      return { data: null, error: error.message || 'Failed to fetch latest crop' };
    }

    return { data, error: null };
  } catch (error) {
    console.error('❌ Unexpected error fetching latest crop:', error);
    return { data: null, error: 'Failed to fetch latest crop' };
  }
}

/**
 * Update crop by ID
 */
export async function updateCrop(id: string | number, updates: Partial<Crop>): Promise<{ data: Crop | null; error: any }> {
  try {
    console.log('Updating crop with ID:', id, 'Updates:', updates);

    const { data, error } = await supabase
      .from('crops')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating crop:', error);
      return { data: null, error };
    }

    console.log('✅ Crop updated successfully:', data);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Unexpected error updating crop:', error);
    return { data: null, error };
  }
}

/**
 * Delete crop by ID
 */
export async function deleteCrop(id: string | number): Promise<{ error: any }> {
  try {
    console.log('Deleting crop with ID:', id);

    const { error } = await supabase
      .from('crops')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting crop:', error);
      return { error };
    }

    console.log('✅ Crop deleted successfully');
    return { error: null };
  } catch (error) {
    console.error('❌ Unexpected error deleting crop:', error);
    return { error };
  }
}

/**
 * Search crops with filters
 */
export async function searchCrops(filters: CropFilters): Promise<{ data: Crop[]; error: any; count: number }> {
  try {
    let query = supabase
      .from('crops')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.crop_name) {
      query = query.ilike('crop_name', `%${filters.crop_name}%`);
    }

    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.season) {
      query = query.eq('season', filters.season);
    }

    if (filters.irrigation_type) {
      query = query.eq('irrigation_type', filters.irrigation_type);
    }

    // Sort by updated_at (newest first)
    query = query.order('updated_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Error searching crops:', error);
      return { data: [], error, count: 0 };
    }

    return { 
      data: data || [], 
      error: null, 
      count: count || 0 
    };
  } catch (error) {
    console.error('❌ Unexpected error searching crops:', error);
    return { data: [], error, count: 0 };
  }
}

/**
 * Get crop statistics
 */
export async function getCropStatistics(): Promise<{ data: CropStats | null; error: any }> {
  try {
    console.log('📊 Fetching crop statistics from Supabase...');
    
    if (!supabase) {
      console.error('❌ Supabase client is not initialized');
      return { data: null, error: 'Supabase client not initialized' };
    }

    const { data, error } = await supabase
      .from('crops')
      .select('*');

    if (error) {
      console.error('❌ Error fetching crop statistics:', error);
      return { data: null, error };
    }

    const crops = data || [];
    console.log(`📈 Processing statistics for ${crops.length} crops`);

    const stats: CropStats = {
      totalCrops: crops.length,
      activeCrops: crops.filter((crop: Crop) => crop.status === 'active').length,
      harvestedCrops: crops.filter((crop: Crop) => crop.status === 'harvested').length,
      totalLandSize: crops.reduce((sum: number, crop: Crop) => sum + (crop.land_size || 0), 0),
      cropsByType: crops.reduce((acc: { [key: string]: number }, crop: Crop) => {
        const type = crop.crop_name || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {})
    };

    console.log('✅ Crop statistics calculated successfully:', stats);
    return { data: stats, error: null };
  } catch (error) {
    console.error('❌ Unexpected error fetching crop statistics:', error);
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
    const { data, error } = await supabase
      .from('crops')
      .select('crop_name')
      .not('crop_name', 'is', null);

    if (error) {
      console.error('❌ Error fetching crop names:', error);
      return { data: [], error };
    }

    const uniqueNames = [...new Set(data?.map(item => item.crop_name))].filter(Boolean);
    return { data: uniqueNames, error: null };
  } catch (error) {
    console.error('❌ Unexpected error fetching crop names:', error);
    return { data: [], error };
  }
}

/**
 * Get all unique locations for dropdowns
 */
export async function getLocations(): Promise<{ data: string[]; error: any }> {
  try {
    const { data, error } = await supabase
      .from('crops')
      .select('location')
      .not('location', 'is', null);

    if (error) {
      console.error('❌ Error fetching locations:', error);
      return { data: [], error };
    }

    const uniqueLocations = [...new Set(data?.map(item => item.location))].filter(Boolean) as string[];
    return { data: uniqueLocations, error: null };
  } catch (error) {
    console.error('❌ Unexpected error fetching locations:', error);
    return { data: [], error };
  }
}

/**
 * Reset crops data to original mock data (for testing)
 * This function creates sample data in Supabase
 */
export async function resetCropsData(): Promise<void> {
  try {
    // Delete all existing crops
    await supabase
      .from('crops')
      .delete()
      .gte('id', 0);

    // Insert sample data
    const sampleCrops = [
      {
        crop_name: "Rice",
        crop_variety: "Basmati",
        planting_date: "2024-06-15",
        expected_harvest_date: "2024-10-15",
        location: "Haryana Field A1",
        land_size: 2.5,
        land_size_unit: "acres",
        irrigation_type: "tube_well",
        soil_type: "Clay loam",
        water_source: "Tube well",
        status: "active",
        season: "Kharif",
        farming_method: "conventional",
        estimated_yield: 1500,
        yield_unit: "kg",
        cost_investment: 25000,
        fertilizer_used: "Urea 50kg, DAP 30kg",
        pesticide_used: "Chlorpyrifos 500ml",
        notes: "Good germination rate. Need to monitor for pests in coming weeks."
      },
      {
        crop_name: "Wheat",
        crop_variety: "HD-2967",
        planting_date: "2023-11-20",
        expected_harvest_date: "2024-04-15",
        location: "Punjab Field B2",
        land_size: 4.0,
        land_size_unit: "acres",
        irrigation_type: "canal",
        soil_type: "Well-drained loamy soil",
        water_source: "Canal irrigation",
        status: "harvested",
        season: "Rabi",
        farming_method: "organic",
        estimated_yield: 2800,
        yield_unit: "kg",
        cost_investment: 45000,
        fertilizer_used: "Organic compost 100kg, Vermicompost 50kg",
        pesticide_used: "Neem oil spray",
        notes: "Excellent harvest! Organic certification maintained."
      },
      {
        crop_name: "Cotton",
        crop_variety: "Bt Cotton",
        planting_date: "2024-05-10",
        expected_harvest_date: "2024-12-10",
        location: "Gujarat Field C3",
        land_size: 6.5,
        land_size_unit: "acres",
        irrigation_type: "drip",
        soil_type: "Black cotton soil",
        water_source: "Bore well",
        status: "active",
        season: "Kharif",
        farming_method: "conventional",
        estimated_yield: 8,
        yield_unit: "quintals",
        cost_investment: 85000,
        fertilizer_used: "NPK complex 80kg, Potash 40kg",
        pesticide_used: "Imidacloprid, Lambda-cyhalothrin",
        notes: "Plants showing good growth. Drip irrigation system working efficiently."
      }
    ];

    await supabase
      .from('crops')
      .insert(sampleCrops);

    console.log('🔄 Crops data reset with sample data');
  } catch (error) {
    console.error('❌ Error resetting crops data:', error);
  }
}

/**
 * Get current crops data count (for debugging)
 */
export async function getCurrentCropsData(): Promise<Crop[]> {
  try {
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching current crops data:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Unexpected error fetching current crops data:', error);
    return [];
  }
}
