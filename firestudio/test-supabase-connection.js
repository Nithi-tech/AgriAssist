// Test script to validate Supabase connection and crop API functions
const { createRequire } = require('module');
const require = createRequire(import.meta.url);

// Test basic connection
async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection and crop API...\n');

    // Import our API functions (using dynamic import for ES modules)
    const { getAllCrops, getCropStatistics, getLatestCrop } = await import('./src/lib/cropApi.js');
    
    console.log('✅ Successfully imported crop API functions\n');

    // Test getAllCrops
    console.log('📋 Testing getAllCrops...');
    const cropsResult = await getAllCrops();
    console.log('Result:', {
      dataLength: cropsResult.data?.length || 0,
      count: cropsResult.count,
      hasError: !!cropsResult.error
    });

    if (cropsResult.error) {
      console.log('❌ Error:', cropsResult.error);
    } else {
      console.log('✅ getAllCrops works correctly\n');
    }

    // Test getCropStatistics
    console.log('📊 Testing getCropStatistics...');
    const statsResult = await getCropStatistics();
    console.log('Result:', {
      hasData: !!statsResult.data,
      hasError: !!statsResult.error
    });

    if (statsResult.error) {
      console.log('❌ Error:', statsResult.error);
    } else {
      console.log('✅ getCropStatistics works correctly');
      if (statsResult.data) {
        console.log('Stats:', statsResult.data);
      }
    }
    console.log('\n');

    // Test getLatestCrop
    console.log('🌱 Testing getLatestCrop...');
    const latestResult = await getLatestCrop();
    console.log('Result:', {
      hasData: !!latestResult.data,
      hasError: !!latestResult.error
    });

    if (latestResult.error) {
      console.log('❌ Error:', latestResult.error);
    } else {
      console.log('✅ getLatestCrop works correctly');
      if (latestResult.data) {
        console.log('Latest crop:', {
          id: latestResult.data.id,
          name: latestResult.data.crop_name,
          status: latestResult.data.status
        });
      }
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testSupabaseConnection();
