import { SchemeScraper } from './scrapeSchemes';

async function testScraper() {
  console.log('🧪 Testing Government Schemes Scraper Directly');
  
  const scraper = new SchemeScraper({
    states: ['karnataka', 'tamil-nadu'],
    saveJson: 'direct-test-output.json',
    delay: 300,
    maxRetries: 2
  });
  
  try {
    const results = await scraper.scrape();
    
    console.log('\n📊 DIRECT TEST RESULTS:');
    console.log(`Found ${results.length} schemes:`);
    
    results.forEach((scheme, index) => {
      console.log(`${index + 1}. ${scheme.scheme_name} (${scheme.state})`);
    });
    
    if (results.length > 0) {
      await scraper.saveToJson('direct-test-output.json');
      console.log('\n💾 Results saved to direct-test-output.json');
    }
    
    return results;
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testScraper();
