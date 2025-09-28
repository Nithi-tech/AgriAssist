import { NextRequest, NextResponse } from 'next/server';

// Import mock data
import mockCropsRaw from '@/data/mock/crops.json';

// Transform the imported mock data to match our Crop interface
const mockCrops = mockCropsRaw.map((crop: any) => ({
  ...crop,
  crop_name: crop.name || crop.crop_name || 'Unknown Crop',
  // Remove the old 'name' property if it exists
  name: undefined
}));

// In-memory storage for crops (simulates database)
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
    if (!body.name || !body.name.trim()) {
      errors.push('Crop name is required');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    // Create new crop data with generated ID
    const newCrop = {
      id: Math.max(...cropsData.map(c => c.id), 0) + 1,
      name: body.name.trim(),
      category: body.category?.trim() || 'Other',
      season: body.season?.trim() || 'Kharif',
      growing_period: body.growing_period?.trim() || '90-120 days',
      suitable_states: body.suitable_states || [],
      water_requirement: body.water_requirement?.trim() || 'Medium',
      soil_type: body.soil_type?.trim() || 'Loamy soil',
      created_at: new Date().toISOString()
    };

    // Add to mock data array
    cropsData.push(newCrop);

    console.log('✅ Crop created successfully:', newCrop);

    return NextResponse.json({
      success: true,
      message: 'Crop created successfully',
      data: newCrop
    }, { status: 201 });

  } catch (error: any) {
    console.error('Unexpected error in POST /api/crops:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update crop
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Crop ID is required' },
        { status: 400 }
      );
    }

    // Find crop to update
    const cropIndex = cropsData.findIndex(crop => crop.id === parseInt(id));
    
    if (cropIndex === -1) {
      return NextResponse.json(
        { error: 'Crop not found' },
        { status: 404 }
      );
    }

    // Update crop data
    const updatedCrop = {
      ...cropsData[cropIndex],
      ...updateData,
      id: parseInt(id), // Ensure ID remains the same
      updated_at: new Date().toISOString()
    };

    cropsData[cropIndex] = updatedCrop;

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
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Crop ID is required' },
        { status: 400 }
      );
    }

    // Find crop to delete
    const cropIndex = cropsData.findIndex(crop => crop.id === parseInt(id));
    
    if (cropIndex === -1) {
      return NextResponse.json(
        { error: 'Crop not found' },
        { status: 404 }
      );
    }

    // Remove crop from array
    cropsData.splice(cropIndex, 1);

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
