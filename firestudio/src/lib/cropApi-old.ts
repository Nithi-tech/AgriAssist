// ============================================================================
// CROP MANAGEMENT API - SUPABASE INTEGRATION
// Complete CRUD operations for crop management
// ============================================================================

import { supabase } from './supabaseClient';

// TypeScript interfaces aligned with exact database schema
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
  fertilizer_used?: string | null;  // character varying(200) null
  pesticide_used?: string | null;  // character varying(200) null
  estimated_yield?: number | null;  // numeric(10, 2) null
  yield_unit?: 'kg' | 'tonnes' | null;  // character varying(20) default 'kg'
  cost_investment?: number | null;  // numeric(12, 2) null
  status?: 'active' | 'harvested' | 'failed' | 'planned' | null;  // character varying(20) default 'active'
  season?: string | null;  // character varying(20) null
  farming_method?: string | null;  // character varying(30) null
  notes?: string | null;  // text null
  created_at?: string | null;  // timestamp without time zone default now()
  updated_at?: string | null;  // timestamp with time zone default now()
  created_by?: string | null;  // uuid references auth.users(id)
}

export interface CropApiResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

/**
 * Create a new crop record
 */
export async function createCrop(cropData: Crop): Promise<CropApiResponse<Crop>> {
  try {
    console.log('🌱 Creating new crop:', cropData.crop_name);
    
    const { data, error } = await supabase
      .from('crops')
      .insert([{
        ...cropData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating crop:', error);
      return { data: null, error: error.message };
    }

    console.log('✅ Crop created successfully:', data.crop_name);
    return { data, error: null };

  } catch (err: any) {
    console.error('💥 Unexpected error in createCrop:', err);
    return { data: null, error: err.message || 'Failed to create crop' };
  }
}

/**
 * Get all crops (for Crops page)
 */
export async function getAllCrops(): Promise<CropApiResponse<Crop[]>> {
  try {
    console.log('📋 Fetching all crops...');
    
    const { data, error, count } = await supabase
      .from('crops')
      .select('*', { count: 'exact' })
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching crops:', error);
      return { data: null, error: error.message };
    }

    console.log(`✅ Successfully fetched ${data?.length || 0} crops`);
    return { data: data || [], error: null, count: count || 0 };

  } catch (err: any) {
    console.error('💥 Unexpected error in getAllCrops:', err);
    return { data: null, error: err.message || 'Failed to fetch crops' };
  }
}

/**
 * Get the latest crop (for My Crop page)
 */
export async function getLatestCrop(): Promise<CropApiResponse<Crop>> {
  try {
    console.log('🕐 Fetching latest crop...');
    
    const { data, error } = await supabase
      .from('crops')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found
        console.log('ℹ️ No crops found in database');
        return { data: null, error: 'No crops found' };
      }
      console.error('❌ Error fetching latest crop:', error);
      return { data: null, error: error.message };
    }

    console.log('✅ Latest crop fetched:', data.crop_name);
    return { data, error: null };

  } catch (err: any) {
    console.error('💥 Unexpected error in getLatestCrop:', err);
    return { data: null, error: err.message || 'Failed to fetch latest crop' };
  }
}

/**
 * Update an existing crop
 */
export async function updateCrop(id: string, cropData: Partial<Crop>): Promise<CropApiResponse<Crop>> {
  try {
    console.log('🔄 Updating crop:', id);
    
    const { data, error } = await supabase
      .from('crops')
      .update({
        ...cropData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating crop:', error);
      return { data: null, error: error.message };
    }

    console.log('✅ Crop updated successfully:', data.crop_name);
    return { data, error: null };

  } catch (err: any) {
    console.error('💥 Unexpected error in updateCrop:', err);
    return { data: null, error: err.message || 'Failed to update crop' };
  }
}

/**
 * Delete a crop
 */
export async function deleteCrop(id: string): Promise<CropApiResponse<boolean>> {
  try {
    console.log('🗑️ Deleting crop:', id);
    
    const { error } = await supabase
      .from('crops')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting crop:', error);
      return { data: null, error: error.message };
    }

    console.log('✅ Crop deleted successfully');
    return { data: true, error: null };

  } catch (err: any) {
    console.error('💥 Unexpected error in deleteCrop:', err);
    return { data: null, error: err.message || 'Failed to delete crop' };
  }
}

/**
 * Get crops by filter (optional advanced feature)
 */
export async function getCropsByFilter(filters: {
  crop_name?: string;
  location?: string;
  status?: string;
  season?: string;
}): Promise<CropApiResponse<Crop[]>> {
  try {
    console.log('🔍 Filtering crops:', filters);
    
    let query = supabase.from('crops').select('*');

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

    query = query.order('updated_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Error filtering crops:', error);
      return { data: null, error: error.message };
    }

    console.log(`✅ Filter results: ${data?.length || 0} crops found`);
    return { data: data || [], error: null, count: count || 0 };

  } catch (err: any) {
    console.error('💥 Unexpected error in getCropsByFilter:', err);
    return { data: null, error: err.message || 'Failed to filter crops' };
  }
}

/**
 * Get crop statistics
 */
export async function getCropStatistics(): Promise<CropApiResponse<{
  totalCrops: number;
  activeCrops: number;
  harvestedCrops: number;
  totalLandSize: number;
  cropsByType: Record<string, number>;
}>> {
  try {
    console.log('📊 Fetching crop statistics...');
    
    const { data, error } = await supabase
      .from('crops')
      .select('*');

    if (error) {
      console.error('❌ Error fetching crop statistics:', error);
      return { data: null, error: error.message };
    }

    const stats = {
      totalCrops: data.length,
      activeCrops: data.filter(crop => crop.status === 'active').length,
      harvestedCrops: data.filter(crop => crop.status === 'harvested').length,
      totalLandSize: data.reduce((sum, crop) => sum + (crop.land_size || 0), 0),
      cropsByType: data.reduce((acc, crop) => {
        acc[crop.crop_name] = (acc[crop.crop_name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    console.log('✅ Statistics calculated successfully');
    return { data: stats, error: null };

  } catch (err: any) {
    console.error('💥 Unexpected error in getCropStatistics:', err);
    return { data: null, error: err.message || 'Failed to fetch statistics' };
  }
}