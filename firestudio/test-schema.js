/**
 * Test Crops API Schema Compatibility
 * This script tests the current API to see if land_size_unit works
 */

async function testCropsAPI() {
  const API_URL = 'http://localhost:9005/api/crops';
  
  console.log('🌾 Testing Crops API Schema Compatibility');
  console.log('==========================================');
  
  try {
    // First test GET to see if the API is working
    console.log('📤 Testing GET /api/crops...');
    
    const getResponse = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const getResult = await getResponse.json();
    
    if (getResponse.ok) {
      console.log('✅ GET API test successful!');
      console.log(`Found ${getResult.data?.length || 0} existing crops`);
      
      // Check if any existing crops have the required fields
      if (getResult.data && getResult.data.length > 0) {
        const sampleCrop = getResult.data[0];
        console.log('\n📋 Sample crop structure:');
        console.log('Fields present:', Object.keys(sampleCrop));
        
        const hasLandSizeUnit = 'land_size_unit' in sampleCrop;
        const hasYieldUnit = 'yield_unit' in sampleCrop;
        
        console.log(`✅ land_size_unit field: ${hasLandSizeUnit ? 'PRESENT' : '❌ MISSING'}`);
        console.log(`✅ yield_unit field: ${hasYieldUnit ? 'PRESENT' : '❌ MISSING'}`);
        
        if (hasLandSizeUnit && hasYieldUnit) {
          console.log('\n🎉 Schema compatibility test passed!');
          console.log('All required fields are present in the database.');
        } else {
          console.log('\n🔧 Schema issues detected!');
          provideMigrationInstructions();
        }
      } else {
        console.log('\n� No existing crops found - cannot verify schema');
        console.log('Try the POST test with admin authentication, or add a crop manually');
      }
      
    } else {
      console.log('❌ GET API test failed');
      console.log('Status:', getResponse.status);
      console.log('Response:', getResult);
    }
    
  } catch (error) {
    console.error('💥 Network or parsing error:', error);
    console.log('\n🔧 This might indicate:');
    console.log('1. The Next.js server is not running on localhost:9005');
    console.log('2. Network connectivity issues');
    console.log('3. The API endpoint has changed');
  }
}

function provideMigrationInstructions() {
  console.log('\n📝 MIGRATION INSTRUCTIONS:');
  console.log('='.repeat(50));
  console.log('Please run this SQL in your Supabase Dashboard:');
  console.log('');
  console.log('-- Add missing columns');
  console.log("ALTER TABLE crops ADD COLUMN IF NOT EXISTS land_size_unit VARCHAR(10) DEFAULT 'acres';");
  console.log("ALTER TABLE crops ADD COLUMN IF NOT EXISTS yield_unit VARCHAR(20) DEFAULT 'kg';");
  console.log('');
  console.log('-- Update NULL values');
  console.log("UPDATE crops SET land_size_unit = 'acres' WHERE land_size_unit IS NULL;");
  console.log("UPDATE crops SET yield_unit = 'kg' WHERE yield_unit IS NULL;");
  console.log('');
  console.log('-- Drop currency column if it exists (removed from app)');
  console.log('ALTER TABLE crops DROP COLUMN IF EXISTS currency;');
  console.log('');
  console.log('='.repeat(50));
  console.log('After running the SQL, restart your Next.js app.');
}

// Run the test
testCropsAPI();
