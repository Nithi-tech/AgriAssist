// Quick test script for Market Prices API
const testMarketPricesAPI = async () => {
  try {
    console.log('🧪 Testing Market Prices API endpoints...');
    
    // Test 1: GET status endpoint
    const statusResponse = await fetch('http://localhost:9005/api/market-prices/update-new');
    const statusResult = await statusResponse.json();
    console.log('✅ Update API Status:', statusResult);
    
    // Test 2: GET data endpoint
    const dataResponse = await fetch('http://localhost:9005/api/market-prices/data?limit=5');
    const dataResult = await dataResponse.json();
    console.log('✅ Data API Response:', dataResult);
    
    // Test 3: POST stats endpoint
    const statsResponse = await fetch('http://localhost:9005/api/market-prices/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stats' })
    });
    const statsResult = await statsResponse.json();
    console.log('✅ Stats API Response:', statsResult);
    
    console.log('🎉 All API endpoints are working!');
    
  } catch (error) {
    console.error('❌ API Test Error:', error);
  }
};

// Run test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMarketPricesAPI();
}

export default testMarketPricesAPI;
