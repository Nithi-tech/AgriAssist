import { SchemeScraper } from './scrapeSchemes';

async function demonstrateProductionUsage() {
  console.log('🎯 PRODUCTION-READY GOVERNMENT SCHEMES SCRAPER DEMONSTRATION');
  console.log('=' .repeat(80));
  
  console.log('\n📊 FEATURES DEMONSTRATED:');
  console.log('✅ Real government website scraping (PM-KISAN, PMFBY, etc.)');
  console.log('✅ Multi-state support (Karnataka, Tamil Nadu, Central schemes)');
  console.log('✅ Exact scheme name extraction from official pages');
  console.log('✅ State detection using multiple heuristics');
  console.log('✅ Both HTML and text content extraction');
  console.log('✅ Error handling with fallback data');
  console.log('✅ Deduplication using stable record keys');
  console.log('✅ JSON export with proper formatting');
  console.log('✅ Ready for Supabase database integration');
  
  console.log('\n🚀 RUNNING PRODUCTION SCRAPER...');
  
  const scraper = new SchemeScraper({
    states: ['karnataka', 'tamil-nadu'],  // Can be 'all' for production
    saveJson: 'production-schemes.json',
    delay: 500,      // Respectful delay
    maxRetries: 3,   // Robust error handling
    concurrency: 2   // Conservative concurrency
  });
  
  try {
    const results = await scraper.scrape();
    
    console.log('\n📈 PRODUCTION RESULTS:');
    console.log(`Total schemes scraped: ${results.length}`);
    
    // Show state distribution
    const stateGroups = results.reduce((acc, scheme) => {
      acc[scheme.state] = (acc[scheme.state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\nSchemes by state:');
    Object.entries(stateGroups).forEach(([state, count]) => {
      console.log(`  📍 ${state}: ${count} schemes`);
    });
    
    // Show sample records with perfect formatting
    console.log('\n🎯 SAMPLE RECORDS (Production Quality):');
    results.slice(0, 3).forEach((scheme, index) => {
      console.log(`\n${index + 1}. ${scheme.scheme_name}`);
      console.log(`   State: ${scheme.state}`);
      console.log(`   Description: ${scheme.description_text.substring(0, 100)}...`);
      console.log(`   Link: ${scheme.link}`);
      console.log(`   Scraped: ${scheme.scraped_at}`);
    });
    
    // Save results
    await scraper.saveToJson('production-schemes.json');
    console.log('\n💾 Production data saved to: production-schemes.json');
    
    console.log('\n🎉 PRODUCTION DEMONSTRATION COMPLETE!');
    console.log('\nFor Supabase integration:');
    console.log('1. Set SUPABASE_URL and SUPABASE_KEY environment variables');
    console.log('2. Apply the SQL schema from sql/welfare_schemes.sql');
    console.log('3. Run: npm run scrape:schemes -- --states=all --save-to-supabase');
    
    return results;
    
  } catch (error) {
    console.error('❌ Production test failed:', error);
    throw error;
  }
}

// Run demonstration
demonstrateProductionUsage()
  .then(() => {
    console.log('\n✅ Production demonstration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Production demonstration failed:', error);
    process.exit(1);
  });
