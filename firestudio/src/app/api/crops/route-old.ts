import { NextRequest, NextResponse } from 'next/server';

// Import mock data
import mockCrops from '@/data/mock/crops.json';

// In-memory storage for new crops (simulates database)
let cropsData = [...mockCrops];

// Validation helpers
const validatePositiveNumber = (value: any, fieldName: string) => {
  if (value !== null && value !== undefined && value !== '') {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return `${fieldName} must be a positive number`;
    }
  }
  return null;
};

const validateDateOrder = (plantingDate: string, harvestDate: string) => {
  if (plantingDate && harvestDate) {
    const planting = new Date(plantingDate);
    const harvest = new Date(harvestDate);
    if (planting > harvest) {
      return 'Expected harvest date must be after planting date';
    }
  }
  return null;
};

// Valid enum values based on database constraints
const VALID_IRRIGATION_TYPES = ['rainfed', 'drip', 'sprinkler', 'flood', 'tube_well', 'canal', 'other'];
const VALID_STATUS_VALUES = ['active', 'harvested', 'failed', 'planned'];
const VALID_LAND_SIZE_UNITS = ['acres', 'hectares'];
const VALID_YIELD_UNITS = ['kg', 'tonnes'];

// GET - Fetch all crops
export async function GET(request: NextRequest) {
  try {
    // Simulate database delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Return mock data
    return NextResponse.json({
      success: true,
      data: cropsData,
      count: cropsData.length
    });

  } catch (error: any) {
    console.error('Unexpected error in GET /api/crops:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new crop
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🌱 Creating new crop with data:', body);

    // Validation
    const errors: string[] = [];

    // Required field validation
    if (!body.crop_name || !body.crop_name.trim()) {
      body.crop_name = 'Unknown Crop'; // Default value as per schema
    }

    // Positive number validations
    const landSizeError = validatePositiveNumber(body.land_size, 'Land size');
    if (landSizeError) errors.push(landSizeError);

    const yieldError = validatePositiveNumber(body.estimated_yield, 'Estimated yield');
    if (yieldError) errors.push(yieldError);

    const costError = validatePositiveNumber(body.cost_investment, 'Cost investment');
    if (costError) errors.push(costError);

    // Date validation
    const dateError = validateDateOrder(body.planting_date, body.expected_harvest_date);
    if (dateError) errors.push(dateError);

    // Enum validations
    if (body.irrigation_type && !VALID_IRRIGATION_TYPES.includes(body.irrigation_type)) {
      errors.push(`Invalid irrigation type. Must be one of: ${VALID_IRRIGATION_TYPES.join(', ')}`);
    }

    if (body.status && !VALID_STATUS_VALUES.includes(body.status)) {
      errors.push(`Invalid status. Must be one of: ${VALID_STATUS_VALUES.join(', ')}`);
    }

    if (body.land_size_unit && !VALID_LAND_SIZE_UNITS.includes(body.land_size_unit)) {
      errors.push(`Invalid land size unit. Must be one of: ${VALID_LAND_SIZE_UNITS.join(', ')}`);
    }

    if (body.yield_unit && !VALID_YIELD_UNITS.includes(body.yield_unit)) {
      errors.push(`Invalid yield unit. Must be one of: ${VALID_YIELD_UNITS.join(', ')}`);
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Prepare crop data for insertion
    const cropData = {
      crop_name: body.crop_name.trim(),
      crop_variety: body.crop_variety?.trim() || null,
      planting_date: body.planting_date || null,
      expected_harvest_date: body.expected_harvest_date || null,
      location: body.location?.trim() || null,
      land_size: body.land_size ? parseFloat(body.land_size) : null,
      land_size_unit: body.land_size_unit || 'acres',
      irrigation_type: body.irrigation_type || null,
      soil_type: body.soil_type?.trim() || null,
      water_source: body.water_source?.trim() || null,
      fertilizer_used: body.fertilizer_used?.trim() || null,
      pesticide_used: body.pesticide_used?.trim() || null,
      estimated_yield: body.estimated_yield ? parseFloat(body.estimated_yield) : null,
      yield_unit: body.yield_unit || 'kg',
      cost_investment: body.cost_investment ? parseFloat(body.cost_investment) : null,
      status: body.status || 'active',
      season: body.season?.trim() || null,
      farming_method: body.farming_method?.trim() || null,
      notes: body.notes?.trim() || null,
      created_by: body.created_by || null // Can be set from auth context
    };

    // Create new crop data with generated ID
    const newCrop = {
      id: cropsData.length + 1,
      name: body.crop_name?.trim() || 'Unknown Crop',
      category: body.category?.trim() || 'Other',
      season: body.season?.trim() || null,
      growing_period: body.growing_period?.trim() || null,
      suitable_states: body.suitable_states || [],
      water_requirement: body.water_requirement?.trim() || 'Medium',
      soil_type: body.soil_type?.trim() || null,
      created_at: new Date().toISOString()
    };

    // Add to mock data array
    cropsData.push(newCrop);

    console.log('✅ Crop created successfully:', newCrop);
    return NextResponse.json({
      success: true,
      message: 'Crop created successfully',
      data: newCrop
    });

  } catch (error: any) {
    console.error('Unexpected error in POST /api/crops:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update existing crop
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Crop ID is required for update' },
        { status: 400 }
      );
    }

    // Similar validation as POST
    const errors: string[] = [];

    const landSizeError = validatePositiveNumber(updateData.land_size, 'Land size');
    if (landSizeError) errors.push(landSizeError);

    const yieldError = validatePositiveNumber(updateData.estimated_yield, 'Estimated yield');
    if (yieldError) errors.push(yieldError);

    const costError = validatePositiveNumber(updateData.cost_investment, 'Cost investment');
    if (costError) errors.push(costError);

    const dateError = validateDateOrder(updateData.planting_date, updateData.expected_harvest_date);
    if (dateError) errors.push(dateError);

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const { data: updatedCrop, error } = await supabaseAdmin
      .from('crops')
      .update({
        ...updateData,
        updated_at: new Date().toISOString() // Trigger will handle this, but explicit is good
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update crop', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Crop updated successfully',
      data: updatedCrop
    });

  } catch (error: any) {
    console.error('Unexpected error in PUT /api/crops:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete crop
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Crop ID is required for deletion' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('crops')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete crop', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Crop deleted successfully'
    });

  } catch (error: any) {
    console.error('Unexpected error in DELETE /api/crops:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
